# Arquitetura — Bella Biel ERP

> Status: **PROPOSTA — aguardando "aprovado"**. Nenhum código de aplicação foi escrito.
> Documentos relacionados: [PLANO.md](PLANO.md) · [MODELO-DADOS.md](MODELO-DADOS.md) · [API.md](API.md) · [PERGUNTAS-E-PREMISSAS.md](PERGUNTAS-E-PREMISSAS.md)

## 1. Contexto e restrições

- Um único cliente (Bella Biel Confeitaria). **Sem multi-tenant.**
- pt-BR, BRL, fuso `America/Sao_Paulo`.
- Ponto de partida: `index.html` (protótipo estático da tela "Painel", Tailwind via CDN, dados fixos). Será movido para `docs/legacy/index.html` como referência visual.
- Equipe pequena, uma instância em um VPS. Prioridade: simplicidade operacional, segurança e correção das regras de negócio — não escala horizontal.

## 2. Visão geral

```
                    Internet
                       │  HTTPS (Caddy, certificado automático)
                ┌──────▼──────┐
                │    Caddy    │  mesmo domínio: /  → frontend, /api → backend
                └───┬──────┬──┘
        estáticos   │      │  /api/v1/**
         ┌──────────▼┐   ┌─▼───────────────┐      ┌─────────────┐
         │  Nginx    │   │ Spring Boot API │─────▶│ PostgreSQL  │
         │ (Angular) │   │ (monolito       │      │ (volume)    │
         └───────────┘   │  modular)       │      └─────────────┘
                         │  StorageService │──▶ disco (volume) → S3 no futuro
                         └─────────────────┘
```

**Decisão: mesmo origin em produção** (Caddy roteia `/api` para o backend). Justificativa: cookie `SameSite=Strict` do refresh token funciona sem exceções, CORS some em produção, e a CSP fica simples. Em desenvolvimento, o `ng serve` usa proxy para `:8080`; CORS continua restrito e configurável por variável de ambiente (`APP_CORS_ALLOWED_ORIGINS`) para o caso de domínios separados.

## 3. Estrutura do monorepo

```
/
├── backend/            # Spring Boot (Maven)
├── frontend/           # Angular
├── deploy/             # Caddyfile, compose prod, scripts de backup, Dockerfiles auxiliares
├── docs/
│   ├── legacy/index.html
│   └── *.md
├── .github/workflows/  # ci.yml (toda PR), deploy.yml (somente workflow_dispatch)
├── docker-compose.yml  # desenvolvimento (Postgres + Mailpit opcional)
├── .env.example
└── README.md
```

## 4. Backend

### 4.1 Stack (versões confirmadas no registro em 19/11/2026)

| Item | Escolha | Observação |
|---|---|---|
| Java | 21 (LTS) | Virtual threads **desligadas** por padrão (sem necessidade) |
| Spring Boot | **4.1.2** (última estável; 4.2.0 está em RC) | Spring Framework 7. Boot 4 modularizou starters: os nomes exatos (ex.: Flyway, Testcontainers) serão validados no scaffolding |
| Build | Maven (com wrapper) | |
| Persistência | Spring Data JPA + Hibernate, PostgreSQL 16+ | |
| Migrations | Flyway | `ddl-auto=validate` sempre |
| Segurança | Spring Security (resource server JWT) | |
| API docs | springdoc-openapi 3.x | Swagger UI só em `dev`; spec gerada no build e versionada em `docs/openapi.json` |
| Mapeamento | MapStruct 1.6.x | |
| Rate limit | Bucket4j (em memória) | Instância única → suficiente; interface permite trocar por Redis |
| Testes | JUnit 5, Mockito, Testcontainers, ArchUnit | Banco real (Postgres) nos testes de integração, nunca H2 |
| Qualidade | Spotless (formatação), OWASP Dependency-Check ou `mvn versions`/Dependabot | Auditoria de dependências no CI |

