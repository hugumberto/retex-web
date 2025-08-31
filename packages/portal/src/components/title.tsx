import React from 'react';
import clsx from 'clsx';

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  color?: 'primary' | 'secondary';
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function Title({
  color = 'secondary',
  children,
  as: Component = 'h1',
  className,
  ...props
}: TitleProps) {
  return (
    <Component
      className={clsx(
        'font-bold',
        color === 'primary' && 'text-primary',
        color === 'secondary' && 'text-secondary',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Title;
