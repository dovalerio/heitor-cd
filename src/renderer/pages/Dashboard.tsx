import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toggle } from '@/components/Toggle/Toggle';
import { Button } from '@/components/Button/Button';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Modal } from '@/components/Modal/Modal';
import { ContextMenu } from '@/components/ContextMenu/ContextMenu';
import { Tree, TreeNode } from '@/components/Tree/Tree';
import { Input } from '@/components/Input/Input';
import { announceToScreenReader } from '@/utils/aria';
import type { ContainerInfo, DockerEvent } from '../../../types/docker';
import styles from './Dashboard.module.css';

interface DashboardProps {
  dockerService: {
    listContainers(all?: boolean): Promise<ContainerInfo[]>;
    startContainer(id: string): Promise<void>;
    stopContainer(id: string): Promise<void>;
    removeContainer(id: string, force?: boolean): Promise<void>;
  };
  onDockerEvent?: (handler: (event: DockerEvent) => void) => () => void;
  onOpenLogs?: (containerId: string, containerName: string) => void;
}

interface ContextMenuState {
  container: ContainerInfo;
  position: { x: number; y: number };
}

export const Dashboard: React.FC<DashboardProps> = ({
  dockerService,
  onDockerEvent,
  onOpenLogs,
}) => {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [showStopped, setShowStopped] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ContainerInfo | null>(null);
  const [showTree, setShowTree] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const fetchContainers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dockerService.listContainers(showStopped);
      setContainers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load containers');
    } finally {
      setLoading(false);
    }
  }, [dockerService, showStopped]);

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  // Real-time Docker events
  useEffect(() => {
    if (!onDockerEvent) return;
    return onDockerEvent((event) => {
      if (event.Type === 'container') {
        fetchContainers();
        const name = event.Actor.Attributes?.name ?? event.Actor.ID.slice(0, 12);
        setLiveMessage(`Container ${name}: ${event.Action}`);
      }
    });
  }, [onDockerEvent, fetchContainers]);

  const filtered = containers.filter(
    (c) =>
      c.Names.some((n) => n.toLowerCase().includes(search.toLowerCase())) ||
      c.Image.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = async (container: ContainerInfo) => {
    try {
      await dockerService.startContainer(container.Id);
      announceToScreenReader(`Container ${container.Names[0]} iniciado`, false);
      fetchContainers();
    } catch (e: unknown) {
      announceToScreenReader(`Erro ao iniciar container: ${(e as Error).message}`, true);
    }
  };

  const handleStop = async (container: ContainerInfo) => {
    try {
      await dockerService.stopContainer(container.Id);
      announceToScreenReader(`Container ${container.Names[0]} parado`, false);
      fetchContainers();
    } catch (e: unknown) {
      announceToScreenReader(`Erro ao parar container: ${(e as Error).message}`, true);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    try {
      await dockerService.removeContainer(removeTarget.Id, true);
      announceToScreenReader(`Container ${removeTarget.Names[0]} removido`, false);
      setRemoveTarget(null);
      fetchContainers();
    } catch (e: unknown) {
      announceToScreenReader(`Erro ao remover: ${(e as Error).message}`, true);
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, container: ContainerInfo) => {
    if (e.key === ' ') {
      e.preventDefault();
      toggleSelect(container.Id);
    }
    if (e.key === 'Control' && e.code === 'Space') {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setContextMenu({ container, position: { x: rect.left, y: rect.bottom } });
    }
  };

  const treeNodes: TreeNode[] = containers.map((c) => ({
    id: c.Id,
    label: c.Names[0]?.replace(/^\//, '') ?? c.Id.slice(0, 12),
    children: [
      { id: `${c.Id}-image`, label: `Image: ${c.Image}` },
      { id: `${c.Id}-status`, label: `Status: ${c.State}` },
      ...(c.Ports?.length
        ? [{ id: `${c.Id}-ports`, label: `Ports: ${c.Ports.map((p) => p.PublicPort ?? p.PrivatePort).join(', ')}` }]
        : []),
    ],
  }));

  return (
    <main className={styles.page} aria-label="Dashboard de containers">
      {/* Live region for events */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.toolbarActions}>
          <Input
            id="container-search"
            label="Buscar containers"
            value={search}
            onChange={setSearch}
            placeholder="Nome ou imagem..."
            type="search"
            data-testid="container-search"
          />
          <Toggle
            label={showStopped ? 'Mostrando todos' : 'Apenas em execução'}
            checked={showStopped}
            onChange={(v) => setShowStopped(v)}
            data-testid="toggle-stopped"
          />
          <Button
            label="Atualizar"
            onClick={fetchContainers}
            variant="ghost"
            data-testid="refresh-btn"
          />
          <Button
            label="Árvore (Ctrl+E)"
            onClick={() => setShowTree((v) => !v)}
            variant="ghost"
            pressed={showTree}
            data-testid="tree-btn"
          />
        </div>
      </div>

      {showTree && (
        <section aria-label="Árvore de containers" className={styles.treePanel}>
          <Tree
            nodes={treeNodes}
            label="Árvore de containers"
            onActivate={(node) => {
              const c = containers.find((ct) => ct.Id === node.id);
              if (c) setContextMenu({ container: c, position: { x: 200, y: 200 } });
            }}
            data-testid="container-tree"
          />
        </section>
      )}

      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div role="status" className={styles.loading} aria-label="Carregando containers...">
          Carregando...
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table
            ref={tableRef}
            className={styles.table}
            aria-label={`Lista de containers — ${filtered.length} encontrado(s)`}
            aria-rowcount={filtered.length}
          >
            <thead>
              <tr>
                <th scope="col" className={styles.thCheck}>Sel.</th>
                <th scope="col">Nome</th>
                <th scope="col">Imagem</th>
                <th scope="col">Status</th>
                <th scope="col">Portas</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    Nenhum container encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((c, i) => {
                const name = c.Names[0]?.replace(/^\//, '') ?? c.Id.slice(0, 12);
                const selected = selectedIds.has(c.Id);
                return (
                  <tr
                    key={c.Id}
                    className={[styles.row, selected ? styles.rowSelected : '']
                      .filter(Boolean)
                      .join(' ')}
                    aria-selected={selected}
                    aria-rowindex={i + 1}
                    tabIndex={0}
                    onKeyDown={(e) => handleRowKeyDown(e, c)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ container: c, position: { x: e.clientX, y: e.clientY } });
                    }}
                    onClick={() => toggleSelect(c.Id)}
                  >
                    <td className={styles.tdCheck}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(c.Id)}
                        aria-label={`Selecionar ${name}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className={styles.tdName}>{name}</td>
                    <td className={styles.tdImage}>{c.Image}</td>
                    <td>
                      <StatusBadge status={c.State} data-testid={`status-${c.Id}`} />
                    </td>
                    <td className={styles.tdPorts}>
                      {c.Ports?.map((p) => (
                        <span key={`${p.PublicPort}-${p.PrivatePort}`} className={styles.port}>
                          {p.PublicPort ? `${p.PublicPort}:` : ''}{p.PrivatePort}/{p.Type}
                        </span>
                      ))}
                    </td>
                    <td className={styles.tdActions}>
                      {c.State === 'running' ? (
                        <Button
                          label="Parar"
                          variant="secondary"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleStop(c); }}
                          data-testid={`stop-${c.Id}`}
                        />
                      ) : (
                        <Button
                          label="Iniciar"
                          variant="primary"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleStart(c); }}
                          data-testid={`start-${c.Id}`}
                        />
                      )}
                      {onOpenLogs && c.State === 'running' && (
                        <Button
                          label="Logs"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onOpenLogs(c.Id, name); }}
                          data-testid={`logs-${c.Id}`}
                        />
                      )}
                      <Button
                        label="Remover"
                        variant="danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setRemoveTarget(c); }}
                        data-testid={`remove-${c.Id}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          items={[
            { id: 'start', label: 'Iniciar', disabled: contextMenu.container.State === 'running' },
            { id: 'stop', label: 'Parar', disabled: contextMenu.container.State !== 'running' },
            { id: 'logs', label: 'Ver logs', disabled: !onOpenLogs },
            { id: 'sep', separator: true },
            { id: 'remove', label: 'Remover', danger: true },
          ]}
          onSelect={(id) => {
            const c = contextMenu.container;
            if (id === 'start') handleStart(c);
            else if (id === 'stop') handleStop(c);
            else if (id === 'logs' && onOpenLogs) onOpenLogs(c.Id, c.Names[0]);
            else if (id === 'remove') setRemoveTarget(c);
          }}
          onClose={() => setContextMenu(null)}
          data-testid="container-context-menu"
        />
      )}

      <Modal
        isOpen={!!removeTarget}
        title="Confirmar remoção"
        onClose={() => setRemoveTarget(null)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setRemoveTarget(null)} />
            <Button label="Remover" variant="danger" onClick={handleRemoveConfirm} data-testid="confirm-remove" />
          </>
        }
        data-testid="remove-modal"
      >
        <p>
          Tem certeza que deseja remover o container{' '}
          <strong>{removeTarget?.Names[0]?.replace(/^\//, '')}</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </main>
  );
};
