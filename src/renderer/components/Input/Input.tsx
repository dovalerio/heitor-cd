import React from 'react';
import { getInputAriaProps } from '@/utils/aria';
import styles from './Input.module.css';

export interface InputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  helperText?: string;
  disabled?: boolean;
  type?: 'text' | 'search' | 'password' | 'email' | 'number';
  'data-testid'?: string;
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  invalid = false,
  errorMessage,
  helperText,
  disabled = false,
  type = 'text',
  'data-testid': testId,
}) => {
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  const ariaProps = getInputAriaProps(id, label, required, invalid, describedBy);

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>
      <input
        {...ariaProps}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={[styles.input, invalid ? styles.inputInvalid : ''].filter(Boolean).join(' ')}
        data-testid={testId}
      />
      {helperText && !errorMessage && (
        <span id={helperId} className={styles.helper}>
          {helperText}
        </span>
      )}
      {errorMessage && (
        <span id={errorId} className={styles.error} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
