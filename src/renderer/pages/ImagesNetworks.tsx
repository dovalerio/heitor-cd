import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { Modal } from '@/components/Modal/Modal';
import { Tree, TreeNode } from '@/components/Tree/Tree';
import { announceToScreenReader } from '@/utils/aria';
import type { ImageInfo, NetworkInfo } from '../../../types/docker';
import styles from './ImagesNetworks.module.css';

type TabType = 'images' | 'networks';

interface ImagesNetworksProps {
  dockerService: {
    listImages(): Promise<ImageInfo[]>;
    removeImage(id: string, force?: boolean): Promise<void>;
    pullImage(name: string): Promise<void>;
    listNetworks(): Promise<NetworkInfo[]>;
    createNetwork(name: string, driver?: string): Promise<{ id: string }>;
    removeNetwork(id: string): Promise<void>;
  };
}

export const ImagesNetworks: React.FC<ImagesNetworksProps> = ({ dockerService }) => {
  const [tab, setTab] = useState<TabType>('images');
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showTree, setShowTree] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string; type: 'image' | 'network' } | null>(null);
  const [pullName, setPullName] = useState('');
  const [showPull, setShowPull] = useState(false);
  const [showCreateNetwork, setShowCreateNetwork] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [newNetworkDriver, setNewNetworkDriver] = useState('bridge');
  const [liveMessage, setLiveMessage] = useState('');

  const fetchImages = useCallback(async () => {
    const data = await dockerService.listImages();
    setImages(data);
  }, [dockerService]);

  const fetchNetworks = useCallback(async () => {
    const data = await dockerService.listNetworks();
    setNetworks(data);
  }, [dockerService]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchImages(), fetchNetworks()]);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchImages, fetchNetworks]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      if (removeTarget.type === 'image') await dockerService.removeImage(removeTarget.id, true);
      else await dockerService.removeNetwork(removeTarget.id);
      setLiveMessage(`${removeTarget.name} removido.`);
      announceToScreenReader(`${removeTarget.name} removido.`, false);
      setRemoveTarget(null);
      await fetchAll();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handlePull = async () => {
    if (!pullName.trim()) return;
    try {
      await dockerService.pullImage(pullName.trim());
      setLiveMessage(`Pull de ${pullName} concluído.`);
      announceToScreenReader(`Pull de ${pullName} concluído.`, false);
      setPullName('');
      setShowPull(false);
      await fetchImages();
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

  // Tree nodes for networks showing connected containers
  const networkTreeNodes: TreeNode[] = networks.map((net) => ({
    id: net.Id,
    label: net.Name,
    children: Object.values(net.Containers ?? {}).map((c) => ({
      id: `${net.Id}-${c.Name}`,
      label: `${c.Name} (${c.IPv4Address || 'no IP'})`,
    })),
  }));

  const filteredImages = images.filter((img) =>
    img.RepoTags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredNetworks = networks.filter((net) =>
    net.Name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className={styles.page} aria-label="Imagens e redes">
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMessage}</div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Images & Networks</h1>
        <div className={styles.toolbarActions}>
          <Input
            id="in-search"
            label="Buscar"
            value={search}
            onChange={setSearch}
            placeholder="Nome..."
            type="search"
          />
          <Button label="Atualizar" variant="ghost" onClick={fetchAll} />
          {tab === 'networks' && (
            <Button label="Árvore (Ctrl+E)" variant="ghost" pressed={showTree} onClick={() => setShowTree((v) => !v)} />
          )}
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Categorias">
        {(['images', 'networks'] as TabType[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            id={`tab-${t}`}
            className={[styles.tab, tab === t ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => { setTab(t); setSearch(''); }}
            type="button"
          >
            {t === 'images' ? 'Imagens' : 'Redes'}
          </button>
        ))}
      </div>

      {error && <div role="alert" className={styles.error}>{error}</div>}

      {tab === 'images' && (
        <section id="panel-images" role="tabpanel" aria-labelledby="tab-images" className={styles.panel}>
          <div className={styles.panelActions}>
            <Button label="Pull imagem" onClick={() => setShowPull(true)} data-testid="pull-btn" />
          </div>
          {loading ? (
            <div role="status" aria-label="Carregando imagens...">Carregando...</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table} aria-label={`Imagens — ${filteredImages.length} encontrada(s)`}>
                <thead>
                  <tr>
                    <th scope="col">Tag</th>
                    <th scope="col">ID</th>
                    <th scope="col">Tamanho</th>
                    <th scope="col">Criada</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredImages.length === 0 && (
                    <tr><td colSpan={5} className={styles.empty}>Nenhuma imagem encontrada.</td></tr>
                  )}
                  {filteredImages.map((img) => {
                    const tag = img.RepoTags?.[0] ?? '<none>';
                    const size = `${(img.Size / 1024 / 1024).toFixed(1)} MB`;
                    const created = new Date(img.Created * 1000).toLocaleDateString();
                    return (
                      <tr key={img.Id} className={styles.row}>
                        <td className={styles.mono}>{tag}</td>
                        <td className={styles.mono}>{img.Id.slice(7, 19)}</td>
                        <td>{size}</td>
                        <td>{created}</td>
                        <td>
                          <Button
                            label="Remover"
                            variant="danger"
                            size="sm"
                            onClick={() => setRemoveTarget({ id: img.Id, name: tag, type: 'image' })}
                            data-testid={`remove-image-${img.Id}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'networks' && (
        <section id="panel-networks" role="tabpanel" aria-labelledby="tab-networks" className={styles.panel}>
          <div className={styles.panelActions}>
            <Button label="Criar rede" onClick={() => setShowCreateNetwork(true)} data-testid="create-network-btn" />
          </div>
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
                          onClick={() => setRemoveTarget({ id: net.Id, name: net.Name, type: 'network' })}
                          data-testid={`remove-net-${net.Id}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Pull image modal */}
      <Modal isOpen={showPull} title="Pull de imagem" onClose={() => setShowPull(false)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setShowPull(false)} />
            <Button label="Pull" onClick={handlePull} disabled={!pullName.trim()} data-testid="confirm-pull" />
          </>
        }
      >
        <Input id="pull-name" label="Nome da imagem (ex: nginx:latest)" value={pullName} onChange={setPullName} required />
      </Modal>

      {/* Create network modal */}
      <Modal isOpen={showCreateNetwork} title="Criar rede" onClose={() => setShowCreateNetwork(false)}
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
            <select id="net-driver" className={styles.select} value={newNetworkDriver} onChange={(e) => setNewNetworkDriver(e.target.value)} aria-label="Driver da rede">
              <option value="bridge">bridge</option>
              <option value="host">host</option>
              <option value="overlay">overlay</option>
              <option value="macvlan">macvlan</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Remove confirmation */}
      <Modal isOpen={!!removeTarget} title="Confirmar remoção" onClose={() => setRemoveTarget(null)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setRemoveTarget(null)} />
            <Button label="Remover" variant="danger" onClick={handleRemove} data-testid="confirm-remove" />
          </>
        }
      >
        <p>Remover <strong>{removeTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
      </Modal>
    </main>
  );
};
