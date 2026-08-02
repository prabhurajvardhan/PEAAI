/**
 * Card Component
 * Container with header, body, and footer sections
 */

import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: 'elevated' | 'outlined' | 'filled';
  /** Card padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Hoverable state */
  hoverable?: boolean;
  /** Clickable (renders as button) */
  clickable?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Align header content */
  align?: 'left' | 'center' | 'right';
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Disable padding */
  noPadding?: boolean;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Align footer content */
  align?: 'left' | 'center' | 'right';
  /** Add top border */
  bordered?: boolean;
}

const baseStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-elevated)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
};

const variantStyles: Record<NonNullable<CardProps['variant']>, React.CSSProperties> = {
  elevated: {
    boxShadow: 'var(--shadow-md)',
    border: 'none',
  },
  outlined: {
    boxShadow: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--color-border)',
  },
  filled: {
    boxShadow: 'none',
    border: 'none',
    backgroundColor: 'var(--color-surface)',
  },
};

const paddingMap: Record<NonNullable<CardProps['padding']>, string> = {
  none: '0',
  sm: 'var(--spacing-3)',
  md: 'var(--spacing-4)',
  lg: 'var(--spacing-6)',
};

/**
 * Card component
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      padding = 'md',
      hoverable = false,
      clickable = false,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const combinedStyles: React.CSSProperties = {
      ...baseStyles,
      ...variantStyles[variant],
      ...(hoverable && {
        transition: 'box-shadow var(--transition-duration-fast) var(--transition-timing-function-ease-in-out), transform var(--transition-duration-fast) var(--transition-timing-function-ease-in-out)',
      }),
      ...style,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable) {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }
      (props as React.HTMLAttributes<HTMLDivElement>).onMouseEnter?.(e as any);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable) {
        e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow || 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }
      (props as React.HTMLAttributes<HTMLDivElement>).onMouseLeave?.(e as any);
    };

    if (clickable) {
      return (
        <button
          ref={ref as any}
          type="button"
          onClick={(props as any).onClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            ...combinedStyles,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            fontFamily: 'inherit',
            padding: paddingMap[padding],
          }}
        >
          {children}
        </button>
      );
    }

    return (
      <div
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          ...combinedStyles,
          padding: paddingMap[padding],
        }}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card header section
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ align = 'left', children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          padding: 'var(--spacing-4)',
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

/**
 * Card body section
 */
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ noPadding = false, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          padding: noPadding ? '0' : 'var(--spacing-4)',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

/**
 * Card footer section
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ align = 'left', bordered = true, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          padding: 'var(--spacing-4)',
          borderTop: bordered ? '1px solid var(--color-border-muted)' : 'none',
          textAlign: align,
          display: 'flex',
          gap: 'var(--spacing-2)',
          justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
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

/**
 * Card title
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function CardTitle({ as: Component = 'h3', children, style, ...props }: CardTitleProps): JSX.Element {
  return (
    <Component
      style={{
        margin: 0,
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-foreground)',
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Card description
 */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ children, style, ...props }: CardDescriptionProps): JSX.Element {
  return (
    <p
      style={{
        margin: 'var(--spacing-1) 0 0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-muted-foreground)',
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
}
