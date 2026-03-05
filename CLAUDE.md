# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm start          # Run the Electron app (requires a prior build of main process)
npm run dev        # Start Vite dev server (renderer only, no Electron shell)
npm run build      # Compile TypeScript + Vite build + electron-builder (full production build)
npm run preview    # Preview Vite production build
```

Docker must be running locally before starting the app.

## Architecture

**Heitor CD** is an Electron desktop app (accessibility-first Docker/EKS manager) with a clear two-process model:

- **`src/main/`** — Electron main process. Entry point is `main.ts`. IPC handlers live in `ipc/`. This process owns the Dockerode connection and AWS SDK calls; it never renders UI.
- **`src/renderer/`** — React + TypeScript UI (Electron renderer process). Communicates with main exclusively via IPC. Never calls Docker/AWS directly.
- **`src/types/`** — Shared TypeScript types (e.g., `docker.ts`) used by both processes.

### IPC boundary

All Docker operations flow: `Renderer → IPC → Main → Dockerode → Docker socket`. Docker events (container start/stop/etc.) stream back the same way and are surfaced via `aria-live` regions in the renderer.

### Renderer structure

| Path | Purpose |
|---|---|
| `renderer/pages/` | Top-level views: Dashboard, Composer, Stacks, ImagesNetworks, Logs, Cloud |
| `renderer/components/` | Reusable UI components (Button, Input, Toggle, Modal, Tree, List, Table, StatusBadge) |
| `renderer/styles/theme.ts` | `darkHighContrastTheme` and `lightHighContrastTheme` objects; `applyTheme()` sets CSS variables on `<html>` |
| `renderer/styles/variables.css` | CSS custom properties mirroring the theme (use these in CSS modules) |
| `renderer/hooks/` | `useZoom`, `useZoomKeyboardShortcuts`, `useKeyboardNav`, `useFocusManagement`, `useTheme` |
| `renderer/services/` | `dockerService`, `keymapsService`, `themeService`, `eventBusService` |
| `renderer/utils/aria.ts` | ARIA prop factories and screen-reader helpers |

## Accessibility requirements (non-negotiable)

This project targets **WCAG 2.2 AA**. Every new UI element must:

- Have an accessible name via `aria-label`, `aria-labelledby`, or visible text.
- Be fully operable by keyboard (no mouse-only flows). Keyboard equivalents for drag-and-drop are mandatory.
- Use semantic HTML roles (`main`, `nav`, `table`, `dialog`, `tree`, etc.).
- Use `aria-live="polite"` for status updates and `aria-live="assertive"` for critical errors.
- Return focus correctly when modals open/close.

Use helpers from `@/utils/aria.ts` (`getButtonAriaProps`, `getDialogAriaProps`, `getLiveRegionAriaProps`, `announceToScreenReader`, `createFocusTrap`, etc.) rather than writing raw ARIA attributes inline.

Use `@/hooks/useZoom` + `useZoomKeyboardShortcuts` for zoom support (80%–200%, persisted to `localStorage`).

## Keymaps system

All actions must have an `actionId` registered in `.keymaps` (project root, JSON). The app loads this file at startup; users may edit shortcuts without touching source. When adding a new action, register it in `.keymaps` and document it in `README.md`.

## Styling conventions

- **Default theme**: dark high-contrast (`#000000` bg, `#FFFFFF` fg, `#00FF00` accent).
- All components consume CSS variables (e.g., `var(--color-accent)`, `var(--spacing-md)`) defined via `applyTheme()` — never hardcode hex values.
- CSS Modules per component: `Component.module.css` alongside `Component.tsx`.
- Import theme types from `@/styles/theme`; import the applied CSS variables in stylesheets via `variables.css`.

## Naming conventions

| Thing | Convention |
|---|---|
| Files (non-component) | `camelCase.ts` |
| Component files | `PascalCase.tsx` + `PascalCase.module.css` |
| TypeScript types/interfaces | `FooInterface` / `FooType` suffix |
| Constants | `SCREAMING_SNAKE_CASE` |

## Platform notes

On Windows, the app connects to Docker Desktop via named pipe (`\\.\pipe\docker_engine`) or WSL2 socket (`/mnt/wsl/shared-docker/docker.sock`), trying both on startup. macOS/Linux use `/var/run/docker.sock`.
