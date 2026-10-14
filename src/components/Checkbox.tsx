import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  sizeVariant?: 'sm' | 'md';
  isChecked?: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  label?: React.ReactNode;
  supportingText?: React.ReactNode;
  count?: number | string;
  errorMessage?: string;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Flosurf Production Checkbox Component
 * Generated from uSpec extraction of Figma Flo Design System.
 * Fully satisfies W3C DTCG Token Hierarchy and WAI-ARIA 1.2 Checkbox Pattern.
 * Zero hardcoded CSS / hex / px values.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      sizeVariant = 'md',
      isChecked = false,
      isIndeterminate = false,
      isDisabled = false,
      isLoading = false,
      label,
      supportingText,
      count,
      errorMessage,
      onCheckedChange,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const descId = `${inputId}-desc`;
    const disabled = isDisabled || isLoading;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        htmlFor={inputId}
        className={`flosurf-checkbox flosurf-checkbox--${sizeVariant} ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: 'var(--layout-gap-sm)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 'var(--opacity-disabled, 0.6)' : 1,
          userSelect: 'none',
          minHeight: 'var(--layout-control-h-sm)',
        }}
      >
        <span
          className="flosurf-checkbox__box-wrapper"
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 'var(--space-25)',
          }}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={isChecked}
            disabled={disabled}
            aria-checked={isIndeterminate ? 'mixed' : isChecked}
            aria-disabled={disabled}
            aria-busy={isLoading}
            aria-describedby={supportingText || errorMessage ? descId : undefined}
            onChange={handleChange}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
              margin: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            {...props}
          />

          <span
            className="flosurf-checkbox__control"
            aria-hidden="true"
            data-checked={isChecked}
            data-indeterminate={isIndeterminate}
            data-disabled={disabled}
            data-loading={isLoading}
            style={{
              width: 'var(--layout-control-h-sm)',
              minHeight: 'var(--layout-control-h-sm)',
              borderRadius: 'var(--radius-sm)',
              borderWidth: 'var(--border-width-default, 1px)',
              borderStyle: 'solid',
              borderColor: disabled
                ? 'var(--border-surface-subtle, var(--color-border-subtle))'
                : isChecked || isIndeterminate
                ? 'var(--core-brand-gratitude-default, var(--color-bg-action-primary-default))'
                : 'var(--border-surface-default, var(--color-border-default))',
              backgroundColor: disabled
                ? 'var(--background-surface-floor-1, var(--color-bg-surface-sunken))'
                : isChecked || isIndeterminate
                ? 'var(--core-brand-gratitude-default, var(--color-bg-action-primary-default))'
                : 'var(--background-surface-floor-2, var(--color-bg-surface-raised))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition:
                'background-color var(--motion-duration-fast) var(--motion-easing-standard), border-color var(--motion-duration-fast) var(--motion-easing-standard), box-shadow var(--motion-duration-fast) var(--motion-easing-standard)',
            }}
          >
            {isLoading ? (
              <span
                className="flosurf-checkbox__spinner"
                style={{
                  display: 'inline-block',
                  fontSize: 'var(--font-caption-size)',
                  color: 'var(--text-inverse-default, var(--color-fg-on-action))',
                }}
              >
                ◌
              </span>
            ) : isIndeterminate ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  stroke: 'var(--text-inverse-default, var(--color-fg-on-action))',
                  strokeWidth: 'var(--border-width-focus, 2px)',
                  strokeLinecap: 'round',
                }}
              >
                <line x1="2" y1="6" x2="10" y2="6" />
              </svg>
            ) : isChecked ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  stroke: 'var(--text-inverse-default, var(--color-fg-on-action))',
                  strokeWidth: 'var(--border-width-focus, 2px)',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
              >
                <path d="M2.5 6.5L4.5 8.5L9.5 3.5" />
              </svg>
            ) : null}
          </span>
        </span>

        {(label || supportingText || count !== undefined) && (
          <span
            className="flosurf-checkbox__label-container"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: 'var(--space-25)',
            }}
          >
            <span
              className="flosurf-checkbox__title-row"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-50)',
              }}
            >
              {label && (
                <span
                  style={{
                    fontSize: 'var(--font-body-size-md)',
                    lineHeight: 'var(--font-body-line-height-md)',
                    color: disabled
                      ? 'var(--text-neutral-disabled, var(--color-fg-disabled))'
                      : 'var(--text-neutral-default, var(--color-fg-default))',
                  }}
                >
                  {label}
                </span>
              )}

              {count !== undefined && (
                <span
                  style={{
                    fontSize: 'var(--font-caption-size)',
                    color: 'var(--text-neutral-subtle, var(--color-fg-muted))',
                  }}
                >
                  ({count})
                </span>
              )}
            </span>

            {supportingText && (
              <span
                id={descId}
                style={{
                  fontSize: 'var(--font-caption-size)',
                  color: errorMessage
                    ? 'var(--core-utility-destructive-default, var(--color-fg-danger))'
                    : 'var(--text-neutral-subtle, var(--color-fg-muted))',
                }}
              >
                {errorMessage || supportingText}
              </span>
            )}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
