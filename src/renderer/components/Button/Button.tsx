import React from 'react';
import { getButtonAriaProps } from '@/utils/aria';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  pressed?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  'data-testid'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  pressed,
  type = 'button',
  icon,
  fullWidth = false,
  'data-testid': testId,
}) => {
  const ariaProps = getButtonAriaProps(label, disabled, pressed);

  return (
    <button
      type={type}
      className={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaProps['aria-label']}
      aria-disabled={ariaProps['aria-disabled']}
      aria-pressed={ariaProps['aria-pressed']}
      data-testid={testId}
    >
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{label}</span>
    </button>
  );
};
