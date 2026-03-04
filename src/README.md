# Arquitetura do Heitor CD (Container Manager Desktop)

Este documento descreve a estrutura modular e as convenções do projeto.

## Estrutura de pastas

```
src/
├── main/                # Processo principal Electron
│   ├── main.ts         # Entrada principal
│   └── ipc/            # Handlers de IPC (comunicação main <-> renderer)
│
├── renderer/           # Processo renderer (UI React)
│   ├── App.tsx         # Componente raiz
│   ├── pages/          # Páginas/abas principais
│   ├── components/     # Componentes reutilizáveis
│   ├── styles/         # Estilos e tema centralizados
│   ├── hooks/          # React hooks customizados
│   ├── services/       # Integrações e lógica de negócio
│   └── utils/          # Funções auxiliares
│
├── types/              # Tipos TypeScript compartilhados
└── assets/             # Imagens, ícones
```

## Tema e estilos

### Tema padrão: Alto contraste com fundo preto

**Cores:**
- Background: `#000000` (preto puro)
- Foreground: `#FFFFFF` (branco puro)
- Accent: `#00FF00` (verde lime)
- Borders: `#888888` (cinza médio)
- Erro: `#FF0000` (vermelho puro)
- Aviso: `#FFFF00` (amarelo puro)
- Sucesso: `#00FF00` (verde puro)

### Como usar o tema

```tsx
import { useTheme } from 'react-hooks'; // Sua hook customizada
import { darkHighContrastTheme } from '@/styles/theme';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <button style={{ color: theme.colors.accent }}>
      Clique aqui
    </button>
  );
}
```

## Atalhos de zoom

- `Ctrl+Plus` / `Ctrl+Shift+Plus`: Aumentar zoom (máximo 200%)
- `Ctrl+Minus` / `Ctrl+Shift+Minus`: Diminuir zoom (mínimo 80%)
- `Ctrl+0`: Resetar para 100%

### Como usar zoom

```tsx
import { useZoom, useZoomKeyboardShortcuts } from '@/hooks/useZoom';

function App() {
  const { zoomLevel, increaseZoom, decreaseZoom, resetZoom } = useZoom();
  
  // Registra atalhos de teclado
  useZoomKeyboardShortcuts(increaseZoom, decreaseZoom, resetZoom);
  
  return (
    <div>
      <p>Zoom atual: {zoomLevel}%</p>
    </div>
  );
}
```

## Acessibilidade WCAG 2.2 AA

### Helpers de ARIA

Use `@/utils/aria.ts` para criar props acessíveis:

```tsx
import { getButtonAriaProps, announceToScreenReader } from '@/utils/aria';

function MyButton() {
  const ariaProps = getButtonAriaProps('Deletar container', false);
  
  return (
    <button 
      {...ariaProps}
      onClick={() => {
        // ... lógica
        announceToScreenReader('Container deletado com sucesso', false, 2000);
      }}
    >
      Deletar
    </button>
  );
}
```

### Regiões ao vivo

Use `aria-live` para anunciar mudanças críticas:

```tsx
import { getLiveRegionAriaProps } from '@/utils/aria';

function LogsDisplay() {
  return (
    <div {...getLiveRegionAriaProps(false)}> {/* assertive */}
      Novo log: Kafka iniciado com sucesso
    </div>
  );
}
```

## Componentes reutilizáveis

Todos os componentes devem:

1. **Importar estilos centralizados** de `@/styles/theme`
2. **Implementar WCAG 2.2 AA** via props ARIA
3. **Suportar teclado** (foco visível, navegação por setas, Enter/Space)
4. **Ser testáveis** via acessibilidade

Exemplo de componente:

```tsx
// components/Button/Button.tsx
import React from 'react';
import { getButtonAriaProps } from '@/utils/aria';
import styles from './Button.module.css';

interface ButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, disabled, onClick }) => {
  const ariaProps = getButtonAriaProps(label, disabled);
  
  return (
    <button
      className={styles.button}
      disabled={disabled}
      onClick={onClick}
      {...ariaProps}
    >
      {label}
    </button>
  );
};
```

```css
/* components/Button/Button.module.css */
.button {
  background-color: var(--color-accent);
  color: var(--color-bg-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-width) solid var(--color-accent);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
}

.button:hover:not(:disabled) {
  background-color: var(--color-bg-hover);
  color: var(--color-accent);
}

.button:focus-visible {
  outline: var(--border-width-focus) solid var(--color-accent);
  outline-offset: 2px;
}

.button:disabled {
  background-color: var(--color-bg-disabled);
  color: var(--color-fg-disabled);
  cursor: not-allowed;
}
```

## Services

Services centralizam integrações e lógica:

```tsx
// services/dockerService.ts
export const dockerService = {
  listContainers: async () => { /* ... */ },
  startContainer: async (id: string) => { /* ... */ },
  // ...
};

// Uso em um componente
import { dockerService } from '@/services/dockerService';

const containers = await dockerService.listContainers();
```

## Convenções

1. **Nomes de arquivos**: camelCase (ex.: `useZoom.ts`, `dockerService.ts`)
2. **Nomes de componentes**: PascalCase (ex.: `Button.tsx`)
3. **Componentes CSS Module**: `Component.module.css`
4. **Tipos**: Sufixo `Interface` ou `Type` (ex.: `UserInterface`, `ZoomType`)
5. **Constantes**: SCREAMING_SNAKE_CASE (ex.: `MAX_ZOOM`, `DEFAULT_TIMEOUT`)

## Testes de acessibilidade

Use `data-testid` para testes:

```tsx
<button data-testid="delete-button">Deletar</button>
```

Teste com:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)
- Navegação por teclado
- Zoom/ampliação de fonts

## Próximas etapas

1. Criar componentes da `src/renderer/components/`
2. Implementar páginas em `src/renderer/pages/`
3. Conectar IPC entre main e renderer
4. Validar acessibilidade de cada página
