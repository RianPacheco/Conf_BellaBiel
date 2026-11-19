# API REST `/api/v1` — lista de endpoints

> Status: **PROPOSTA** (contrato final = OpenAPI gerada pelo springdoc, versionada em `docs/openapi.json`).
> Papéis: **A** = ADMIN (Gestora Master) · **G** = GERENTE · **T** = ATENDENTE · **P** = PRODUCAO. A matriz abaixo é a proposta; pontos em aberto em Q-03.
> Convenções: JSON, `Authorization: Bearer <jwt>`; listagens com `?page=&size=&sort=campo,asc&…filtros`; erros em RFC 7807 (`application/problem+json`); datas ISO-8601 (instantes em UTC com `Z`; o frontend exibe em America/Sao_Paulo).
> Fase: **F1** salvo indicação.

## Auth e usuários

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `POST /auth/login` | e-mail+senha → access token (corpo) + refresh (cookie HttpOnly). Rate limit + lockout | público |
| `POST /auth/refresh` | rotaciona refresh (cookie) → novo access token | cookie |
| `POST /auth/logout` | revoga o refresh atual e limpa o cookie | autenticado |
| `POST /auth/logout-all` | revoga todas as sessões do usuário | autenticado |
| `POST /auth/change-password` | senha atual + nova (política). Obrigatória se `mustChangePassword`; revoga sessões | autenticado |
| `GET /auth/me` | perfil, papel, flags (`mustChangePassword`) | autenticado |
| `GET /usuarios` · `POST /usuarios` | listar / criar (senha temporária, `mustChangePassword=true`) | A |
| `GET/PUT /usuarios/{id}` | consultar / editar (nome, perfil) | A |
| `POST /usuarios/{id}/ativar` · `/desativar` | ativa/desativa (desativar revoga tokens) | A |
| `POST /usuarios/{id}/redefinir-senha` | gera senha temporária (sem e-mail — Q-18) | A |

## Clientes

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `GET /clientes?q=&page=` | busca por nome/telefone | A G T |
| `POST /clientes` | criar | A G T |
| `GET /clientes/{id}` | detalhe (+ endereços) | A G T |
| `PUT /clientes/{id}` | editar | A G T |
| `DELETE /clientes/{id}` | soft delete (bloqueia se houver pedido não terminal) | A G |
| `POST /clientes/{id}/anonimizar` | anonimização LGPD | A |
| `GET /clientes/{id}/exportacao?formato=json\|csv` | exportação LGPD (registrada em auditoria) | A G |
| `GET/POST /clientes/{id}/enderecos` · `PUT/DELETE …/{enderecoId}` | endereços | A G T |
| `GET /clientes/{id}/pedidos` | histórico do cliente | A G T |

## Produtos e ficha técnica

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `GET /produtos?q=&categoriaId=&ativo=` | listar | A G T P |
| `POST /produtos` · `PUT /produtos/{id}` | criar / editar | A G |
| `POST /produtos/{id}/ativar` · `/desativar` | | A G |
| `GET /produtos/{id}` | detalhe + custo e margem calculados | A G (custo/margem ocultos para T e P) |
| `GET/PUT /produtos/{id}/ficha-tecnica` | ler / substituir receita (itens insumo+quantidade, rendimento) | leitura A G P · escrita A G |
| `POST /produtos/{id}/foto` · `DELETE …/foto` | upload/remoção da foto | A G |
| `GET/POST /categorias-produto` · `PUT/DELETE …/{id}` | categorias | leitura todos · escrita A G |

## Insumos e estoque

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `GET /insumos?q=&ativo=&abaixoDoMinimo=` | listar com saldo atual e próxima validade | A G P |
| `POST /insumos` · `PUT /insumos/{id}` | criar / editar | A G P |
| `POST /insumos/{id}/ativar` · `/desativar` | | A G |
| `GET /insumos/{id}/lotes` | lotes com saldo, ordenados por validade (FEFO) | A G P |
| `POST /estoque/entradas` | entrada de lote (insumo, qtd, custo unitário, validade, fornecedor) → cria lote **e** movimentação `ENTRADA` | A G P |
| `POST /estoque/ajustes` | ajuste/perda com motivo obrigatório (movimentação) | A G P |
| `GET /estoque/movimentacoes?insumoId=&pedidoId=&tipo=&de=&ate=` | extrato (somente leitura) | A G P |
| `GET /estoque/alertas` | abaixo do mínimo, a vencer (limite configurável), vencidos | A G P |
| `GET/POST /fornecedores` · `PUT /fornecedores/{id}` | cadastro simples (Q-24) | A G |

