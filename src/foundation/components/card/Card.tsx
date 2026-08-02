import React from 'react';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type TextAlign = 'left' | 'center' | 'right';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  clickable?: boolean;
  hoverable?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: TextAlign;
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  elevated: {
    boxShadow: 'var(--shadow-md)',
    border: 'none',
    backgroundColor: 'var(--color-background)',
  },
  outlined: {
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
  },
  filled: {
    backgroundColor: 'var(--color-surface)',
    border: 'none',
  },
};

const paddingStyles: Record<CardPadding, React.CSSProperties> = {
  none: { padding: '0' },
  sm: { padding: '0.75rem' },
  md: { padding: '1rem' },
  lg: { padding: '1.5rem' },
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'elevated', padding = 'md', clickable = false, hoverable = false, style, ...props }, ref) => {
    const cardStyle: React.CSSProperties = {
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: clickable ? 'pointer' : 'default',
      ...variantStyles[variant],
      ...paddingStyles[padding],
      ...(hoverable ? { ':hover': { boxShadow: 'var(--shadow-lg)' } } : {}),
      ...style,
    };

    if (clickable) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          style={{
            ...cardStyle,
            textAlign: 'left',
            width: '100%',
            fontFamily: 'inherit',
          }}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        />
      );
    }

    return <div ref={ref} style={cardStyle} {...props} />;
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ align = 'left', style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--color-border-muted)',
          textAlign: align,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ style, children, ...props }, ref) => {
    return (
      <div ref={ref} style={{ padding: '1rem', ...style }} {...props}>
        {children}
      </div>
    );
  }
);
CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ bordered = true, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          padding: '1rem',
          borderTop: bordered ? '1px solid var(--color-border-muted)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ style, children, ...props }, ref) => {
    return (
      <h3 ref={ref} style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', ...style }} {...props}>
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ style, children, ...props }, ref) => {
    return (
      <p ref={ref} style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem', ...style }} {...props}>
        {children}
      </p>
    );
  }
);
CardDescription.displayName = 'CardDescription';
