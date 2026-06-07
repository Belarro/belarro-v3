import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'alert' | 'success';
}

export default function Card({
  title,
  subtitle,
  children,
  className = '',
  variant = 'default',
}: CardProps) {
  const variantClasses = {
    default: 'bg-white border-gray-200',
    alert: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
  }[variant];

  return (
    <div
      className={`rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 p-6 ${variantClasses} ${className}`}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
