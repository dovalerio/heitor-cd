import React from 'react';
import type { ContainerStatus } from '../../../types/docker';
import styles from './StatusBadge.module.css';

const STATUS_LABELS: Record<ContainerStatus, string> = {
  running: 'Running',
  exited: 'Stopped',
  paused: 'Paused',
  restarting: 'Restarting',
  created: 'Created',
  removing: 'Removing',
  dead: 'Dead',
};

const STATUS_CLASS: Record<ContainerStatus, string> = {
  running: 'statusRunning',
  exited: 'statusExited',
  paused: 'statusPaused',
  restarting: 'statusRestarting',
  created: 'statusCreated',
  removing: 'statusRemoving',
  dead: 'statusDead',
};

export interface StatusBadgeProps {
  status: ContainerStatus;
  'data-testid'?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, 'data-testid': testId }) => {
  const label = STATUS_LABELS[status] ?? status;
  const cssClass = STATUS_CLASS[status] ?? '';

  return (
    <span
      className={[styles.badge, cssClass ? styles[cssClass as keyof typeof styles] : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={`Status: ${label}`}
      data-testid={testId}
    >
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </span>
  );
};
