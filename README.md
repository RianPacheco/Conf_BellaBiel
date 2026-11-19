# Bella Biel — ERP da Confeitaria

Sistema de gestão (pedidos, produção, estoque e financeiro) da **Bella Biel Confeitaria**. Um único cliente, pt-BR, BRL, fuso `America/Sao_Paulo`.

| Camada | Tecnologia |
|---|---|
| Backend | Java 21, Spring Boot 4.1, Spring Data JPA, Spring Security, Flyway, PostgreSQL 16 |
| Frontend | Angular 22 (standalone, signals), Tailwind CSS 4 (no build), Vitest, Playwright |
| Infra | Docker, Caddy (HTTPS), GitHub Actions |

> Estado: **Fase 0 — scaffolding.** O sistema ainda não tem funcionalidades de negócio. Veja [docs/PLANO.md](docs/PLANO.md).

## Estrutura

```
backend/    API Spring Boot (Maven)
frontend/   Aplicação Angular
deploy/     Artefatos de deploy (Fase 1.F)
docs/       Arquitetura, plano, modelo de dados, API e premissas
  legacy/index.html   protótipo estático original (referência visual)
```

Documentação: [Arquitetura](docs/ARQUITETURA.md) · [Plano](docs/PLANO.md) · [Modelo de dados](docs/MODELO-DADOS.md) · [API](docs/API.md) · [Perguntas e premissas](docs/PERGUNTAS-E-PREMISSAS.md)

## Pré-requisitos

Java 21, Node 22 (npm 10), Docker (para o Postgres local e para os testes de integração).

## Rodando em desenvolvimento

```bash
cp .env.example .env          # ajuste se quiser; .env nunca é commitado
docker compose up -d          # Postgres 16 em 127.0.0.1:5432
```

```bash
cd backend
set -a; . ../.env; set +a     # carrega as variáveis (SPRING_PROFILES_ACTIVE=dev etc.)
./mvnw spring-boot:run        # http://localhost:8080  (health: /actuator/health, Swagger: /swagger-ui.html no perfil dev)
```

```bash
cd frontend
npm ci
npm start                     # http://localhost:4200
```

## Testes e qualidade

```bash
# Backend: compila, testa (Testcontainers/Postgres real), confere formatação (Spotless) e gera cobertura (JaCoCo)
cd backend && ./mvnw verify
./mvnw spotless:apply         # corrige a formatação

# Frontend
cd frontend
npm run lint
npm test -- --no-watch
npm run build
npx playwright test           # e2e; em containers sem browser: PLAYWRIGHT_CHROMIUM_PATH=/caminho/do/chromium
npm audit --omit=dev --audit-level=high
```

O CI (`.github/workflows/ci.yml`) roda tudo isso em toda PR. O workflow de deploy (`deploy.yml`) é apenas `workflow_dispatch` e **ainda não faz nada**.

## Perfis e configuração

| Perfil | Uso |
|---|---|
| `dev` | Swagger ligado, seed de exemplo (Fase 1), CORS para `localhost:4200`, logs detalhados |
| `test` | Testes de integração (Testcontainers) |
| *(prod)* | Padrão do `application.yml`: sem seed, sem Swagger, cookies seguros. Defina `SPRING_PROFILES_ACTIVE=prod` |

Toda configuração sensível vem de variáveis de ambiente — veja o [.env.example](.env.example). **Nunca** commite segredos.

## Frontend: tema e fontes

- Os tokens (cores, tipografia, raios) foram extraídos do protótipo para `frontend/src/styles.css` (`@theme` do Tailwind v4), preservando os nomes (`bg-primary`, `text-on-surface-variant`, `text-label-md`…).
- Fontes **self-hosted** (Inter, Geist, Alex Brush via npm). Os ícones Material Symbols usam um **subset** (~19 KB) em `frontend/public/fonts`. Para adicionar ícones: edite `frontend/scripts/icons.txt` e rode `frontend/scripts/subset-icons.sh` (requer `pip install fonttools brotli`).
