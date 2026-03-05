import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/Button/Button';
import { Toggle } from '@/components/Toggle/Toggle';
import { announceToScreenReader } from '@/utils/aria';
import type { ContainerInfo, LogLine } from '../../../types/docker';
import styles from './Logs.module.css';

interface LogsProps {
  dockerService: {
    listContainers(all?: boolean): Promise<ContainerInfo[]>;
    getContainerLogs(id: string, tail?: number, stderr?: boolean): Promise<LogLine[]>;
  };
  initialContainerId?: string;
  initialContainerName?: string;
}

export const Logs: React.FC<LogsProps> = ({
  dockerService,
  initialContainerId,
  initialContainerName,
}) => {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [selectedId, setSelectedId] = useState(initialContainerId ?? '');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [showStderr, setShowStderr] = useState(false);
  const [tail, setTail] = useState(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchContainers = useCallback(async () => {
    try {
      const data = await dockerService.listContainers(true);
      setContainers(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }, [dockerService]);

  useEffect(() => { fetchContainers(); }, [fetchContainers]);

  const fetchLogs = useCallback(async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await dockerService.getContainerLogs(id, tail, showStderr);
      setLogs(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dockerService, tail, showStderr]);

  useEffect(() => {
    if (selectedId) fetchLogs(selectedId);
  }, [selectedId, fetchLogs]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const handleCopyStderr = () => {
    const stderrText = logs
      .filter((l) => l.stream === 'stderr')
      .map((l) => `[${l.timestamp}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(stderrText);
    announceToScreenReader('Logs de erro copiados para clipboard.', false);
  };

  const selectedContainer = containers.find((c) => c.Id === selectedId);
  const displayName = selectedContainer?.Names[0]?.replace(/^\//, '') ?? initialContainerName ?? '';

  const visibleLogs = showStderr ? logs.filter((l) => l.stream === 'stderr') : logs;

  return (
    <main className={styles.page} aria-label="Visualizador de logs">
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Logs</h1>
        <div className={styles.toolbarActions}>
          <div className={styles.selectWrapper}>
            <label htmlFor="container-select" className={styles.selectLabel}>Container:</label>
            <select
              id="container-select"
              className={styles.select}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              aria-label="Selecionar container"
            >
              <option value="">— Selecione —</option>
              {containers.map((c) => (
                <option key={c.Id} value={c.Id}>
                  {c.Names[0]?.replace(/^\//, '')} ({c.State})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectWrapper}>
            <label htmlFor="tail-select" className={styles.selectLabel}>Linhas:</label>
            <select
              id="tail-select"
              className={styles.select}
              value={tail}
              onChange={(e) => setTail(Number(e.target.value))}
              aria-label="Número de linhas"
            >
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
          <Toggle label="Apenas STDERR" checked={showStderr} onChange={setShowStderr} data-testid="stderr-toggle" />
          <Toggle label="Auto-scroll" checked={autoScroll} onChange={setAutoScroll} />
          {selectedId && (
            <Button label="Atualizar" variant="ghost" onClick={() => fetchLogs(selectedId)} />
          )}
          <Button
            label="Copiar STDERR (Ctrl+Shift+C)"
            variant="ghost"
            disabled={logs.filter((l) => l.stream === 'stderr').length === 0}
            onClick={handleCopyStderr}
            data-testid="copy-stderr-btn"
          />
        </div>
      </div>

      {error && <div role="alert" className={styles.error}>{error}</div>}

      {!selectedId ? (
        <div className={styles.empty}>
          <p>Selecione um container para visualizar os logs.</p>
        </div>
      ) : loading ? (
        <div role="status" className={styles.loading} aria-label="Carregando logs...">Carregando logs...</div>
      ) : (
        <div className={styles.logContainer}>
          <div
            className={styles.logHeader}
            aria-label={`Logs de ${displayName} — ${visibleLogs.length} linha(s)`}
          >
            <span className={styles.logTitle}>{displayName}</span>
            <span className={styles.logCount}>{visibleLogs.length} linhas</span>
          </div>
          <div
            role="log"
            aria-label={`Logs do container ${displayName}`}
            aria-live="polite"
            aria-relevant="additions"
            className={styles.logOutput}
            tabIndex={0}
          >
            {visibleLogs.length === 0 ? (
              <span className={styles.noLogs}>Sem logs para exibir.</span>
            ) : (
              visibleLogs.map((line, i) => (
                <div
                  key={i}
                  className={[styles.logLine, line.stream === 'stderr' ? styles.logStderr : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className={styles.logTimestamp} aria-hidden="true">
                    {new Date(line.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={styles.logStream}
                    aria-label={line.stream === 'stderr' ? 'erro' : 'saída'}
                  >
                    [{line.stream}]
                  </span>
                  <span className={styles.logMessage}>{line.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </main>
  );
};
