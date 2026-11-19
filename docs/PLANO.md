# Plano de execução

> Status: **PROPOSTA — aguardando "aprovado"**. Cada fase = uma branch `feature/fase-N-descricao` + uma PR (descrição, como testar, lista de premissas), commits convencionais (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`).
> Ver também: [ARQUITETURA.md](ARQUITETURA.md) · [MODELO-DADOS.md](MODELO-DADOS.md) · [API.md](API.md) · [PERGUNTAS-E-PREMISSAS.md](PERGUNTAS-E-PREMISSAS.md)

## Definição de pronto (vale para toda fase)

- [ ] Build e testes verdes no CI (backend e frontend).
- [ ] Services e regras críticas cobertos (transição de status, baixa/estorno de estoque, autorização por perfil).
- [ ] OpenAPI atualizada (`docs/openapi.json`).
- [ ] README e docs atualizados.
- [ ] Nenhum dado fixo de negócio no frontend.
- [ ] Dependency audit executado (`npm audit`, OWASP Dependency-Check/Dependabot) sem vulnerabilidade alta/crítica pendente.
- [ ] PR aberta com descrição, "como testar" e lista de premissas.
- [ ] Nenhum segredo no repositório (secret scan limpo).

---

## Fase 0 — Plano e scaffolding

Branch: `feature/fase-0-scaffolding` (os documentos de plano são entregues antes, para aprovação).

| # | Tarefa | Critério de aceite |
|---|---|---|
| 0.1 | Documentos: ARQUITETURA, PLANO, MODELO-DADOS (ER), API, PERGUNTAS-E-PREMISSAS | Aprovados pela cliente/responsável ("aprovado") |
| 0.2 | Estrutura do monorepo; mover `index.html` → `docs/legacy/index.html` (`git mv`); `.gitignore`, `.editorconfig`, `.env.example`, README raiz | Estrutura existe; histórico do arquivo preservado |
| 0.3 | Backend esqueleto: Spring Boot 4.1.x/Java 21, Maven wrapper, perfis dev/test/prod, Flyway com `V1` vazia/baseline, Actuator `health`, ProblemDetail global, Spotless, JaCoCo, ArchUnit, 1 teste de contexto com Testcontainers | `./mvnw verify` verde; `/actuator/health` → UP; `/` sem stack trace |
| 0.4 | Frontend esqueleto: Angular 22 standalone, rotas lazy (placeholders por módulo), ESLint, teste unitário, Playwright configurado, proxy para `:8080` | `ng build`, `ng lint`, `ng test` verdes |
| 0.5 | **Tema Tailwind v4** extraído do `index.html` (tokens de cor, tipografia, raios, utilitários `hover-lift`, scrollbar, `glass-header`); **fontes e Material Symbols self-hosted** | Nenhuma requisição externa em runtime (verificado no e2e); visual do shell comparado com `docs/legacy/index.html` |
| 0.6 | **Layout responsivo** (sidebar/header/menu recolhível/tabela→cards como componentes de UI kit), com itens de menu do protótipo; sem dados de negócio fixos (usuário/numérico em skeleton até a Fase 1) | Playwright: 390×844 e 1280×800 sem scroll horizontal; menu abre/fecha por teclado e toque; Lighthouse acessibilidade ≥ 95 |
| 0.7 | `docker-compose.yml` de desenvolvimento (Postgres 16 + volume), `make`/scripts de atalho | `docker compose up -d` + `./mvnw spring-boot:run` + `ng serve` sobem o sistema |
| 0.8 | CI (`.github/workflows/ci.yml`): backend verify + frontend lint/test/build + `npm audit` + secret scan | Roda em toda PR; falha bloqueia |
| 0.9 | `deploy.yml` com **apenas** `workflow_dispatch` (esqueleto, não executado) | Não dispara em push/PR |

---

## Fase 1 — Fundação e núcleo

Dividida em marcos (commits/sub-PRs revisáveis dentro da mesma branch/PR de fase; se ficar grande demais, proponho PRs empilhadas e confirmo com você).

### 1.A Segurança e usuários
| Tarefa | Critério de aceite |
|---|---|
| Migrations de `usuario`, `refresh_token`, `audit_log`, `configuracao` | Flyway aplica do zero; `ddl-auto=validate` passa |
| Login, refresh rotativo, logout, troca de senha, política de senha, lockout, rate limit | Testes: sucesso, senha errada, bloqueio após 5 falhas, reuso de refresh revoga a família, cookie `HttpOnly/Secure/SameSite=Strict` |
| Bootstrap do ADMIN por env + troca obrigatória | Sem env → app não cria usuário; com env → cria 1 vez; login redireciona para troca |
| CRUD de usuários (ADMIN) e autorização por perfil | Teste de matriz endpoint × papel verde (403 onde não permitido) |
| Headers de segurança, CORS restrito, handler de erros sem stack | Teste verifica headers e que erro 500 não vaza detalhes |
| Auditoria (listener + `audit_log`) | Criar/editar entidade grava autor, quando e diff sem PII desnecessária |
| Frontend: telas de login e troca de senha, `AuthService`, interceptor com refresh, `authGuard`/`roleGuard`, menu por perfil, política de privacidade | e2e: login → troca → dashboard; rota proibida redireciona; F5 mantém sessão via refresh |

### 1.B Cadastros
| Tarefa | Critério de aceite |
|---|---|
| Clientes + endereços (CRUD, busca, soft delete, anonimização) | Soft delete oculta; bloqueio se pedido ativo |
| Exportação LGPD (JSON/CSV) | Arquivo contém todos os dados do cliente e seus pedidos; ação auditada; só A/G |
| Produtos + categorias + foto (upload) | Validação de tipo/tamanho; arquivo servido só autenticado |
| Insumos + fornecedores (simples) | CRUD; unidade validada |
| Ficha técnica + custo/margem | Teste de cálculo com valores fixos (BigDecimal, arredondamento definido) |
| Frontend: listagens com filtro/paginação/ordenação (tabelas → cards no mobile), formulários reativos com validação | e2e mobile e desktop |

### 1.C Estoque
| Tarefa | Critério de aceite |
|---|---|
| Lotes + movimentações; entrada, ajuste, perda | Invariante saldo = Σ movimentações; movimentação imutável |
| Consumo FEFO transacional e concorrente | Teste com 2 transações simultâneas: nunca saldo negativo; ordem FEFO respeitada; lotes vencidos ignorados |
| Alertas (mínimo, a vencer, vencidos) | Limite configurável (padrão 7 dias) |
| Frontend: Estoque (insumos, lotes, entrada, extrato, alertas) | e2e: entrada de lote reflete no saldo |

### 1.D Pedidos
| Tarefa | Critério de aceite |
|---|---|
| CRUD de pedido + itens + snapshot de preço/endereço | Total calculado no servidor; edição restrita por status |
| `PedidoStatusMachine` + histórico | **Tabela de teste com todas as combinações de (de, para, papel)**; inválidas → 409 |
| Baixa automática em `EM_PRODUCAO` e estorno no cancelamento | Movimentações geradas e rastreáveis ao pedido; sem estoque → 422 com lista de faltantes e **nada** persistido (rollback) |
| Pagamentos (sinal e parciais), saldo a pagar | Não excede o total; estorno de pagamento |
| Foto de referência (upload) | jpeg/png/webp ≤ 5 MB; EXIF removido; nome randômico |
| Botão/endpoint wa.me | Mensagem montada a partir de modelo configurável; nenhum envio automático |
| Frontend: lista de pedidos, criação em etapas (cliente → itens → entrega → pagamento), detalhe com linha do tempo de status | e2e: orçamento → confirmado → em produção (baixa) → pronto → entregue; cancelar estorna |

### 1.E Painel com dados reais
| Tarefa | Critério de aceite |
|---|---|
| KPIs: faturamento + variação, pendentes (+ hoje), insumos a vencer, taxa de entrega no prazo | Definições conforme Q-09 a Q-14; testes com `Clock` fixo e dados semeados em teste |
| Tendência de vendas (7 dias / mês) | Série correta no fuso America/Sao_Paulo (inclui teste de virada de dia/mês) |
| Próximas entregas e insumos em alerta | Ordenação e limites corretos |
| Cards "IA" determinísticos: compra sugerida e otimização de escala | Testes de unidade com cenários fixos; **sem LLM** |
| Card "Bella Biel Intelligence" atrás de feature flag ("em breve") | Flag off por padrão |
| Frontend: Painel fiel ao protótipo, com estados de carregando/vazio/erro, sem número fixo | e2e + comparação visual com `docs/legacy/index.html`; busca global do header |

### 1.F Fechamento da Fase 1
- Seed **apenas no perfil `dev`** (dados do protótipo).
- Backup/restauração documentados e **testados** (script + `docs/RESTAURACAO.md` — versão preliminar; completa na entrega de deploy).
- Dockerfiles multi-stage e `docker-compose.prod.yml` com Caddy, rotina de backup, `docs/DEPLOY.md` (**preparados, não publicados**), Actuator `/health` sem detalhes.
- Revisão de segurança (checklist OWASP ASVS nível 1 aplicável + `dependency audit`), README, OpenAPI atualizada.

> Observação: o enunciado põe a preparação de deploy em seção própria sem fase explícita; proponho entregá-la **no fim da Fase 1** (itens "Backups" e LGPD estão nela). Confirme em Q-26.

---

## Fase 2 — Produção e Financeiro

| Tarefa | Critério de aceite |
|---|---|
| Produção: fila/kanban por dia derivada dos pedidos (agrupada por produto, com quantidades e prazos); mover cartão aplica a transição de status | Mover → EM_PRODUCAO baixa estoque; mover → PRONTO grava `pronto_em`; permissões A/G/P |
| "Aplicar" da sugestão de escala (reprograma `data_producao`) | Reagendamento auditado |
| Financeiro: contas a receber geradas dos pedidos (sinal/saldo), baixa manual de Pix, conciliação com pagamentos do pedido | Sem duplicar valor; consistência pedido × conta |
| Contas a pagar (fornecedores, categorias), vencimentos, baixa | CRUD e status |
| Fluxo de caixa (dia/mês) | Entradas × saídas conferem com contas pagas/recebidas |
| Painel passa a mostrar contas vencidas (se aprovado) | — |

## Fase 3 — Configurações avançadas e relatórios

Parâmetros adicionais (limites, tolerâncias, modelos de mensagem wa.me, texto de privacidade, dados da empresa), relatórios (vendas por período/produto/cliente, margem por produto, perdas e vencimentos, produtividade) com exportação CSV, melhorias de usabilidade levantadas nas fases anteriores.

---

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Spring Boot 4.x é recente (starters modularizados, Jackson 3) e parte do ecossistema (springdoc, MapStruct, Testcontainers) pode ter arestas | Validar a combinação de versões na 0.3 (`verify` + um endpoint documentado + um teste de integração) **antes** de avançar; fixar versões |
| Baixa de estoque concorrente | Lock pessimista por insumo, teste de concorrência obrigatório |
| Regras do painel ambíguas | Perguntas Q-09 a Q-14 antes da 1.E; definições registradas na PR |
| Fuso/horário de verão (hoje sem DST no Brasil, mas regra pode voltar) | Sempre `ZoneId` explícito, testes de virada de dia/mês |
| Backup na mesma máquina não é backup | Q-20 (cópia off-site) |
| Escopo da Fase 1 grande | Marcos 1.A–1.F com PRs empilhadas, se preferir |
