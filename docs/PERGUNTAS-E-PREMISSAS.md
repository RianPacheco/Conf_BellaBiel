# Perguntas em aberto e premissas

> Status: **aguardando respostas**. Para cada pergunta há um **padrão proposto**. Se você responder apenas "aprovado", adoto os padrões e os registro como premissas na PR de cada fase. Prioridade: 🔴 bloqueia o início da Fase 1 · 🟡 precisa antes do marco indicado · 🟢 pode seguir com o padrão.

## A. Perguntas

### Processo
| # | Pergunta | Padrão proposto |
|---|---|---|
| Q-01 🔴 | Este ambiente está configurado para eu desenvolver na branch `claude/relaxed-knuth-ytfqis`. Você pediu `feature/fase-N-descricao`. Posso criar e dar push nessas branches (e abrir uma PR por fase)? | Sim: `feature/fase-0-scaffolding`, `feature/fase-1-nucleo`… PR só quando você mandar abrir |
| Q-26 🟢 | A preparação de deploy (Dockerfiles, compose prod, Caddy, backup, DEPLOY.md, RESTAURACAO.md) não está atribuída a uma fase. Em qual entrar? | Fim da Fase 1 (marco 1.F); esqueleto de CI/deploy na Fase 0 |
| Q-23 🟢 | `groupId`/pacote Java e nome dos artefatos | `br.com.bellabiel.erp`; artefatos `bellabiel-api` e `bellabiel-web` |

### Acesso e permissões
| # | Pergunta | Padrão proposto |
|---|---|---|
| Q-03 🔴 | Matriz de permissões. Em que **GERENTE** difere de **ADMIN**? Quem pode ver **custo e margem**? Quem gerencia usuários? | ADMIN: tudo + usuários + configurações. GERENTE: tudo exceto usuários/configurações. ATENDENTE: clientes, pedidos (até CONFIRMADO, entrega/retirada), pagamentos; **não vê custo/margem**. PRODUCAO: pedidos CONFIRMADO+ (somente leitura + EM_PRODUCAO/PRONTO), insumos e estoque; não vê preços de venda nem financeiro. Painel: A/G completo; T e P só o que dizem respeito ao papel |
| Q-18 🟡 (1.A) | Recuperação de senha sem e-mail (integrações fora do v1): como? | ADMIN redefine e gera senha temporária (troca obrigatória). Para o ADMIN, procedimento documentado via variável de ambiente/CLI. Reset por e-mail só quando houver SMTP |

### Pedidos e estoque
| # | Pergunta | Padrão proposto |
|---|---|---|
| Q-04 🔴 | Transições: pode **voltar** de estágio (ex.: EM_PRODUCAO → CONFIRMADO, "reabrir" um ENTREGUE por erro)? Edição de pedido após confirmado? | Sem retrocesso nem reabertura. Itens/valores só editáveis em ORCAMENTO; depois de CONFIRMADO só data/observações/endereço (auditado). Correção de erro = cancelar e refazer. Exceção opcional: ADMIN reabre `CANCELADO` — ainda **não** previsto |
| Q-05 🔴 | Ao iniciar produção com **estoque insuficiente**: bloquear, permitir saldo negativo ou permitir com autorização? | **Bloquear** (422 com lista de insumos faltantes). GERENTE/ADMIN pode "forçar" com justificativa → registra movimentação de `AJUSTE` automática? (não implementar a menos que você confirme) |
| Q-06 🔴 | Cancelar um pedido **EM_PRODUCAO ou PRONTO**: devolve os insumos ao estoque (você pediu "cancelar estorna") ou, se a produção já ocorreu, vira **perda**? | Estorna sempre aos lotes originais, como pedido. Se o insumo já foi usado, o usuário faz depois um lançamento de `PERDA` manual com motivo |
| Q-07 🟡 (1.B) | Custo do insumo para o cálculo do custo/margem do produto: por **custo médio ponderado dos lotes com saldo**, **último custo de entrada**, ou **custo do lote que seria consumido (FEFO)**? | Custo médio ponderado dos lotes com saldo; se não houver saldo, último custo de entrada |
| Q-08 🟡 (1.B) | Unidades e receita: insumo tem **uma unidade base** (g, ml, un); a receita é na unidade do insumo. Cada produto tem **rendimento** (ex.: receita rende 24 macarons). Produto **sem ficha técnica** (ex.: item revendido): bloqueia a produção ou é ignorado na baixa? | Unidade base única por insumo, sem conversão automática (kg↔g só na entrada via campo de unidade de compra opcional). Rendimento obrigatório com padrão 1. Produto sem ficha: **ignorado na baixa** (com aviso visível no pedido) |
| Q-15 🟡 (1.D) | **Sinal**: é obrigatório para confirmar o pedido? Qual o valor mínimo (valor fixo ou %)? | Não obrigatório; sistema só registra e mostra saldo a pagar. Se quiser regra (ex.: 30 % para encomendas acima de R$ X), me diga |
| Q-16 🟡 (1.D) | Existem **desconto** e **taxa de entrega** no pedido? A taxa é calculada (por bairro/distância) ou digitada? | Ambos digitados manualmente (campos já no modelo). Sem tabela de frete |
| Q-25 🟢 | Pedido de balcão sem cliente cadastrado | Cliente obrigatório (cadastro rápido nome+telefone no próprio fluxo) |
| Q-17 🟢 | Duplicidade de cliente (mesmo telefone) | Não bloqueia; alerta "já existe cliente com este telefone" |
| Q-24 🟡 (1.B) | Fornecedor: criar cadastro simples já na Fase 1 (lote guarda fornecedor) ou só na Fase 2 (contas a pagar)? | Já na Fase 1, cadastro mínimo (nome, telefone) |

