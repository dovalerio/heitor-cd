import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button/Button';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { Modal } from '@/components/Modal/Modal';
import { announceToScreenReader } from '@/utils/aria';
import type { StackInfo } from '../../../types/docker';
import styles from './Stacks.module.css';

interface StacksProps {
  dockerService: {
    listStacks(): Promise<StackInfo[]>;
    composeUp(yamlPath: string): Promise<void>;
    composeDown(yamlPath: string): Promise<void>;
  };
}

export const Stacks: React.FC<StacksProps> = ({ dockerService }) => {
  const [stacks, setStacks] = useState<StackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downTarget, setDownTarget] = useState<StackInfo | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const fetchStacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dockerService.listStacks();
      setStacks(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dockerService]);

  useEffect(() => {
    fetchStacks();
  }, [fetchStacks]);

  const handleDown = async () => {
    if (!downTarget?.configFile) return;
    try {
      await dockerService.composeDown(downTarget.configFile);
      setLiveMessage(`Stack ${downTarget.name} parada.`);
      announceToScreenReader(`Stack ${downTarget.name} parada com sucesso.`, false);
      setDownTarget(null);
      fetchStacks();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const statusMap: Record<StackInfo['status'], 'running' | 'paused' | 'exited'> = {
    running: 'running',
    partial: 'paused',
    stopped: 'exited',
  };

  return (
    <main className={styles.page} aria-label="Gerenciador de stacks">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <div className={styles.toolbar}>
        <h1 className={styles.title}>Stacks</h1>
        <Button
          label="Atualizar"
          variant="ghost"
          onClick={fetchStacks}
          data-testid="refresh-stacks"
        />
      </div>

      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div role="status" className={styles.loading} aria-label="Carregando stacks...">
          Carregando...
        </div>
      ) : stacks.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhuma stack Compose encontrada.</p>
          <p>
            Stacks aparecem aqui quando containers são iniciados com <code>docker compose up</code>.
          </p>
        </div>
      ) : (
        <div className={styles.stackList} role="list" aria-label="Stacks compose">
          {stacks.map((stack) => (
            <article
              key={stack.name}
              role="listitem"
              className={styles.stackCard}
              aria-label={`Stack ${stack.name}, status: ${stack.status}`}
            >
              <div className={styles.stackHeader}>
                <div>
                  <h2 className={styles.stackName}>{stack.name}</h2>
                  {stack.configFile && <p className={styles.configFile}>{stack.configFile}</p>}
                </div>
                <StatusBadge
                  status={statusMap[stack.status]}
                  data-testid={`stack-status-${stack.name}`}
                />
              </div>
              <ul className={styles.serviceList} aria-label="Serviços da stack">
                {stack.services.map((svc) => (
                  <li key={svc} className={styles.serviceItem}>
                    {svc}
                  </li>
                ))}
              </ul>
              <div className={styles.stackActions}>
                <Button
                  label="Parar stack"
                  variant="danger"
                  size="sm"
                  disabled={stack.status === 'stopped' || !stack.configFile}
                  onClick={() => setDownTarget(stack)}
                  data-testid={`down-${stack.name}`}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!downTarget}
        title="Parar stack"
        onClose={() => setDownTarget(null)}
        footer={
          <>
            <Button label="Cancelar" variant="secondary" onClick={() => setDownTarget(null)} />
            <Button
              label="Parar stack"
              variant="danger"
              onClick={handleDown}
              data-testid="confirm-down"
            />
          </>
        }
      >
        <p>
          Tem certeza que deseja parar a stack <strong>{downTarget?.name}</strong>?
        </p>
        <p>Todos os containers da stack serão parados.</p>
      </Modal>
    </main>
  );
};
