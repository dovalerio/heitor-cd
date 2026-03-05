import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from '@/pages/Dashboard';
import { Composer } from '@/pages/Composer';
import { Stacks } from '@/pages/Stacks';
import { Images } from '@/pages/Images';
import { Networks } from '@/pages/Networks';
import { Logs } from '@/pages/Logs';
import { Cloud } from '@/pages/Cloud';
import { CommandPalette, Command } from '@/components/CommandPalette/CommandPalette';
import { dockerService } from '@/services/dockerService';
import { keymapsService } from '@/services/keymapsService';
import { themeService } from '@/services/themeService';
import { useZoom, useZoomKeyboardShortcuts } from '@/hooks/useZoom';
import type { DockerEvent } from '../types/docker';
import type { KeymapFile } from '../types/keymap';
import { IPC } from '../types/ipc';
import styles from './App.module.css';

type PageId = 'dashboard' | 'composer' | 'stacks' | 'images' | 'networks' | 'logs' | 'cloud';

interface NavTab {
  id: PageId;
  label: string;
  shortcut: string;
}

const TABS: NavTab[] = [
  { id: 'dashboard', label: 'Dashboard', shortcut: 'Ctrl+1' },
  { id: 'composer', label: 'Composer', shortcut: 'Ctrl+2' },
  { id: 'stacks', label: 'Stacks', shortcut: 'Ctrl+3' },
  { id: 'images', label: 'Imagens', shortcut: 'Ctrl+4' },
  { id: 'networks', label: 'Redes', shortcut: 'Ctrl+5' },
  { id: 'logs', label: 'Logs', shortcut: 'Alt+4' },
  { id: 'cloud', label: 'Cloud', shortcut: 'Ctrl+6' },
];

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [keymaps, setKeymaps] = useState<KeymapFile | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [logsTarget, setLogsTarget] = useState<{ id: string; name: string } | null>(null);
  const [announceMessage, setAnnounceMessage] = useState('');

  const { zoomLevel, increaseZoom, decreaseZoom, resetZoom } = useZoom();
  useZoomKeyboardShortcuts(increaseZoom, decreaseZoom, resetZoom);

  // Apply theme on mount
  useEffect(() => {
    themeService.applyPreferred();
  }, []);

  // Verificar disponibilidade do electronAPI no mount
  useEffect(() => {
    const api = (window as unknown as { electronAPI?: unknown }).electronAPI;
    if (!api) {
      console.error('[App] ✗ window.electronAPI não está disponível!');
      console.error('[App] Verifique se o preload script foi carregado corretamente.');
    } else {
      console.log('[App] ✓ window.electronAPI está disponível');
      console.log('[App] electronAPI:', typeof api, Object.keys(api as object));
    }
  }, []);

  // Load keymaps
  useEffect(() => {
    keymapsService.load().then(setKeymaps).catch(console.error);
  }, []);

  // Register Docker events listener
  useEffect(() => {
    if (!isMonitoring) return;

    const handler = (_event: DockerEvent) => {
      // Events are handled inside Dashboard/other pages via their own listeners
    };

    window.electronAPI?.on(IPC.DOCKER_EVENT, handler);
    window.electronAPI?.invoke(IPC.DOCKER_EVENTS_START);

    return () => {
      window.electronAPI?.off(IPC.DOCKER_EVENT, handler);
      window.electronAPI?.invoke(IPC.DOCKER_EVENTS_STOP);
    };
  }, [isMonitoring]);

  // Centraliza navegação entre abas + anúncio para leitores de tela
  const navigateTo = useCallback((target: PageId | 'next' | 'prev') => {
    setCurrentPage((prev) => {
      let next: PageId;
      if (target === 'next') {
        const idx = TABS.findIndex((t) => t.id === prev);
        next = TABS[(idx + 1) % TABS.length].id;
      } else if (target === 'prev') {
        const idx = TABS.findIndex((t) => t.id === prev);
        next = TABS[(idx - 1 + TABS.length) % TABS.length].id;
      } else {
        next = target;
      }
      const tab = TABS.find((t) => t.id === next)!;
      // Adia o anúncio para depois do re-render evitar colisão de estado
      setTimeout(() => setAnnounceMessage(`Aba ${tab.label} ativada`), 0);
      return next;
    });
  }, []);

  // Global keydown handler for navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Tab / Ctrl+Shift+Tab: navegar entre abas ciclicamente
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) { navigateTo('prev'); } else { navigateTo('next'); }
      }
      else if (e.ctrlKey && e.key === '1') { e.preventDefault(); navigateTo('dashboard'); }
      else if (e.ctrlKey && e.key === '2') { e.preventDefault(); navigateTo('composer'); }
      else if (e.ctrlKey && e.key === '3') { e.preventDefault(); navigateTo('stacks'); }
      else if (e.ctrlKey && e.key === '4') { e.preventDefault(); navigateTo('images'); }
      else if (e.ctrlKey && e.key === '5') { e.preventDefault(); navigateTo('networks'); }
      else if (e.altKey && e.key === '4') { e.preventDefault(); navigateTo('logs'); }
      else if (e.ctrlKey && e.key === '6') { e.preventDefault(); navigateTo('cloud'); }
      else if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setShowCommandPalette(true); }
      else if (e.key === 'F5') { e.preventDefault(); setAnnounceMessage('Tela atualizada.'); }
      else if (e.ctrlKey && e.altKey && e.key === 'm') {
        e.preventDefault();
        setIsMonitoring((v) => !v);
        setAnnounceMessage(isMonitoring ? 'Monitoramento pausado.' : 'Monitoramento retomado.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMonitoring, navigateTo]);

  const handleOpenLogs = useCallback((id: string, name: string) => {
    setLogsTarget({ id, name });
    navigateTo('logs');
  }, [navigateTo]);

  // Docker event handler passed to pages
  const onDockerEvent = useCallback(
    (handler: (event: DockerEvent) => void): (() => void) => {
      window.electronAPI?.on(IPC.DOCKER_EVENT, handler as (...args: unknown[]) => void);
      return () => {
        window.electronAPI?.off(IPC.DOCKER_EVENT, handler as (...args: unknown[]) => void);
      };
    },
    []
  );

  const commands: Command[] = [
    ...TABS.map((t) => ({
      id: `nav-${t.id}`,
      label: `Ir para ${t.label}`,
      shortcut: t.shortcut,
      category: 'Navegação',
      action: () => navigateTo(t.id),
    })),
    {
      id: 'nav-next-tab',
      label: 'Próxima aba',
      shortcut: 'Ctrl+Tab',
      category: 'Navegação',
      action: () => navigateTo('next'),
    },
    {
      id: 'nav-prev-tab',
      label: 'Aba anterior',
      shortcut: 'Ctrl+Shift+Tab',
      category: 'Navegação',
      action: () => navigateTo('prev'),
    },
    {
      id: 'toggle-monitoring',
      label: isMonitoring ? 'Pausar monitoramento' : 'Retomar monitoramento',
      shortcut: 'Ctrl+Alt+M',
      action: () => setIsMonitoring((v) => !v),
    },
    {
      id: 'open-keymaps',
      label: 'Abrir arquivo de atalhos',
      shortcut: 'Ctrl+Shift+K',
      action: () => keymapsService.openFile(),
    },
    {
      id: 'zoom-in',
      label: 'Aumentar zoom',
      shortcut: 'Ctrl++',
      action: increaseZoom,
    },
    {
      id: 'zoom-out',
      label: 'Diminuir zoom',
      shortcut: 'Ctrl+-',
      action: decreaseZoom,
    },
    {
      id: 'zoom-reset',
      label: 'Resetar zoom',
      shortcut: 'Ctrl+0',
      action: resetZoom,
    },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            dockerService={dockerService}
            onDockerEvent={onDockerEvent}
            onOpenLogs={handleOpenLogs}
          />
        );
      case 'composer':
        return <Composer dockerService={dockerService} />;
      case 'stacks':
        return <Stacks dockerService={dockerService} />;
      case 'images':
        return <Images dockerService={dockerService} />;
      case 'networks':
        return <Networks dockerService={dockerService} />;
      case 'logs':
        return (
          <Logs
            dockerService={dockerService}
            initialContainerId={logsTarget?.id}
            initialContainerName={logsTarget?.name}
          />
        );
      case 'cloud':
        return <Cloud />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.appShell}>
      {/* Global live region for navigation announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announceMessage}
      </div>

      {/* Sidebar navigation */}
      <nav className={styles.sidebar} aria-label="Navegação principal">
        <div className={styles.logo} aria-label="Heitor CD">
          <span className={styles.logoText}>H</span>
        </div>

        <ul className={styles.navList} role="list">
          {TABS.map((tab) => (
            <li key={tab.id} role="none">
              <button
                role="tab"
                aria-selected={currentPage === tab.id}
                aria-label={`${tab.label} (${tab.shortcut})`}
                className={[
                  styles.navItem,
                  currentPage === tab.id ? styles.navItemActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => navigateTo(tab.id)}
                type="button"
              >
                <span className={styles.navLabel}>{tab.label}</span>
                <kbd className={styles.navShortcut} aria-hidden="true">{tab.shortcut}</kbd>
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.footerBtn}
            onClick={() => setShowCommandPalette(true)}
            aria-label="Abrir paleta de comandos (Ctrl+K)"
            type="button"
            title="Ctrl+K"
          >
            ⌘ Comandos
          </button>
          <button
            className={[styles.footerBtn, !isMonitoring ? styles.monitoringOff : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setIsMonitoring((v) => !v)}
            aria-pressed={isMonitoring}
            aria-label={`Monitoramento ${isMonitoring ? 'ativo' : 'pausado'} (Ctrl+Alt+M)`}
            type="button"
          >
            {isMonitoring ? '● Monitor' : '○ Pausado'}
          </button>
          <span className={styles.zoomIndicator} aria-label={`Zoom: ${zoomLevel}%`}>
            {zoomLevel}%
          </span>
        </div>
      </nav>

      {/* Main content area */}
      <div className={styles.mainContent} role="main" id="main-content">
        {renderPage()}
      </div>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
        data-testid="command-palette"
      />
    </div>
  );
};
