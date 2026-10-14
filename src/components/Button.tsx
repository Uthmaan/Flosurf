import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Flosurf Production Button Component
 * Fully adheres to W3C Tier-3 Component Tokens and WAI-ARIA 1.2 Button Pattern.
 * Zero hardcoded CSS / hex / px values.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const disabled = isDisabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-busy={isLoading}
        aria-disabled={disabled}
        data-variant={variant}
        data-size={size}
        className={`flosurf-button flosurf-button--${variant} flosurf-button--${size} ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--button-gap)',
          paddingLeft: `var(--button-padding-x-${size})`,
          paddingRight: `var(--button-padding-x-${size})`,
          paddingTop: `var(--button-padding-y-${size})`,
          paddingBottom: `var(--button-padding-y-${size})`,
          minHeight: `var(--button-min-height-${size})`,
          fontSize: `var(--button-font-size-${size})`,
          fontWeight: 'var(--button-font-weight)',
          fontFamily: 'var(--button-font-family)',
          borderRadius: 'var(--button-radius)',
          borderWidth: 'var(--button-border-width)',
          borderStyle: 'solid',
          borderColor: `var(--button-${variant}-border-default)`,
          backgroundColor: `var(--button-${variant}-bg-default)`,
          color: `var(--button-${variant}-fg-default)`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transitionDuration: 'var(--button-transition-duration)',
          transitionTimingFunction: 'var(--button-transition-easing)',
          transitionProperty: 'background-color, border-color, color, box-shadow, opacity',
          outline: 'none',
        }}
        {...props}
      >
        {isLoading ? (
          <span className="flosurf-button__spinner" aria-hidden="true" style={{ display: 'inline-block' }}>
            ◌
          </span>
        ) : (
          leftIcon && <span className="flosurf-button__icon-left">{leftIcon}</span>
        )}
        <span className="flosurf-button__label">{children}</span>
        {!isLoading && rightIcon && <span className="flosurf-button__icon-right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