### 4.2 Organização: monolito modular por feature

Pacote raiz `br.com.bellabiel.erp` (ver pergunta Q-23). Cada feature é um pacote com camadas internas:

```
br.com.bellabiel.erp
├── common/        # erro (ProblemDetail), paginação, auditoria, tempo (Clock), dinheiro, storage
├── auth/          # login, refresh, logout, troca de senha, lockout, rate limit
├── usuarios/
├── clientes/
├── produtos/      # produto + ficha técnica (receita) + cálculo de custo/margem
├── insumos/
├── estoque/       # lotes, movimentações, FEFO, alertas de validade
├── pedidos/       # pedido, itens, pagamentos, máquina de estados, uploads
├── producao/      # Fase 2 — fila/kanban derivada de pedidos
├── financeiro/    # Fase 2 — contas a receber/pagar, fluxo de caixa
├── dashboard/     # consultas de leitura agregadas + regras "IA" determinísticas
└── config/        # parâmetros do sistema e feature flags
```

Dentro de cada feature: `XController → XService → XRepository`, `dto/` (records), `XMapper`, entidade JPA (nunca exposta).

**Regras de fronteira (verificadas por ArchUnit no CI):**
1. Controller só chama Service da própria feature; Repository só é usado pelo Service da própria feature.
2. Uma feature **não** acessa o Repository de outra: usa o Service/API pública dela (ex.: `pedidos` pede baixa a `estoque.EstoqueService`).
3. `dashboard` é a exceção controlada: usa queries de leitura próprias (projeções) para agregação, sem alterar estado.
4. Sem dependência cíclica entre features (`pedidos → estoque → insumos`; `estoque` nunca chama `pedidos`; ligação inversa via referência `pedido_id` em movimentação).

### 4.3 Convenções transversais

- **DTOs como `record`**, com Bean Validation. Entidades JPA nunca saem da camada de service.
- **API** `/api/v1`. Listagens com `page`, `size` (máx. 100), `sort=campo,asc|desc` e filtros por query string; resposta paginada `{content, page, size, totalElements, totalPages}`.
- **Erros** RFC 7807 (`ProblemDetail`) com `type`, `title`, `status`, `detail`, `instance` e, para validação, `errors[]` (`field`, `message`). Handler global: nunca devolve stack trace nem mensagem de exceção interna (apenas `traceId` correlacionável nos logs).
- **Dinheiro**: `BigDecimal`, `NUMERIC(12,2)`, arredondamento `HALF_UP` centralizado em um único utilitário. Quantidades de insumo: `NUMERIC(14,4)`.
- **Tempo**: colunas `TIMESTAMPTZ` (UTC); `Instant`/`OffsetDateTime` no código; um bean `Clock` injetável (testável). Cálculos de "hoje", "mês" e "7 dias" usam `America/Sao_Paulo` explicitamente. Datas sem hora (validade, vencimento) são `DATE`.
- **Auditoria**: `created_at/by`, `updated_at/by` nas entidades principais (via `@EntityListeners` + `SecurityContext`) e tabela `audit_log` (entidade, id, ação, usuário, instante, diff em JSONB) alimentada por listener JPA. Sem dados pessoais desnecessários no diff (campos sensíveis mascarados).
- **Soft delete** em `cliente` e `pedido` (`deleted_at`, filtro automático em todas as consultas). Demais entidades usam flag `ativo`.
- **Concorrência**: `@Version` em pedido, produto e lote (otimista). Baixa de estoque usa `SELECT … FOR UPDATE` nos lotes do insumo, ordenados por validade (FEFO), dentro da mesma transação da mudança de status.
- **Perfis**: `dev` (seed de exemplo, Swagger, logs verbosos), `test` (Testcontainers), `prod` (sem seed, Swagger off, cookies `Secure`, HSTS). Configuração 100% por variáveis de ambiente.
- **Logs**: JSON estruturado em `prod`, com `traceId`; sem nome, telefone, e-mail, endereço ou conteúdo de observações. Identificar por id.

