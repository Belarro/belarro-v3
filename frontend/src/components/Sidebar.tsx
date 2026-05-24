'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Crops', href: '/crops', icon: '🌱' },
  { label: 'Customers', href: '/customers', icon: '👥' },
  { label: 'Orders', href: '/orders', icon: '📦' },
  { label: 'Standing Orders', href: '/standing-orders', icon: '🔄' },
  { label: 'Inventory', href: '/inventory', icon: '📦' },
  { label: 'Invoices', href: '/invoices', icon: '💰' },
  { label: 'Seeding', href: '/seeding', icon: '🌾' },
  { label: 'Follow-ups', href: '/follow-ups', icon: '📞' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
