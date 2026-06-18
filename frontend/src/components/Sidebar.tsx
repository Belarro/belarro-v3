'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DashboardIcon,
  LeafIcon,
  FileTextIcon,
  CurrencyEuroIcon,
  UsersIcon,
  ShoppingCartIcon,
  BoxIcon,
  ClipboardListIcon,
  PhoneIcon,
  SparklesIcon,
} from './Icons';

const sections = [
  {
    title: null,
    items: [{ label: 'Dashboard', href: '/', icon: DashboardIcon }],
  },
  {
    title: 'Production',
    items: [
      { label: 'Crops', href: '/admin/crops', icon: LeafIcon },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Customers', href: '/customers', icon: UsersIcon },
      { label: 'Orders', href: '/orders', icon: ShoppingCartIcon },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Inventory', href: '/inventory', icon: BoxIcon },
      { label: 'Invoices', href: '/invoices', icon: ClipboardListIcon },
      { label: 'Follow-ups', href: '/follow-ups', icon: PhoneIcon },
      { label: 'Seeding', href: '/seeding', icon: SparklesIcon },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <nav className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            {section.title && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">
                {section.title}
              </h3>
            )}
            {section.items.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 border-l-4 ${
                    isActive
                      ? 'bg-green-50 text-green-700 border-green-600 font-medium'
                      : 'text-gray-700 border-transparent hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                >
                  <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
