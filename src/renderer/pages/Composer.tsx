import React, { useState, useCallback } from 'react';
import { Button } from '@/components/Button/Button';
import { Input } from '@/components/Input/Input';
import { Modal } from '@/components/Modal/Modal';
import { announceToScreenReader } from '@/utils/aria';
import type { ComposeService } from '../../../types/docker';
import styles from './Composer.module.css';

interface ComposerProps {
  dockerService: {
    parseCompose(yaml: string): Promise<ComposeService[]>;
    exportCompose(services: ComposeService[]): Promise<string>;
    composeUp(yamlPath: string): Promise<void>;
    composeDown(yamlPath: string): Promise<void>;
  };
}

const createEmptyService = (): ComposeService => ({
  id: crypto.randomUUID(),
  name: '',
  image: '',
  ports: [],
  environment: {},
  volumes: [],
  networks: [],
  depends_on: [],
  restart: 'no',
});

export const Composer: React.FC<ComposerProps> = ({ dockerService }) => {
  const [services, setServices] = useState<ComposeService[]>([]);
  const [editingService, setEditingService] = useState<ComposeService | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportYaml, setExportYaml] = useState('');
  const [importYaml, setImportYaml] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addService = useCallback(() => {
    const s = createEmptyService();
    setServices((prev) => [...prev, s]);
    setEditingService(s);
    announceToScreenReader('Novo serviço adicionado. Preencha os campos.', false);
  }, []);

  const saveService = useCallback((updated: ComposeService) => {
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingService(null);
    announceToScreenReader(`Serviço ${updated.name || 'sem nome'} salvo.`, false);
  }, []);

  const removeService = useCallback((id: string) => {
    const s = services.find((svc) => svc.id === id);
    setServices((prev) => prev.filter((svc) => svc.id !== id));
    if (s) announceToScreenReader(`Serviço ${s.name} removido.`, false);
  }, [services]);

  const enterMoveMode = useCallback(() => {
    setMoveMode(true);
    setMovingId(null);
    announceToScreenReader('Modo mover ativo. Selecione um serviço para mover.', false);
  }, []);

  const exitMoveMode = useCallback(() => {
    setMoveMode(false);
    setMovingId(null);
    announceToScreenReader('Modo mover cancelado.', false);
  }, []);

  const handleMoveUp = useCallback(() => {
    if (!movingId) return;
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === movingId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      announceToScreenReader(`Serviço movido para cima. Posição ${idx}.`, false);
      return next;
    });
  }, [movingId]);

  const handleMoveDown = useCallback(() => {
    if (!movingId) return;
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === movingId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      announceToScreenReader(`Serviço movido para baixo. Posição ${idx + 2}.`, false);
      return next;
    });
  }, [movingId]);

  const confirmMove = useCallback(() => {
    setMoveMode(false);
    setMovingId(null);
    announceToScreenReader('Movimentação confirmada.', false);
  }, []);

  const handleExport = async () => {
    try {
      const yaml = await dockerService.exportCompose(services);
      setExportYaml(yaml);
      setShowExport(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleImport = async () => {
    try {
      const parsed = await dockerService.parseCompose(importYaml);
      setServices(parsed.map((s, i) => ({ ...s, id: `imported-${i}-${Date.now()}` })));
      setShowImport(false);
      setImportYaml('');
      announceToScreenReader(`${parsed.length} serviço(s) importado(s) com sucesso.`, false);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!moveMode) return;
    if (e.key === 'Escape') exitMoveMode();
    if (e.key === 'Enter') confirmMove();
    if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); handleMoveUp(); }
    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); handleMoveDown(); }
  };

  return (
    <main className={styles.page} aria-label="Composer - Visual Builder" onKeyDown={handleKeyDown}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMessage}</div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Composer</h1>
        <div className={styles.toolbarActions}>
          <Button label="Adicionar serviço (Ctrl+Shift+A)" onClick={addService} data-testid="add-service" />
          {!moveMode ? (
            <Button
              label="Modo mover (Ctrl+Shift+M)"
              variant="secondary"
              onClick={enterMoveMode}
              disabled={services.length < 2}
              data-testid="move-mode-btn"
            />
          ) : (
            <>
              <Button label="↑ (Alt+↑)" variant="ghost" onClick={handleMoveUp} disabled={!movingId} />
              <Button label="↓ (Alt+↓)" variant="ghost" onClick={handleMoveDown} disabled={!movingId} />
              <Button label="Confirmar (Enter)" variant="primary" onClick={confirmMove} />
              <Button label="Cancelar (Esc)" variant="secondary" onClick={exitMoveMode} />
            </>
          )}
          <Button label="Importar YAML" variant="ghost" onClick={() => setShowImport(true)} />
          <Button label="Exportar YAML" variant="ghost" onClick={handleExport} disabled={services.length === 0} />
        </div>
      </div>

      {error && (
        <div role="alert" className={styles.error}>{error}
          <Button label="Fechar" variant="ghost" size="sm" onClick={() => setError(null)} />
        </div>
      )}

      {moveMode && (
        <div role="status" className={styles.moveBanner}>
          Modo mover ativo. {movingId ? 'Use Alt+↑/↓ para mover, Enter para confirmar.' : 'Clique em um serviço para selecionar.'}
        </div>
      )}

      {services.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum serviço. Adicione um serviço ou importe um arquivo YAML.</p>
          <Button label="Adicionar serviço" onClick={addService} />
        </div>
      ) : (
        <div className={styles.serviceList} role="list" aria-label="Serviços do compose">
          {services.map((svc, idx) => (
            <article
              key={svc.id}
              role="listitem"
              aria-label={`Serviço ${svc.name || 'sem nome'}, posição ${idx + 1} de ${services.length}`}
              className={[
                styles.serviceCard,
                moveMode && movingId === svc.id ? styles.serviceMoving : '',
              ]
                .filter(Boolean)
                .join(' ')}
              tabIndex={moveMode ? 0 : -1}
              onClick={() => {
                if (moveMode) {
                  setMovingId(svc.id);
                  announceToScreenReader(`${svc.name} selecionado para mover.`, false);
                }
              }}
              onKeyDown={(e) => {
                if (moveMode && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  setMovingId(svc.id);
                }
              }}
            >
              <div className={styles.serviceHeader}>
                <span className={styles.serviceIndex} aria-hidden="true">{idx + 1}</span>
                <div>
                  <h2 className={styles.serviceName}>{svc.name || <em>sem nome</em>}</h2>
                  <p className={styles.serviceImage}>{svc.image || <em>sem imagem</em>}</p>
                </div>
                <div className={styles.serviceActions}>
                  {!moveMode && (
                    <>
                      <Button
                        label="Editar"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingService(svc)}
                        data-testid={`edit-service-${svc.id}`}
                      />
                      <Button
                        label="Remover"
                        variant="danger"
                        size="sm"
                        onClick={() => removeService(svc.id)}
                        data-testid={`remove-service-${svc.id}`}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className={styles.serviceMeta}>
                {svc.ports.length > 0 && (
                  <span className={styles.metaChip}>Portas: {svc.ports.join(', ')}</span>
                )}
                {svc.depends_on.length > 0 && (
                  <span className={styles.metaChip}>Depende: {svc.depends_on.join(', ')}</span>
                )}
                {svc.restart && svc.restart !== 'no' && (
                  <span className={styles.metaChip}>Restart: {svc.restart}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit service modal */}
      {editingService && (
        <ServiceEditModal
          service={editingService}
          onSave={saveService}
          onClose={() => setEditingService(null)}
        />
      )}

      {/* Export modal */}
      <Modal isOpen={showExport} title="Exportar docker-compose.yaml" onClose={() => setShowExport(false)} size="lg">
        <pre className={styles.yamlOutput} aria-label="YAML gerado">{exportYaml}</pre>
        <Button
          label="Copiar para clipboard"
          onClick={() => {
            navigator.clipboard.writeText(exportYaml);
            announceToScreenReader('YAML copiado para clipboard.', false);
          }}
        />
      </Modal>

      {/* Import modal */}
      <Modal
        isOpen={showImport}
        title="Importar docker-compose.yaml"
        onClose={() => setShowImport(false)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setShowImport(false)} />
            <Button label="Importar" onClick={handleImport} disabled={!importYaml.trim()} />
          </>
        }
      >
        <textarea
          className={styles.yamlInput}
          value={importYaml}
          onChange={(e) => setImportYaml(e.target.value)}
          placeholder="Cole o conteúdo do docker-compose.yaml aqui..."
          aria-label="Conteúdo YAML para importar"
          rows={16}
        />
      </Modal>
    </main>
  );
};

// ─── Service Edit Modal ────────────────────────────────────────────────────────
interface ServiceEditModalProps {
  service: ComposeService;
  onSave: (s: ComposeService) => void;
  onClose: () => void;
}

const ServiceEditModal: React.FC<ServiceEditModalProps> = ({ service, onSave, onClose }) => {
  const [form, setForm] = useState({ ...service });

  const set = (field: keyof ComposeService, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setList = (field: 'ports' | 'volumes' | 'networks' | 'depends_on', raw: string) =>
    set(field, raw.split('\n').map((s) => s.trim()).filter(Boolean));

  const setEnv = (raw: string) => {
    const env: Record<string, string> = {};
    raw.split('\n').forEach((line) => {
      const [k, ...rest] = line.split('=');
      if (k?.trim()) env[k.trim()] = rest.join('=').trim();
    });
    set('environment', env);
  };

  return (
    <Modal
      isOpen
      title={`Editar serviço: ${form.name || 'novo'}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button label="Cancelar" variant="secondary" onClick={onClose} />
          <Button
            label="Salvar"
            onClick={() => onSave(form)}
            disabled={!form.name || !form.image}
          />
        </>
      }
    >
      <div className={styles.editGrid}>
        <Input id="svc-name" label="Nome do serviço *" value={form.name} onChange={(v) => set('name', v)} required />
        <Input id="svc-image" label="Imagem *" value={form.image} onChange={(v) => set('image', v)} required />
        <Input id="svc-command" label="Command" value={form.command ?? ''} onChange={(v) => set('command', v)} />
        <div>
          <label className={styles.fieldLabel} htmlFor="svc-restart">Restart policy</label>
          <select
            id="svc-restart"
            className={styles.select}
            value={form.restart ?? 'no'}
            onChange={(e) => set('restart', e.target.value)}
            aria-label="Restart policy"
          >
            <option value="no">no</option>
            <option value="always">always</option>
            <option value="on-failure">on-failure</option>
            <option value="unless-stopped">unless-stopped</option>
          </select>
        </div>
        <div className={styles.textareaField}>
          <label className={styles.fieldLabel} htmlFor="svc-ports">Portas (uma por linha, ex: 8080:80)</label>
          <textarea id="svc-ports" className={styles.textarea} rows={3} value={form.ports.join('\n')} onChange={(e) => setList('ports', e.target.value)} aria-label="Portas" />
        </div>
        <div className={styles.textareaField}>
          <label className={styles.fieldLabel} htmlFor="svc-env">Variáveis de ambiente (KEY=value)</label>
          <textarea id="svc-env" className={styles.textarea} rows={4} value={Object.entries(form.environment).map(([k, v]) => `${k}=${v}`).join('\n')} onChange={(e) => setEnv(e.target.value)} aria-label="Variáveis de ambiente" />
        </div>
        <div className={styles.textareaField}>
          <label className={styles.fieldLabel} htmlFor="svc-volumes">Volumes (um por linha)</label>
          <textarea id="svc-volumes" className={styles.textarea} rows={3} value={form.volumes.join('\n')} onChange={(e) => setList('volumes', e.target.value)} aria-label="Volumes" />
        </div>
        <div className={styles.textareaField}>
          <label className={styles.fieldLabel} htmlFor="svc-deps">Depends on (um por linha)</label>
          <textarea id="svc-deps" className={styles.textarea} rows={2} value={form.depends_on.join('\n')} onChange={(e) => setList('depends_on', e.target.value)} aria-label="Dependências" />
        </div>
      </div>
    </Modal>
  );
};