### Painel
| # | Pergunta | Padrão proposto |
|---|---|---|
| Q-11 🔴 | **Faturamento mensal**: por qual data e quais pedidos? (a) data de **entrega**, só ENTREGUE/RETIRADO; (b) data de **confirmação**, todos os confirmados; (c) **caixa**: pagamentos recebidos no mês. Variação vs. mês anterior: mês anterior **inteiro** ou **mesmo período** (dias 1..hoje)? | (a) por competência: pedidos ENTREGUE/RETIRADO com `entregue_em` no mês (fuso SP), valor_total; comparação com **mesmo período** do mês anterior; mês anterior zerado → "—". A tendência de vendas usa a mesma base |
| Q-13 🔴 | **Pedidos pendentes**: quais status? "Para hoje" = `data_entrega_prevista` no dia (SP)? Orçamento conta? | Pendentes = CONFIRMADO, EM_PRODUCAO e PRONTO (orçamento **não** conta). "Para hoje" = entrega prevista hoje em America/Sao_Paulo, dentre os pendentes |
| Q-14 🟡 (1.E) | **Insumos a vencer**: contar insumos distintos ou lotes? Só lotes com saldo > 0? Lotes já vencidos entram? Limite padrão 7 dias, configurável. "Urgente" = quando? | Conta **lotes com saldo > 0** com validade entre hoje e hoje+limite; vencidos aparecem à parte como "Vencidos" (não consumidos pelo FEFO). "Urgente" quando houver ≥ 1 |
| Q-12 🔴 | **Taxa de entrega no prazo**: base e tolerância. Pedidos de retirada contam? Quais meses/janela? | Base: pedidos ENTREGUE/RETIRADO no mês; "no prazo" = `entregue_em ≤ data_entrega_prevista + tolerância` (padrão **15 min**, configurável); retirada mede `pronto_em ≤ data_entrega_prevista` (o cliente pode atrasar a busca). Sem pedidos no mês → "—" |
| Q-09 🟡 (1.E) | **Compra sugerida**: horizonte dos pedidos considerados (ex.: próximos 7 dias?), considerar estoque mínimo, e o que o botão "Comprar" faz (v1 sem integração) | Considera pedidos **CONFIRMADO** com entrega nos próximos **7 dias** (configurável). Sugestão = `max(0, consumo_projetado + estoque_mínimo − saldo_utilizável)`. Aparece só se > 0, ordenado pela urgência (tempo até acabar). Botão "Comprar" → abre **Registrar entrada de lote** com o insumo e a quantidade sugerida pré-preenchidos (não faz compra externa) |
| Q-10 🟡 (1.E) | **Otimização de escala**: o que é "dia de produção" do pedido? Hoje o modelo só tem data de entrega. Qual é a regra de agrupamento (mesmo produto em dias diferentes → mesmo dia)? Há antecedência mínima por produto? | Novo campo `data_producao` (data) opcional no pedido (padrão = dia da entrega; editável). Regra: para um mesmo produto, se há ≥ 2 pedidos CONFIRMADOS em datas de produção **diferentes** dentro de uma janela de 3 dias, sugere agrupar na data do pedido **mais cedo** que ainda respeite que `data_producao ≤ data_entrega`. Em F1 o botão "Aplicar" vira "Ver pedidos" (informativo); aplicar de fato entra na Fase 2 (Produção). Sem antecedência por produto no v1 |

