type StatusType = 'ok' | 'low' | 'out' | 'success' | 'warning' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusStyles: Record<StatusType, { bg: string; text: string; label: string }> = {
  ok: { bg: 'bg-green-100', text: 'text-green-800', label: 'OK' },
  low: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'LOW' },
  out: { bg: 'bg-red-100', text: 'text-red-800', label: 'OUT' },
  success: { bg: 'bg-green-100', text: 'text-green-800', label: 'Success' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Warning' },
  error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles.bg} ${styles.text}`}
      role="status"
      aria-label={label || styles.label}
    >
      {label || styles.label}
    </span>
  );
}
