'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: '/route',
    href: '/route',
    description: 'Interactive route planning with traffic analysis'
  },
  {
    name: '/table',
    href: '/table',
    description: 'Distance/duration matrix calculations'
  }
];

export function DemoNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border p-1">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-mono font-medium transition-colors',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              isActive 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            )}
            title={item.description}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}