### 4.4 Domínio — regras críticas

**Máquina de estados do pedido** (implementada em um único lugar, `PedidoStatusMachine`, com tabela de transições + papel permitido; transições inválidas → `409 Conflict` ProblemDetail):

```
ORCAMENTO ──▶ CONFIRMADO ──▶ EM_PRODUCAO ──▶ PRONTO ──▶ ENTREGUE   (tipo ENTREGA)
    │             │               │             │   └──▶ RETIRADO   (tipo RETIRADA)
    └─────────────┴───────────────┴─────────────┴──▶ CANCELADO
```

Terminais: ENTREGUE, RETIRADO, CANCELADO. Toda transição grava `pedido_status_historico` (de, para, usuário, instante, motivo).

**Baixa de estoque** (`CONFIRMADO → EM_PRODUCAO`), na mesma transação:
1. Para cada item: consumo = `quantidade_item × quantidade_na_ficha ÷ rendimento` por insumo.
2. Agrega por insumo; consome lotes por **FEFO** (menor validade primeiro; lotes vencidos não são consumidos).
3. Cada consumo gera uma `movimentacao_estoque` (`SAIDA_PRODUCAO`, lote, quantidade, `pedido_id`). **O saldo do lote só muda junto com uma movimentação** (invariante imposta por um único método de serviço e por constraint/trigger de verificação em teste).
4. Estoque insuficiente → regra pendente (Q-05); por padrão a transição é bloqueada com a lista de insumos faltantes.

**Cancelamento** com baixa já feita: gera movimentações `ESTORNO` devolvendo a quantidade **aos mesmos lotes** de onde saiu (rastreável pela movimentação original). Pendente Q-06 se após `PRONTO` o insumo é devolvido ou vira perda.

**Custo e margem do produto**: custo = Σ(qtd_insumo × custo_unitário) ÷ rendimento; margem = (preço − custo) ÷ preço. Custo unitário do insumo: ver Q-07 (padrão proposto: custo médio ponderado dos lotes com saldo).

**Dashboard (regras determinísticas, sem LLM)**: ver detalhes e definições em PERGUNTAS-E-PREMISSAS.md (Q-09 a Q-14). Toda regra é uma classe pura, testada com dados fixos, que recebe um `Clock`.

### 4.5 Segurança

| Tema | Decisão |
|---|---|
| Access token | JWT assinado (HS256, segredo ≥ 256 bits via env), 15 min, claims: `sub`, `roles`, `mustChangePassword`. **Mantido só em memória** no frontend (signal), nunca em storage |
| Refresh token | Opaco aleatório (256 bits), em cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`. No banco só o **hash SHA-256**; **rotativo** com detecção de reuso (token reutilizado → revoga toda a família). Validade padrão 7 dias, configurável. Logout e troca de senha revogam |
| CSRF | Endpoints autenticados usam `Authorization: Bearer` (imune a CSRF). `/auth/refresh` e `/auth/logout` dependem de cookie: protegidos por `SameSite=Strict` + exigência de header `X-Requested-With` + verificação de `Origin` |
| Senhas | BCrypt custo 12. Política: mín. 12 caracteres, sem senhas comuns (lista embarcada), diferente das últimas 3. Sem expiração periódica |
| Login | Rate limit por IP+usuário (Bucket4j); após 5 falhas, bloqueio temporário progressivo (15 min); mensagem genérica ("credenciais inválidas"); tempo de resposta equalizado para usuário inexistente |
| Primeiro ADMIN | Criado no startup se não existir nenhum ADMIN, a partir de `APP_BOOTSTRAP_ADMIN_EMAIL` e `APP_BOOTSTRAP_ADMIN_PASSWORD`; `must_change_password = true`. Sem credencial default em código |
| Autorização | `@PreAuthorize` por endpoint (papéis na matriz de API.md) **e** teste automatizado que percorre todos os endpoints × papéis. Rotas do frontend com guards equivalentes (o backend é a fonte da verdade) |
| Headers | CSP restritiva (`default-src 'self'`; `frame-ancestors 'none'`; imagens `self data: blob:`), HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Permissions-Policy` mínima. Aplicados no Caddy/Nginx (frontend) e no Spring (API) |
| Entradas | Bean Validation em todo DTO; tamanhos máximos; whitelist de campos de ordenação; JPA parametrizado (sem SQL concatenado) |
| Uploads | jpeg/png/webp, máx. 5 MB, validação por **magic bytes** (não confia em `Content-Type`), nome randômico (UUID), **remoção de EXIF** (pode conter GPS), servido por endpoint autenticado com `Content-Disposition`/`nosniff`; atrás de `StorageService` (`LocalDiskStorageService` agora, S3 depois) |
| Erros/logs | Sem stack trace nas respostas; logs sem dados pessoais |
| Segredos | Somente env vars; `.env` no `.gitignore`; `.env.example` documentado; secret scanning no CI |

