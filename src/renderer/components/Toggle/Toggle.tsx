import React from 'react';
import { getToggleAriaProps } from '@/utils/aria';
import styles from './Toggle.module.css';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'data-testid'?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  'data-testid': testId,
}) => {
  const ariaProps = getToggleAriaProps(checked, label, disabled);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  };

  return (
    <div
      className={[styles.wrapper, disabled ? styles.disabled : ''].filter(Boolean).join(' ')}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role={ariaProps.role}
      aria-checked={ariaProps['aria-checked']}
      aria-label={ariaProps['aria-label']}
      aria-disabled={ariaProps['aria-disabled']}
      data-testid={testId}
    >
      <div className={[styles.track, checked ? styles.trackOn : ''].filter(Boolean).join(' ')}>
        <div className={[styles.thumb, checked ? styles.thumbOn : ''].filter(Boolean).join(' ')} />
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
};
