# POST_MVP.md — O que implementar após o MVP

Este documento lista tudo que ficou fora do MVP e deve ser implementado nas próximas versões.
Itens estão ordenados por prioridade.

---

## 1. Fase Cloud (Alta prioridade)

O MVP entrega apenas um placeholder na aba **Cloud**. As seguintes funcionalidades precisam ser implementadas. A implementação deve ser **agnóstica ao provedor de nuvem**, suportando AWS EKS, Google GKE, Azure AKS e clusters Kubernetes locais (Minikube, Kind, k3s) através de uma interface unificada.

### 1.1 Autenticação e contexto de cluster
- Leitura e seleção de contextos do `~/.kube/config` (padrão kubeconfig).
- Suporte a múltiplos contextos/clusters cadastrados localmente.
- Troca de contexto entre Docker local e qualquer cluster Kubernetes via UI.
- Feedback visual de estado da conexão (conectado / sem credenciais / erro).
- Integração opcional com credenciais de provedores específicos (AWS, GCP, Azure) de forma plugável, sem criar dependência obrigatória de nenhum SDK de nuvem no core do app.

### 1.2 Visualização de recursos Kubernetes
- Listagem de clusters/contextos disponíveis.
- Visualização de Namespaces, Pods, Deployments, Services, ConfigMaps.
- Status de saúde dos pods em tempo real.
- Árvore de recursos (Cluster → Namespace → Workloads) navegável por teclado.

### 1.3 Operações Kubernetes
- Escalar Deployments (réplicas).
- Deletar pods (com confirmação em modal acessível).
- Ver logs de pods (integrado à página de Logs existente).
- Port-forward via IPC.

---

## 2. Desacoplamento Electron / Web (Alta prioridade)

Atualmente o renderer depende diretamente do `window.electron` exposto pelo preload do Electron. Para que a mesma base de código funcione também como **aplicação web** (hospedada em servidor ou rodando localmente no navegador), é necessário introduzir uma camada de abstração de plataforma.

### 2.1 Interface `PlatformAdapter`
- Definir em `src/types/platform.ts` a interface `PlatformAdapterInterface` com todos os contratos de operação (Docker, keymaps, eventos).
- Implementar dois adaptadores concretos:
  - `ElectronAdapter` — encapsula as chamadas existentes via `window.electron` (IPC).
  - `WebAdapter` — encapsula chamadas HTTP/WebSocket a um backend local (ex.: daemon Docker exposto via API REST ou servidor proxy Node.js).
- Exportar um singleton `platformAdapter` resolvido em tempo de inicialização com base em `isElectron()`.

### 2.2 Utilitário de detecção de plataforma
- Criar `src/renderer/utils/platform.ts` com a função `isElectron(): boolean` (detecta presença de `window.electron`).
- Todos os serviços do renderer devem consumir `platformAdapter` em vez de `window.electron` diretamente.

### 2.3 Refatoração de serviços
- `dockerService`, `keymapsService`, `themeService` e `eventBusService` passam a delegar ao `platformAdapter`.
- Nenhuma referência a `window.electron` deve existir fora de `ElectronAdapter`.
- O hook `useDockerEvents` deve aceitar tanto eventos IPC (Electron) quanto WebSocket (web).

### 2.4 Build web
- Adicionar script `npm run build:web` que executa `vite build` sem o processo main do Electron, gerando bundle estático em `dist-web/`.
- Configurar `vite.config.ts` para aceitar a variável de ambiente `VITE_PLATFORM=web` e excluir imports do Electron do bundle.
- Documentar como servir o build web com um backend proxy (ex.: `docker-socket-proxy` ou servidor Express simples).

### 2.5 Persistência multiplataforma
- No modo Electron, continuar usando `electron-store` (processo main via IPC).
- No modo web, usar `localStorage` / `IndexedDB` via adaptador próprio com a mesma interface.
- A seleção do mecanismo de persistência deve ser transparente para os componentes React.

---

## 3. Persistência de estado com electron-store (Alta prioridade)

O MVP usa `localStorage` para zoom e preferência de tema, mas o ideal é persistir via `electron-store` no processo main:

- Posição e tamanho da janela.
- Aba ativa ao fechar.
- Estado do toggle "mostrar containers parados".
- Preferência de tema (dark/light).
- Nível de zoom.
- Histórico de arquivos compose abertos recentemente.

---

## 4. Internacionalização completa / i18n (Alta prioridade)