### 4.6 LGPD

- Base legal e finalidade documentadas na política de privacidade (execução de contrato/atendimento de pedido).
- **Exportação** dos dados de um cliente (JSON/CSV): `GET /clientes/{id}/exportacao` (ADMIN/GERENTE), registrada em audit log.
- **Eliminação/anonimização**: soft delete do cliente; opção de **anonimizar** (substitui nome/telefone/e-mail/endereço por valores neutros, preservando pedidos para fins fiscais/financeiros). Prazos de retenção a confirmar (Q-19).
- Minimização: log e audit_log sem PII desnecessária; sem IP em refresh token por padrão (apenas hash do user-agent resumido, opcional).
- Página pública `/privacidade` (conteúdo editável por ADMIN em Configurações, com texto-base fornecido por nós para revisão jurídica).

## 5. Frontend

### 5.1 Stack

Angular **22** (última estável), standalone components, signals, `provideRouter` com rotas lazy (`loadChildren`) por feature, reactive forms tipados, `HttpInterceptor` (token + refresh + tratamento de ProblemDetail), guards funcionais por perfil, `@angular/build` (esbuild). Tailwind **v4** instalado no build (`@tailwindcss/postcss` ou plugin Vite/esbuild — sem CDN). ESLint (`angular-eslint`), testes unitários com o runner padrão da CLI, e2e com Playwright.

### 5.2 Estrutura

```
frontend/src/app
├── core/        # auth (AuthService, interceptors, guards), api client, config, erros, tempo
├── shared/      # ui kit: botão, card, badge de status, tabela responsiva, modal, form-field, pipes (BRL, data pt-BR)
├── layout/      # shell: sidebar, header, menu recolhível (mobile)
└── features/    # auth, dashboard, clientes, produtos, insumos, estoque, pedidos, producao, financeiro, configuracoes, usuarios, privacidade
```

- Estado: serviços com `signal`/`computed` por feature (sem NgRx — complexidade desnecessária aqui). Dados do servidor via `HttpClient` + `resource()`/`rxResource` onde fizer sentido.
- Locale `pt-BR`, `LOCALE_ID` global, `DEFAULT_CURRENCY_CODE = 'BRL'`, datas exibidas em `America/Sao_Paulo`.
- **Nenhum dado fixo**: todo número/texto de negócio vem da API; estados de carregando (skeleton), vazio e erro em toda tela.

### 5.3 Identidade visual (fidelidade ao protótipo)

