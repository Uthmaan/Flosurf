import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Flosurf Production Card Container Component
 * Static primitive adhering to Tier-3 Card Tokens.
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flosurf-card ${className}`}
      style={{
        backgroundColor: 'var(--card-container-bg)',
        borderWidth: 'var(--card-container-border-width)',
        borderStyle: 'solid',
        borderColor: 'var(--card-container-border)',
        borderRadius: 'var(--card-container-radius)',
        padding: 'var(--card-container-padding)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--card-container-gap)',
      }}
      {...props}
    >
      {(title || subtitle) && (
        <header className="flosurf-card__header">
          {title && (
            <h3
              style={{
                margin: 0,
                color: 'var(--card-title-fg)',
                fontSize: 'var(--card-title-size)',
                fontWeight: 'var(--card-title-weight)',
                lineHeight: 'var(--card-title-line-height)',
              }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                margin: 'var(--space-100) 0 0 0',
                color: 'var(--card-body-fg)',
                fontSize: 'var(--font-caption-size)',
              }}
            >
              {subtitle}
            </p>
          )}
        </header>
      )}

      <div
        className="flosurf-card__body"
        style={{
          color: 'var(--card-body-fg)',
          fontSize: 'var(--card-body-size)',
          lineHeight: 'var(--card-body-line-height)',
        }}
      >
        {children}
      </div>

      {footer && <footer className="flosurf-card__footer">{footer}</footer>}
    </div>
  );
};
