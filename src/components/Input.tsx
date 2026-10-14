import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'error';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  sizeVariant?: InputSize;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

/**
 * Flosurf Production Input Component
 * Fully adheres to W3C Tier-3 Component Tokens and WAI-ARIA 1.2 Textbox Pattern.
 * Zero hardcoded CSS / hex / px values.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      sizeVariant = 'md',
      isInvalid = false,
      isDisabled = false,
      isLoading = false,
      label,
      helperText,
      errorMessage,
      leftAddon,
      rightAddon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const variant: InputVariant = isInvalid ? 'error' : 'default';
    const disabled = isDisabled || isLoading;

    return (
      <div
        className={`flosurf-input-group ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--layout-gap-xs)',
          width: '100%',
        }}
      >
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: 'var(--font-label-size-sm)',
              fontWeight: 'var(--font-label-weight)',
              color: isInvalid ? 'var(--color-fg-danger)' : 'var(--color-fg-default)',
            }}
          >
            {label}
          </label>
        )}

        <div
          className="flosurf-input-wrapper"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {leftAddon && (
            <span
              style={{
                position: 'absolute',
                left: `var(--input-padding-x-${sizeVariant})`,
                color: 'var(--color-fg-muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={isInvalid}
            aria-disabled={disabled}
            aria-describedby={
              isInvalid && errorMessage ? errorId : helperText ? helperId : undefined
            }
            data-variant={variant}
            data-size={sizeVariant}
            style={{
              width: '100%',
              minHeight: `var(--input-min-height-${sizeVariant})`,
              paddingLeft: leftAddon
                ? 'var(--layout-padding-control-x-lg)'
                : `var(--input-padding-x-${sizeVariant})`,
              paddingRight: rightAddon
                ? 'var(--layout-padding-control-x-lg)'
                : `var(--input-padding-x-${sizeVariant})`,
              paddingTop: `var(--input-padding-y-${sizeVariant})`,
              paddingBottom: `var(--input-padding-y-${sizeVariant})`,
              fontSize: `var(--input-font-size-${sizeVariant})`,
              fontFamily: 'var(--input-font-family)',
              color: disabled
                ? 'var(--color-fg-disabled)'
                : `var(--input-${variant}-fg-default)`,
              backgroundColor: disabled
                ? 'var(--color-bg-surface-sunken)'
                : `var(--input-${variant}-bg-default)`,
              borderColor: `var(--input-${variant}-border-default)`,
              borderWidth: 'var(--input-border-width)',
              borderStyle: 'solid',
              borderRadius: 'var(--input-radius)',
              outline: 'none',
              boxSizing: 'border-box',
              cursor: disabled ? 'not-allowed' : 'text',
              transition:
                'border-color var(--motion-duration-fast) var(--motion-easing-standard), box-shadow var(--motion-duration-fast) var(--motion-easing-standard)',
            }}
            {...props}
          />

          {rightAddon && (
            <span
              style={{
                position: 'absolute',
                right: `var(--input-padding-x-${sizeVariant})`,
                color: 'var(--color-fg-muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {rightAddon}
            </span>
          )}
        </div>

        {isInvalid && errorMessage ? (
          <span
            id={errorId}
            role="alert"
            style={{
              fontSize: 'var(--font-caption-size)',
              color: 'var(--color-fg-danger)',
              marginTop: 'var(--space-25)',
            }}
          >
            {errorMessage}
          </span>
        ) : helperText ? (
          <span
            id={helperId}
            style={{
              fontSize: 'var(--font-caption-size)',
              color: 'var(--color-fg-muted)',
              marginTop: 'var(--space-25)',
            }}
          >
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
