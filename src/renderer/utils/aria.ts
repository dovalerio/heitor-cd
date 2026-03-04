/**
 * aria.ts - Helpers para implementação de WCAG 2.2 AA via aria attributes
 */

/**
 * Cria props acessíveis para um botão
 */
export const getButtonAriaProps = (
  label: string,
  disabled: boolean = false,
  pressed?: boolean
) => ({
  role: 'button',
  'aria-label': label,
  'aria-disabled': disabled,
  ...(pressed !== undefined && { 'aria-pressed': pressed }),
  tabIndex: disabled ? -1 : 0,
});

/**
 * Cria props acessíveis para um campo de input
 */
export const getInputAriaProps = (
  id: string,
  label: string,
  required: boolean = false,
  invalid: boolean = false,
  describedBy?: string
) => ({
  id,
  'aria-label': label,
  'aria-required': required,
  'aria-invalid': invalid,
  ...(describedBy && { 'aria-describedby': describedBy }),
});

/**
 * Cria props acessíveis para um toggle/checkbox
 */
export const getToggleAriaProps = (
  checked: boolean,
  label: string,
  disabled: boolean = false
) => ({
  role: 'switch',
  'aria-checked': checked,
  'aria-label': label,
  'aria-disabled': disabled,
  tabIndex: disabled ? -1 : 0,
});

/**
 * Cria props acessíveis para uma lista
 */
export const getListAriaProps = (
  itemCount: number,
  orientation: 'vertical' | 'horizontal' = 'vertical'
) => ({
  role: 'list',
  'aria-orientation': orientation,
  'aria-label': `Lista com ${itemCount} itens`,
});

/**
 * Cria props acessíveis para um item de lista
 */
export const getListItemAriaProps = (
  index: number,
  total: number,
  selected: boolean = false
) => ({
  role: 'listitem',
  'aria-selected': selected,
  'aria-posinset': index + 1,
  'aria-setsize': total,
});

/**
 * Cria props acessíveis para uma árvore
 */
export const getTreeAriaProps = (
  label: string,
  multiSelect: boolean = false
) => ({
  role: 'tree',
  'aria-label': label,
  'aria-multiselectable': multiSelect,
});

/**
 * Cria props acessíveis para um nó de árvore
 */
export const getTreeNodeAriaProps = (
  expanded: boolean,
  selected: boolean,
  level: number,
  posInSet: number,
  setSize: number,
  label: string
) => ({
  role: 'treeitem',
  'aria-expanded': expanded,
  'aria-selected': selected,
  'aria-level': level,
  'aria-posinset': posInSet,
  'aria-setsize': setSize,
  'aria-label': label,
});

/**
 * Cria props acessíveis para um modal/dialog
 */
export const getDialogAriaProps = (
  label: string,
  describedBy?: string,
  modal: boolean = true
) => ({
  role: modal ? 'dialog' : 'alertdialog',
  'aria-label': label,
  'aria-modal': modal,
  ...(describedBy && { 'aria-describedby': describedBy }),
});

/**
 * Cria props acessíveis para uma região ao vivo anúncio
 */
export const getLiveRegionAriaProps = (
  polite: boolean = true,
  atomic: boolean = true
) => ({
  'aria-live': polite ? 'polite' : 'assertive',
  'aria-atomic': atomic,
  role: 'status',
});

/**
 * Gera ID único para associação de elementos
 */
export const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Anuncia uma mensagem para leitores de tela
 */
export const announceToScreenReader = (
  message: string,
  assertive: boolean = false,
  duration: number = 1000
): void => {
  const region = document.createElement('div');
  region.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  region.setAttribute('role', 'status');
  region.className = 'sr-only';
  region.textContent = message;

  document.body.appendChild(region);

  setTimeout(() => {
    document.body.removeChild(region);
  }, duration);
};

/**
 * Define o foco para um elemento e anuncia
 */
export const setFocusWithAnnouncement = (
  element: HTMLElement | null,
  announcement?: string
): void => {
  if (!element) return;

  element.focus({ preventScroll: false });
  
  if (announcement) {
    announceToScreenReader(announcement);
  }
};

/**
 * Props comuns para elementos com foco visível
 */
export const getFocusableProps = () => ({
  tabIndex: 0,
  'onKeyDown': (e: KeyboardEvent) => {
    // Permite navegação com setas
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  },
});

/**
 * Gerencia trap de foco em modal
 */
export const createFocusTrap = (container: HTMLElement): (() => void) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};