O MVP não implementa traduções apesar de ter `i18next` e `react-i18next` como dependências.

- Criar arquivos de locale em `src/renderer/locales/pt-BR.json` e `en.json`.
- Envolver todos os textos visíveis em `t('key')`.
- Seletor de idioma na UI.
- Anúncios `aria-live` também devem ser traduzidos.

---

## 5. Testes end-to-end (Alta prioridade)

O MVP cobre testes unitários (≥80%). Falta:

- Configurar **Playwright** com suporte a Electron (`playwright-electron` ou `@playwright/test` com `electronApp`).
- Testes E2E dos fluxos críticos:
  - Listar e iniciar/parar container.
  - Criar e exportar stack no Composer.
  - Navegar 100% por teclado em cada aba.
  - Abrir/fechar modal com foco retornado corretamente.
- Relatório de acessibilidade automatizado com **axe-core** (`@axe-core/playwright`).

---

## 6. Auto-updater (Média prioridade)

- Configurar `electron-updater` (já incluído via `electron-builder`).
- Checagem de atualizações em background ao iniciar.
- Dialog acessível de "nova versão disponível" com opção de atualizar agora ou depois.
- Progresso de download anunciado via `aria-live`.

---

## 7. CI/CD pipeline (Média prioridade)

- Criar workflow GitHub Actions (`.github/workflows/ci.yml`):
  - Lint (ESLint + Prettier).
  - Typecheck (`tsc --noEmit`).
  - Testes unitários com cobertura.
  - Build de produção.
  - Release automático em tag `v*.*.*`.
- Publicar artefatos para Windows, macOS e Linux via `electron-builder publish`.

---

## 8. Linting e formatação (Média prioridade)

- Adicionar **ESLint** com plugins `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `@typescript-eslint/eslint-plugin`.
- Adicionar **Prettier** com `prettier-plugin-tailwindcss`.
- Configurar `lint-staged` + `husky` para rodar lint/format em pre-commit.
- Configurar regra `jsx-a11y` para garantir acessibilidade detectável estaticamente.

---

## 9. Melhorias de acessibilidade avançada (Média prioridade)

- Testar manualmente com **NVDA** (Windows) e **VoiceOver** (macOS).
- Substituir `@react-aria` por implementação própria ou garantir integração completa dos três pacotes já instalados.
- Implementar **modo de alto contraste do sistema** (detectar via `forced-colors: active` em CSS).
- Adicionar atalho `Ctrl+Shift+H` para alternar entre tema escuro/claro.
- Validar cada componente com [axe DevTools](https://www.deque.com/axe/).

---

## 10. Painel de monitoramento de recursos (Média prioridade)

O README menciona monitoramento contínuo. Para o MVP, apenas os eventos Docker são processados. Post-MVP:

- Gráficos de uso de CPU e memória por container (via `docker stats`).
- Histórico de eventos com filtro por tipo e container.
- Exportar log de eventos para arquivo.

---

## 11. Gestão de volumes Docker (Baixa prioridade)

- Aba ou seção dentro de "Images & Networks" para volumes.
- Listar, inspecionar e remover volumes.
- Indicar volumes não referenciados (dangling).

---

## 12. Notificações de sistema (Baixa prioridade)

- Usar `Notification` da Electron para alertar o usuário quando estiver fora do foco do app:
  - Container morreu inesperadamente.
  - Pull de imagem concluído.
  - Stack parou completamente.

---

## 13. Perfis de compose (Baixa prioridade)

- Salvar múltiplas configurações de compose nomeadas (perfis).
- Selecionar e aplicar perfil rapidamente via Command Palette.
- Exportar/importar perfis como arquivo.

---

## 14. Documentação técnica (Baixa prioridade)

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
| Cloud / Kubernetes (agnóstico a provedor) | ⏳ Post-MVP |
| Desacoplamento Electron / Web (PlatformAdapter) | ⏳ Post-MVP |
| Persistência electron-store | ⏳ Post-MVP |
| Internacionalização completa | ⏳ Post-MVP |
| Testes E2E | ⏳ Post-MVP |
| Auto-updater | ⏳ Post-MVP |
| CI/CD pipeline | ✅ Concluído |
| Linting + Prettier + Husky | ✅ Concluído |
| Volumes Docker | ⏳ Post-MVP |
| Notificações de sistema | ⏳ Post-MVP |
| Monitoramento de recursos (CPU/Mem gráficos) | ⏳ Post-MVP |
