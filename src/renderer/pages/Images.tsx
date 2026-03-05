import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { Modal } from '@/components/Modal/Modal';
import { announceToScreenReader } from '@/utils/aria';
import type { ImageInfo } from '../../../types/docker';
import styles from './Images.module.css';

interface ImagesProps {
  dockerService: {
    listImages(): Promise<ImageInfo[]>;
    removeImage(id: string, force?: boolean): Promise<void>;
    pullImage(name: string): Promise<void>;
  };
}

export const Images: React.FC<ImagesProps> = ({ dockerService }) => {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [pullName, setPullName] = useState('');
  const [showPull, setShowPull] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dockerService.listImages();
      setImages(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dockerService]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await dockerService.removeImage(removeTarget.id, true);
      setLiveMessage(`${removeTarget.name} removida.`);
      announceToScreenReader(`${removeTarget.name} removida.`, false);
      setRemoveTarget(null);
      await fetchImages();
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

  const filteredImages = images.filter((img) =>
    img.RepoTags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <main className={styles.page} aria-label="Imagens Docker">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Imagens</h1>
        <div className={styles.toolbarActions}>
          <Input
            id="img-search"
            label="Buscar imagem"
            value={search}
            onChange={setSearch}
            placeholder="Nome..."
            type="search"
          />
          <Button label="Pull imagem" onClick={() => setShowPull(true)} data-testid="pull-btn" />
          <Button label="Atualizar" variant="ghost" onClick={fetchImages} />
        </div>
      </div>

      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div role="status" aria-label="Carregando imagens...">
          Carregando...
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table
            className={styles.table}
            aria-label={`Imagens — ${filteredImages.length} encontrada(s)`}
          >
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
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    Nenhuma imagem encontrada.
                  </td>
                </tr>
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
                        onClick={() => setRemoveTarget({ id: img.Id, name: tag })}
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

      {/* Pull image modal */}
      <Modal
        isOpen={showPull}
        title="Pull de imagem"
        onClose={() => setShowPull(false)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setShowPull(false)} />
            <Button
              label="Pull"
              onClick={handlePull}
              disabled={!pullName.trim()}
              data-testid="confirm-pull"
            />
          </>
        }
      >
        <Input
          id="pull-name"
          label="Nome da imagem (ex: nginx:latest)"
          value={pullName}
          onChange={setPullName}
          required
        />
      </Modal>

      {/* Remove confirmation */}
      <Modal
        isOpen={!!removeTarget}
        title="Confirmar remoção"
        onClose={() => setRemoveTarget(null)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setRemoveTarget(null)} />
            <Button
              label="Remover"
              variant="danger"
              onClick={handleRemove}
              data-testid="confirm-remove"
            />
          </>
        }
      >
        <p>
          Remover <strong>{removeTarget?.name}</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </main>
  );
};
