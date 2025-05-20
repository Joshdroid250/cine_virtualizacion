// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin/movies', label: 'Películas', icon: '🎬' },
    { href: '/admin/functions', label: 'Funciones', icon: '📅' },
    { href: '/admin/rooms', label: 'Salas', icon: '🎭' },
    { href: '/admin/users', label: 'Usuarios', icon: '👥' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8 p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Panel de Administración</h1>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}