/**
 * useZoom - Hook para gerenciar zoom global da aplicação
 * Suporta aumento de fontes para usuários com baixa visão
 * Valores: 80%, 90%, 100%, 110%, 125%, 150%, 175%, 200%
 */

import { useState, useEffect, useCallback } from 'react';

type ZoomLevel = 80 | 90 | 100 | 110 | 125 | 150 | 175 | 200;

const ZOOM_LEVELS: ZoomLevel[] = [80, 90, 100, 110, 125, 150, 175, 200];
const STORAGE_KEY = 'app-zoom-level';

export const useZoom = () => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(() => {
    // Recupera zoom anterior da sessão
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ZOOM_LEVELS.includes(parseInt(stored) as ZoomLevel)) {
      return parseInt(stored) as ZoomLevel;
    }
    return 100;
  });

  // Aplica zoom ao elemento raiz
  useEffect(() => {
    const body = document.body;

    // Remove classes anteriores
    ZOOM_LEVELS.forEach((level) => {
      body.classList.remove(`zoom-${level}`);
    });

    // Aplica nova classe
    body.classList.add(`zoom-${zoomLevel}`);

    // Persiste na sessão
    localStorage.setItem(STORAGE_KEY, zoomLevel.toString());

    // Anuncia mudança para leitores de tela
    announceZoomChange(zoomLevel);
  }, [zoomLevel]);

  const increaseZoom = useCallback(() => {
    setZoomLevel((prev) => {
      const nextIndex = ZOOM_LEVELS.indexOf(prev) + 1;
      return nextIndex < ZOOM_LEVELS.length ? ZOOM_LEVELS[nextIndex] : prev;
    });
  }, []);

  const decreaseZoom = useCallback(() => {
    setZoomLevel((prev) => {
      const prevIndex = ZOOM_LEVELS.indexOf(prev) - 1;
      return prevIndex >= 0 ? ZOOM_LEVELS[prevIndex] : prev;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(100);
  }, []);

  const setZoom = useCallback((level: ZoomLevel) => {
    if (ZOOM_LEVELS.includes(level)) {
      setZoomLevel(level);
    }
  }, []);

  return {
    zoomLevel,
    increaseZoom,
    decreaseZoom,
    resetZoom,
    setZoom,
    zoomPercentage: `${zoomLevel}%`,
  };
};

/**
 * Anuncia mudança de zoom para leitores de tela
 */
const announceZoomChange = (level: ZoomLevel) => {
  const message = `Zoom alterado para ${level}%`;
  const liveRegion = document.querySelector('[aria-live="polite"]');

  if (liveRegion) {
    liveRegion.textContent = message;
  } else {
    // Cria um live region temporário se não existir
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('role', 'status');
    region.className = 'sr-only';
    region.textContent = message;
    document.body.appendChild(region);

    setTimeout(() => {
      document.body.removeChild(region);
    }, 1000);
  }
};

/**
 * Hook para escutar atalhos de zoom
 */
export const useZoomKeyboardShortcuts = (
  onIncreaseZoom: () => void,
  onDecreaseZoom: () => void,
  onResetZoom: () => void,
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Plus ou Ctrl+Shift+Plus: aumentar zoom
      if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        onIncreaseZoom();
      }
      // Ctrl+Minus: diminuir zoom
      else if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        onDecreaseZoom();
      }
      // Ctrl+0: resetar zoom
      else if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        onResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onIncreaseZoom, onDecreaseZoom, onResetZoom]);
};
