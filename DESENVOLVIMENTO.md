# Guia de Desenvolvimento

## Pré-requisitos

- Node.js 18+
- Docker Desktop rodando
- npm 9+

---

## 1. Instalar dependências

```bash
npm install
```

---

## 2. Rodar em modo desenvolvimento

Um único comando inicia tudo:

```bash
npm run dev
```

Internamente ele:
1. Compila o processo principal (`src/main/`) para `dist/main/`
2. Inicia o Vite (UI em `http://localhost:5173`)
3. Aguarda o Vite estar pronto e então abre o Electron

> O Docker Desktop precisa estar ativo antes de executar.
> Se o Docker não estiver rodando, a UI abre mas as abas ficam sem dados.

---

## 3. Rodar os testes

```bash
# Rodar todos os testes uma vez
npm test

# Modo watch — re-roda ao salvar arquivos
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

O relatório de cobertura em HTML fica em `coverage/index.html`.

A meta mínima é **80%** de cobertura em branches, funções, linhas e statements.

---

## 4. Verificar tipos (sem compilar)

```bash
npm run typecheck
```

---

## 5. Build de produção

```bash
npm run build
```

Gera o instalador em `dist/` (`.exe` no Windows, `.dmg` no macOS, `.AppImage` no Linux).

---

## Scripts disponíveis

| Script | O que faz |
|---|---|
| `npm run dev` | Compila main + Vite + Electron em modo dev (comando principal) |
| `npm run build:main` | Compila apenas o processo principal (TypeScript → JS) |
| `npm run dev:main` | Compila o processo principal em modo watch |
| `npm test` | Executa os testes uma vez |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npm run typecheck` | Verifica tipos do renderer sem compilar |
| `npm run build` | Build completo de produção |
