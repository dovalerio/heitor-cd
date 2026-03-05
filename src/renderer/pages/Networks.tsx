import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { Modal } from '@/components/Modal/Modal';
import { Tree, TreeNode } from '@/components/Tree/Tree';
import { announceToScreenReader } from '@/utils/aria';
import type { NetworkInfo } from '../../../types/docker';
import styles from './Networks.module.css';

interface NetworksProps {
  dockerService: {
    listNetworks(): Promise<NetworkInfo[]>;
    createNetwork(name: string, driver?: string): Promise<{ id: string }>;
    removeNetwork(id: string): Promise<void>;
  };
}

export const Networks: React.FC<NetworksProps> = ({ dockerService }) => {
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showTree, setShowTree] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [showCreateNetwork, setShowCreateNetwork] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [newNetworkDriver, setNewNetworkDriver] = useState('bridge');
  const [liveMessage, setLiveMessage] = useState('');

  const fetchNetworks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dockerService.listNetworks();
      setNetworks(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dockerService]);

  useEffect(() => { fetchNetworks(); }, [fetchNetworks]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await dockerService.removeNetwork(removeTarget.id);
      setLiveMessage(`Rede ${removeTarget.name} removida.`);
      announceToScreenReader(`Rede ${removeTarget.name} removida.`, false);
      setRemoveTarget(null);
      await fetchNetworks();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleCreateNetwork = async () => {
    if (!newNetworkName.trim()) return;
    try {
      await dockerService.createNetwork(newNetworkName.trim(), newNetworkDriver);
      setLiveMessage(`Rede ${newNetworkName} criada.`);
      announceToScreenReader(`Rede ${newNetworkName} criada.`, false);
      setNewNetworkName('');
      setShowCreateNetwork(false);
      await fetchNetworks();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const networkTreeNodes: TreeNode[] = networks.map((net) => ({
    id: net.Id,
    label: net.Name,
    children: Object.values(net.Containers ?? {}).map((c) => ({
      id: `${net.Id}-${c.Name}`,
      label: `${c.Name} (${c.IPv4Address || 'no IP'})`,
    })),
  }));

  const filteredNetworks = networks.filter((net) =>
    net.Name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className={styles.page} aria-label="Redes Docker">
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMessage}</div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Redes</h1>
        <div className={styles.toolbarActions}>
          <Input
            id="net-search"
            label="Buscar rede"
            value={search}
            onChange={setSearch}
            placeholder="Nome..."
            type="search"
          />
          <Button label="Criar rede" onClick={() => setShowCreateNetwork(true)} data-testid="create-network-btn" />
          <Button label="Árvore (Ctrl+E)" variant="ghost" pressed={showTree} onClick={() => setShowTree((v) => !v)} />
          <Button label="Atualizar" variant="ghost" onClick={fetchNetworks} />
        </div>
      </div>

      {error && <div role="alert" className={styles.error}>{error}</div>}

      {showTree && (
        <div className={styles.treePanel} aria-label="Árvore de redes">
          <Tree nodes={networkTreeNodes} label="Redes Docker" data-testid="network-tree" />
        </div>
      )}

      {loading ? (
        <div role="status" aria-label="Carregando redes...">Carregando...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table} aria-label={`Redes — ${filteredNetworks.length} encontrada(s)`}>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Driver</th>
                <th scope="col">Escopo</th>
                <th scope="col">Containers</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredNetworks.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>Nenhuma rede encontrada.</td></tr>
              )}
              {filteredNetworks.map((net) => (
                <tr key={net.Id} className={styles.row}>
                  <td className={styles.mono}>{net.Name}</td>
                  <td>{net.Driver}</td>
                  <td>{net.Scope}</td>
                  <td>{Object.keys(net.Containers ?? {}).length}</td>
                  <td>
                    <Button
                      label="Remover"
                      variant="danger"
                      size="sm"
                      disabled={['bridge', 'host', 'none'].includes(net.Name)}
                      onClick={() => setRemoveTarget({ id: net.Id, name: net.Name })}
                      data-testid={`remove-net-${net.Id}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create network modal */}
      <Modal
        isOpen={showCreateNetwork}
        title="Criar rede"
        onClose={() => setShowCreateNetwork(false)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setShowCreateNetwork(false)} />
            <Button label="Criar" onClick={handleCreateNetwork} disabled={!newNetworkName.trim()} data-testid="confirm-create-net" />
          </>
        }
      >
        <div className={styles.createNetForm}>
          <Input id="net-name" label="Nome da rede" value={newNetworkName} onChange={setNewNetworkName} required />
          <div>
            <label className={styles.fieldLabel} htmlFor="net-driver">Driver</label>
            <select
              id="net-driver"
              className={styles.select}
              value={newNetworkDriver}
              onChange={(e) => setNewNetworkDriver(e.target.value)}
              aria-label="Driver da rede"
            >
              <option value="bridge">bridge</option>
              <option value="host">host</option>
              <option value="overlay">overlay</option>
              <option value="macvlan">macvlan</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Remove confirmation */}
      <Modal
        isOpen={!!removeTarget}
        title="Confirmar remoção"
        onClose={() => setRemoveTarget(null)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setRemoveTarget(null)} />
            <Button label="Remover" variant="danger" onClick={handleRemove} data-testid="confirm-remove" />
          </>
        }
      >
        <p>Remover rede <strong>{removeTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
      </Modal>
    </main>
  );
};