Extraída do `tailwind.config` do `index.html` para o tema do Tailwind v4 (`@theme` em CSS):
- **Paleta**: todos os tokens (primary `#8a3349`, background `#fdf6f5`, surface, surface-container-*, outline/-variant, secondary, tertiary, error e seus `on-*`, `*-fixed`, `*-container`) tal como no protótipo, como variáveis CSS.
- **Tipografia**: Inter (corpo), Geist (títulos/labels), Alex Brush (logotipo); escala `label-md`, `headline-lg`, `headline-md`, `body-lg`, `body-md` preservada.
- **Raios**: DEFAULT 0.25rem, lg 0.5rem, xl 0.75rem, full.
- **Componentes**: sidebar de 16rem com item ativo (`border-l-2` + `bg-primary-container/10`), header translúcido com blur ("glass-header"), cards `bg-surface border-outline-variant rounded-xl shadow-sm`, bento grid de 12 colunas, scrollbar customizada, `hover-lift`.
- **Dark mode**: o protótipo declara `darkMode: "class"`, mas só define a paleta clara. **Fora do escopo v1** (Q-22).
- **Fontes self-hosted** via pacotes npm (`@fontsource-variable/inter`, `@fontsource/geist`/`geist`, `@fontsource/alex-brush`, `material-symbols` com subset dos ícones usados para reduzir peso). Nenhuma requisição a Google Fonts em runtime (privacidade/LGPD e CSP).
- **Imagens**: as URLs do googleusercontent são removidas. Foto de produto/pedido = upload do usuário (via `StorageService`); sem foto → placeholder SVG local (ícone de confeitaria na paleta). Avatar do usuário = iniciais.

### 5.4 Responsividade (mobile-first)

- Breakpoints Tailwind padrão; escrever do menor para o maior.
- **Menu**: sidebar fixa ≥ `lg`; abaixo disso vira drawer recolhível (botão hambúrguer no header, foco preso e `Esc` fecha). O header perde a largura fixa de busca (`w-96`) e a busca vira ícone expansível.
- **Tabelas viram cards** abaixo de `md` (componente `ResponsiveTable` com template de linha e template de card, mesmos dados e ações).
- Alvos de toque ≥ 44 px; formulários em coluna única no mobile; gráfico do painel com rolagem/legibilidade em 360 px. Testes e2e em viewport 390×844 e 1280×800.
- Acessibilidade: landmarks, foco visível, contraste AA, `aria-*` em menu/modal, labels em todos os campos.

### 5.5 Autenticação no frontend

`AuthService` guarda o access token em um `signal` (memória). Ao carregar a página (F5) chama `POST /auth/refresh` (cookie) para reidratar a sessão; enquanto isso, o app mostra um splash. O interceptor anexa o token, e em `401` tenta **um** refresh (fila única para requisições concorrentes) e repete a chamada; falhou → logout. `mustChangePassword` redireciona para a troca obrigatória. Guards: `authGuard`, `roleGuard(['ADMIN',…])`; o menu esconde o que o perfil não pode acessar.

## 6. Dados e migrations

- Flyway em `backend/src/main/resources/db/migration` (`V1__…`, nunca editar migration aplicada). Seed de exemplo em `db/dev/` carregada só no perfil `dev` (`spring.flyway.locations` condicional): Ana Paula Silveira, Carlos Eduardo, Empresa Alpha Tech, Mariana Dias, Kit Macarons, Bolo Casamento, Caixa Brownie, 50 Cupcakes, Farinha de Trigo Especial, Manteiga sem Sal, Farinha de Amêndoas, etc.
- Modelo completo: [MODELO-DADOS.md](MODELO-DADOS.md).

## 7. Testes e qualidade