## Pedidos

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `GET /pedidos?status=&clienteId=&tipo=&entregaDe=&entregaAte=&q=` | listar | A G T P (P vê CONFIRMADO em diante) |
| `POST /pedidos` | criar (nasce `ORCAMENTO`) com itens | A G T |
| `GET /pedidos/{id}` | detalhe (itens, pagamentos, histórico, saldo a pagar) | A G T P |
| `PUT /pedidos/{id}` | editar (conforme status — regras em Q-04) | A G T |
| `DELETE /pedidos/{id}` | soft delete (apenas ORCAMENTO/CANCELADO) | A G |
| `POST /pedidos/{id}/transicoes` | corpo `{para, motivo?, destinoInsumos?}` → aplica máquina de estados; `409` se inválida; `destinoInsumos` (`ESTOQUE`\|`PERDA`) obrigatório ao cancelar pedido já em produção. Falta de estoque **não bloqueia**: devolve `pendenciasEstoque[]` | por transição (tabela abaixo) |
| `GET /pedidos/{id}/pendencias-estoque` | pendências de estoque do pedido | A G T P |
| `POST /pedidos/{id}/pendencias-estoque/{pid}/resolver` | baixa o que faltava (exige saldo) | A G P |
| `POST /pedidos/{id}/pendencias-estoque/{pid}/dispensar` | remove o aviso; `{justificativa}` obrigatória | A G P |
| `GET /pedidos/{id}/historico` | histórico de status | A G T P |
| `GET/POST /pedidos/{id}/pagamentos` | listar / registrar sinal ou pagamento parcial | A G T |
| `POST /pedidos/{id}/pagamentos/{pagId}/estornar` | estorna pagamento (motivo) | A G |
| `POST /pedidos/{id}/foto-referencia` · `DELETE …` | upload (jpeg/png/webp ≤ 5 MB) | A G T |
| `GET /pedidos/{id}/mensagem-whatsapp?modelo=` | devolve texto pronto e URL `wa.me` (não envia nada) | A G T |

**Transições permitidas e papéis (proposta):**

| De → Para | Efeito | Quem |
|---|---|---|
| ORCAMENTO → CONFIRMADO | valida cliente, itens, data futura | A G T |
| CONFIRMADO → EM_PRODUCAO | **baixa de estoque** (FEFO) do que houver + pendência para o que faltar | A G P |
| EM_PRODUCAO → PRONTO | grava `pronto_em` | A G P |
| PRONTO → ENTREGUE (tipo ENTREGA) | grava `entregue_em` | A G T |
| PRONTO → RETIRADO (tipo RETIRADA) | grava `entregue_em` | A G T |
| ORCAMENTO/CONFIRMADO → CANCELADO | sem estoque a estornar | A G T |
| EM_PRODUCAO/PRONTO → CANCELADO | destino dos insumos escolhido: **estorno** ou **perda** (Q-06) | A G |
| qualquer outra | `409 Conflict` | — |

## Arquivos

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `GET /arquivos/{uuid}` | serve a imagem (autenticado, `nosniff`, cache privado) | quem enxerga a entidade dona |

## Painel (dados reais)

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `GET /dashboard/kpis` | faturamento do mês + variação, pedidos pendentes (+ para hoje), insumos a vencer, taxa de entrega no prazo | A G (T e P recebem apenas os KPIs do seu escopo — Q-03) |
| `GET /dashboard/tendencia-vendas?periodo=7d\|mes` | série diária de faturamento | A G |
| `GET /dashboard/proximas-entregas?limite=` | próximos pedidos por `data_entrega_prevista` | A G T P |
| `GET /dashboard/insumos-alerta` | críticos/baixos e a vencer | A G P |
| `GET /dashboard/sugestoes/compra` | regra determinística: consumo projetado dos CONFIRMADOS × saldo | A G P |
| `GET /dashboard/sugestoes/escala` | regra determinística de agrupamento por produto/dia | A G P |
| `GET /dashboard/features` | flags (ex.: `bellaBielIntelligence=false` → "em breve") | autenticado |
| `GET /busca?q=` | busca global do header (pedidos, clientes, produtos) respeitando papel | A G T P |

## Configurações

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `GET /configuracoes` · `PUT /configuracoes/{chave}` | parâmetros (limite de vencimento, tolerância de entrega etc.) | leitura A G · escrita A |
| `GET /publico/privacidade` | texto da política de privacidade | público |

## Fase 2

| Método e caminho | Descrição | Acesso |
|---|---|---|
| `GET /producao?data=` | fila/kanban do dia derivada dos pedidos (agrupada por produto) | A G P |
| `POST /producao/itens/{pedidoId}/mover` | move cartão (aplica transição correspondente) | A G P |
| `GET /financeiro/contas-receber?status=&de=&ate=` | geradas dos pedidos | A G |
| `POST /financeiro/contas-receber/{id}/baixar` | baixa manual (Pix informado) | A G |
| `GET/POST /financeiro/contas-pagar` · `PUT/DELETE …/{id}` · `POST …/{id}/pagar` | contas a pagar | A G |
| `GET /financeiro/fluxo-caixa?de=&ate=&agrupamento=dia\|mes` | entradas × saídas | A G |

## Fase 3

`GET /relatorios/{tipo}` (vendas por período/produto, margem, perdas de estoque, produtividade) com exportação CSV; `PUT /configuracoes/*` ampliadas.

## Operacional

| Caminho | Descrição |
|---|---|
| `GET /actuator/health` | somente `{"status":"UP"}`, sem detalhes; demais endpoints do Actuator desativados |
| `GET /v3/api-docs`, `/swagger-ui` | somente perfil `dev` |

## Códigos de erro padronizados

`400` validação (com `errors[]`) · `401` não autenticado/token expirado · `403` papel insuficiente · `404` inexistente (ou fora do escopo do papel) · `409` transição inválida / conflito de versão / duplicidade · `413` arquivo > 5 MB · `415` tipo de arquivo não permitido · `422` regra de negócio (pagamento > saldo, resolver pendência sem saldo) · `423` conta bloqueada temporariamente · `429` rate limit · `500` genérico, sem detalhes (com `traceId`).
