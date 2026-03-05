# POST_MVP.md — O que implementar após o MVP

Este documento lista tudo que ficou fora do MVP e deve ser implementado nas próximas versões.
Itens estão ordenados por prioridade.

---

## 1. Fase EKS / Cloud (Alta prioridade)

O MVP entrega apenas um placeholder na aba **Cloud**. As seguintes funcionalidades precisam ser implementadas:

### 1.1 Autenticação AWS
- Integração com AWS SDK (`@aws-sdk/client-eks`, `@aws-sdk/client-sts`).
- Suporte a múltiplos perfis AWS (`~/.aws/credentials`).
- Troca de contexto entre Docker local e kubectl/EKS via UI.
- Feedback visual de estado da conexão (conectado / sem credenciais / erro).

### 1.2 Visualização de recursos EKS
- Listagem de clusters EKS disponíveis.
- Visualização de Namespaces, Pods, Deployments, Services, ConfigMaps.
- Status de saúde dos pods em tempo real.
- Árvore de recursos (Cluster → Namespace → Workloads) navegável por teclado.

### 1.3 Operações Kubernetes
- Escalar Deployments (réplicas).
- Deletar pods (com confirmação em modal acessível).
- Ver logs de pods (integrado à página de Logs existente).
- Port-forward via IPC.

---

## 2. Persistência de estado com electron-store (Alta prioridade)

O MVP usa `localStorage` para zoom e preferência de tema, mas o ideal é persistir via `electron-store` no processo main:

- Posição e tamanho da janela.
- Aba ativa ao fechar.
- Estado do toggle "mostrar containers parados".
- Preferência de tema (dark/light).
- Nível de zoom.
- Histórico de arquivos compose abertos recentemente.

---

## 3. Internacionalização completa / i18n (Alta prioridade)

O MVP não implementa traduções apesar de ter `i18next` e `react-i18next` como dependências.

- Criar arquivos de locale em `src/renderer/locales/pt-BR.json` e `en.json`.
- Envolver todos os textos visíveis em `t('key')`.
- Seletor de idioma na UI.
- Anúncios `aria-live` também devem ser traduzidos.

---

## 4. Testes end-to-end (Alta prioridade)

O MVP cobre testes unitários (≥80%). Falta:

- Configurar **Playwright** com suporte a Electron (`playwright-electron` ou `@playwright/test` com `electronApp`).
- Testes E2E dos fluxos críticos:
  - Listar e iniciar/parar container.
  - Criar e exportar stack no Composer.
  - Navegar 100% por teclado em cada aba.
  - Abrir/fechar modal com foco retornado corretamente.
- Relatório de acessibilidade automatizado com **axe-core** (`@axe-core/playwright`).

---

## 5. Auto-updater (Média prioridade)

- Configurar `electron-updater` (já incluído via `electron-builder`).
- Checagem de atualizações em background ao iniciar.
- Dialog acessível de "nova versão disponível" com opção de atualizar agora ou depois.
- Progresso de download anunciado via `aria-live`.

---

## 6. CI/CD pipeline (Média prioridade)

- Criar workflow GitHub Actions (`.github/workflows/ci.yml`):
  - Lint (ESLint + Prettier).
  - Typecheck (`tsc --noEmit`).
  - Testes unitários com cobertura.
  - Build de produção.
  - Release automático em tag `v*.*.*`.
- Publicar artefatos para Windows, macOS e Linux via `electron-builder publish`.

---

## 7. Linting e formatação (Média prioridade)

- Adicionar **ESLint** com plugins `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `@typescript-eslint/eslint-plugin`.
- Adicionar **Prettier** com `prettier-plugin-tailwindcss`.
- Configurar `lint-staged` + `husky` para rodar lint/format em pre-commit.
- Configurar regra `jsx-a11y` para garantir acessibilidade detectável estaticamente.

---

## 8. Melhorias de acessibilidade avançada (Média prioridade)

- Testar manualmente com **NVDA** (Windows) e **VoiceOver** (macOS).
- Substituir `@react-aria` por implementação própria ou garantir integração completa dos três pacotes já instalados.
- Implementar **modo de alto contraste do sistema** (detectar via `forced-colors: active` em CSS).
- Adicionar atalho `Ctrl+Shift+H` para alternar entre tema escuro/claro.
- Validar cada componente com [axe DevTools](https://www.deque.com/axe/).

---

## 9. Painel de monitoramento de recursos (Média prioridade)

O README menciona monitoramento contínuo. Para o MVP, apenas os eventos Docker são processados. Post-MVP:

- Gráficos de uso de CPU e memória por container (via `docker stats`).
- Histórico de eventos com filtro por tipo e container.
- Exportar log de eventos para arquivo.

---

## 10. Gestão de volumes Docker (Baixa prioridade)

- Aba ou seção dentro de "Images & Networks" para volumes.
- Listar, inspecionar e remover volumes.
- Indicar volumes não referenciados (dangling).

---

## 11. Notificações de sistema (Baixa prioridade)

- Usar `Notification` da Electron para alertar o usuário quando estiver fora do foco do app:
  - Container morreu inesperadamente.
  - Pull de imagem concluído.
  - Stack parou completamente.

---

## 12. Perfis de compose (Baixa prioridade)

- Salvar múltiplas configurações de compose nomeadas (perfis).
- Selecionar e aplicar perfil rapidamente via Command Palette.
- Exportar/importar perfis como arquivo.

---

## 13. Documentação técnica (Baixa prioridade)

- Gerar documentação de API com **TypeDoc**.
- Documentar cada IPC channel: args esperados, response, erros possíveis.
- Guia de contribuição (`CONTRIBUTING.md`).
- Storybook para os componentes UI.

---

## Resumo do MVP implementado

| Funcionalidade | Status |
|---|---|
| Dashboard (containers em execução + toggle stopped) | ✅ MVP |
| Monitoramento de eventos Docker em tempo real | ✅ MVP |
| Composer (visual builder de docker-compose) | ✅ MVP |
| Stacks (gerenciar stacks compose existentes) | ✅ MVP |
| Images & Networks (listagem + operações básicas) | ✅ MVP |
| Logs (viewer com filtro por container) | ✅ MVP |
| Navegação 100% por teclado com keymaps configuráveis | ✅ MVP |
| Acessibilidade WCAG 2.2 AA (aria, foco, live regions) | ✅ MVP |
| Suporte a zoom (80%–200%) | ✅ MVP |
| Command Palette (Ctrl+K) | ✅ MVP |
| Árvore de categorias (Ctrl+E) | ✅ MVP |
| Context menu via teclado (Ctrl+Space) | ✅ MVP |
| Tema alto contraste dark/light | ✅ MVP |
| Testes unitários ≥80% cobertura | ✅ MVP |
| Cloud / EKS | ⏳ Post-MVP |
| Persistência electron-store | ⏳ Post-MVP |
| Internacionalização completa | ⏳ Post-MVP |
| Testes E2E | ⏳ Post-MVP |
| Auto-updater | ⏳ Post-MVP |
| CI/CD pipeline | ⏳ Post-MVP |
| Linting + Prettier + Husky | ⏳ Post-MVP |
| Volumes Docker | ⏳ Post-MVP |
| Notificações de sistema | ⏳ Post-MVP |
| Monitoramento de recursos (CPU/Mem gráficos) | ⏳ Post-MVP |