| Camada | O quê | Ferramenta |
|---|---|---|
| Unitário backend | Services e regras (máquina de estados, FEFO, baixa/estorno, custo/margem, regras do painel) | JUnit 5 + Mockito, `Clock` fixo |
| Integração backend | Repositórios, migrations, endpoints com segurança real, concorrência de baixa de estoque | Testcontainers (Postgres) + MockMvc |
| Segurança | Matriz endpoint × papel (gerada por reflexão), lockout, rotação/reuso de refresh | JUnit |
| Arquitetura | Fronteiras entre features | ArchUnit |
| Frontend unit | Services, guards, interceptors, pipes, componentes críticos | runner da CLI |
| e2e | login+troca de senha, criar pedido→confirmar→produzir→entregar (com baixa de estoque), autorização por perfil, layout mobile | Playwright |
| Lint/format | ESLint, Spotless | CI |
| Dependências | `npm audit`, OWASP Dependency-Check/Dependabot | CI |

Cobertura mínima-alvo para services/regras críticas: **≥ 85 %** de linhas e 100 % das transições de status (incluindo as inválidas). Será imposta por JaCoCo no pacote `*.service` e `*.domain`.

## 8. Deploy (preparar, não publicar)

- **Dockerfile backend**: multi-stage (Maven/JDK 21 → JRE 21 slim, usuário não-root, `HEALTHCHECK`, camadas do Spring Boot).
- **Dockerfile frontend**: multi-stage (Node → Nginx unprivileged servindo estáticos, `try_files` para SPA, headers de segurança, cache com hash).
- `deploy/docker-compose.prod.yml`: Caddy (HTTPS automático; `/api` → backend, `/` → frontend), API, frontend, Postgres 16 com volume nomeado, uploads em volume, rede interna (só o Caddy publica 80/443), segredos via `.env` do servidor.
- **Backup**: container/rotina com `pg_dump -Fc` diário, retenção configurável (padrão proposto: 14 diários + 8 semanais), verificação do dump, cópia dos uploads; `docs/RESTAURACAO.md` com procedimento e **teste de restauração** documentado (script que restaura em banco temporário e roda consultas de sanidade). Cópia off-site: Q-20.
- **CI** (`.github/workflows/ci.yml`): em toda PR — backend (build + testes + JaCoCo + Spotless + dependency check), frontend (lint + testes + build + `npm audit`), e2e opcionais, secret scan. **Deploy** (`deploy.yml`): apenas `workflow_dispatch`, com `environment` protegido; **não será executado**.
- **Actuator**: só `health` (e `info` básico) expostos, `show-details=never`, em porta/rota controlada; demais endpoints desligados.
- `docs/DEPLOY.md`: passo a passo para VPS (hardening básico, firewall, Docker, DNS, `.env`, `docker compose up`, verificação, atualização e rollback).

## 9. Pontos de extensão (v1 sem integrações)

Interfaces no domínio, com implementação "nula/manual" agora:

| Interface | Implementação v1 | Futuro |
|---|---|---|
| `StorageService` | Disco | S3/compatível |
| `NotificacaoClienteGateway` | Gera link `wa.me` com mensagem pronta (monta texto; não envia) | API WhatsApp Business |
| `PagamentoGateway` | Registro manual (Pix informado pela equipe) | Pix/cobrança automática |
| `DocumentoFiscalGateway` | Inexistente (não emitido) | NFC-e/NF-e |
| `RateLimiter` | Bucket4j em memória | Redis |

## 10. Principais decisões e alternativas descartadas

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| Monolito modular | Microsserviços | Um cliente, uma equipe; custo operacional sem benefício |
| Mesmo origin em prod | Domínios separados | Cookie Strict + CORS mais simples e seguro |
| JWT curto em memória + refresh rotativo em cookie | JWT em localStorage | Mitiga roubo por XSS |
| Estoque por lotes + movimentações | Saldo único editável | Exigência de FEFO, validade e rastreabilidade |
| audit_log próprio | Hibernate Envers | Mais controle sobre PII e diff legível; menos tabelas-sombra |
| Sem NgRx | NgRx | Signals bastam para o tamanho do app |
| Gráfico em SVG/CSS próprio | Lib de gráficos | Preserva a identidade do protótipo, zero dependência |
| Rate limit em memória | Redis | Instância única |