### LGPD, infra e operação
| # | Pergunta | Padrão proposto |
|---|---|---|
| Q-19 🟡 (1.B) | Retenção e eliminação de dados de cliente: por quanto tempo guardar? Ao pedir exclusão de quem tem pedidos: anonimizar mantendo os pedidos? Há DPO/responsável a citar na política? | Anonimização (pedidos preservados para fins financeiros/fiscais), sem prazo automático de expurgo no v1. Política de privacidade com texto-base e campos de contato editáveis; **revisão jurídica é responsabilidade de vocês** |
| Q-20 🟡 (1.F) | Backup **off-site** (cópia fora do VPS): onde? | Compose guarda dumps no volume local do VPS + documentação para `rclone` (Google Drive/S3/Backblaze). Backup só local **não** protege contra perda do servidor |
| Q-21 🟢 | VPS alvo (provedor, SO, RAM), domínio e se vocês têm Docker na máquina de desenvolvimento | Ubuntu LTS, ≥ 2 GB RAM, domínio próprio apontado por A/AAAA, Docker/Compose no dev |
| Q-22 🟢 | Modo escuro | Fora do v1 (o protótipo só define paleta clara) |

## B. Premissas assumidas (já adotadas no plano)

**Produto e escopo**
1. Um único estabelecimento; sem multi-tenant, sem multi-filial. Idioma pt-BR, BRL, America/Sao_Paulo.
2. v1 sem integrações externas, NF-e e PWA. WhatsApp = só link `wa.me` com mensagem pronta. Pix registrado manualmente. Interfaces de extensão deixadas prontas.
3. O menu mantém os itens do protótipo: **Painel, Vendas, Produção, Estoque, Financeiro, Configurações**. "Vendas" abriga Pedidos, Clientes e Produtos (subitens). "Estoque" abriga Insumos, Lotes e Movimentações. "Configurações" abriga Usuários e Parâmetros. *(Se quiser outra organização, é barato mudar agora.)*
4. Produção (Fase 2) é **derivada dos pedidos** (não há cadastro de ordem de produção separado).
5. Pedidos nascem como `ORCAMENTO`; `ENTREGUE` vale para tipo ENTREGA e `RETIRADO` para RETIRADA.
6. Preço e endereço do pedido são **copiados** (snapshot) para o item/pedido; alterar o produto depois não altera pedidos antigos.
7. "Gestora Master" = papel `ADMIN`. O avatar do usuário é de iniciais (sem foto de perfil no v1).
8. O sino de notificações do header lista alertas derivados (entregas de hoje, insumos a vencer, estoque baixo) — **sem push e sem persistência**.
9. A busca global do header busca pedidos (número/cliente), clientes e produtos, respeitando o papel.

**Técnicas**
10. Spring Boot **4.1.2** (última estável em 19/11/2026; a 4.2.0 ainda é RC) e Angular **22.3**, Tailwind **4.3**, Playwright **1.65** — confirmados no registro de pacotes. Nomes de starters do Boot 4 e compatibilidade de springdoc/MapStruct/Testcontainers serão validados no marco 0.3 (risco registrado em PLANO.md).
11. Java 21 (LTS), Maven com wrapper, Postgres 16+, Node 22 LTS.
12. JWT HS256 (instância única, segredo em env). RS256 só se houver mais de um emissor/consumidor.
13. Rate limit em memória (instância única).
14. Produção: Caddy roteando `/` e `/api` no **mesmo domínio**.
15. Gráfico do painel em SVG/CSS próprios (sem biblioteca), para manter o visual do protótipo.
16. Seed de exemplo **somente** no perfil `dev`; produção nasce vazia (só o ADMIN do bootstrap).
17. Testes de integração com Postgres real via Testcontainers (exige Docker no CI — GitHub Actions já tem).
18. Cobertura-alvo ≥ 85 % nos services/domínio; 100 % das transições de status testadas.

**Segurança e LGPD**
19. Política de senha: ≥ 12 caracteres, sem senhas comuns, sem reuso das 3 últimas, sem expiração periódica. Lockout após 5 tentativas (15 min, progressivo).
20. Refresh token válido por 7 dias, rotativo, com detecção de reuso.
21. EXIF removido de fotos enviadas; arquivos armazenados fora do diretório servido estaticamente.
22. Retenção de `audit_log`: indefinida no v1 (sem PII sensível no diff).
23. Cookies e política de privacidade: o sistema usa apenas cookie estritamente necessário (refresh); sem analytics/trackers, portanto **sem banner de consentimento**.

**Fora do escopo v1 (reconfirmado)**: integrações externas, nota fiscal, PWA, dark mode, multi-idioma, múltiplas moedas.
