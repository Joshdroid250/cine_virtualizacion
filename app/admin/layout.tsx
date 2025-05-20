// app/admin/layout.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Panel de Administración</h1>
            <div className="flex space-x-4">
              <Link href="/admin/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded">
                Dashboard
              </Link>
              <Link href="/admin/movies" className="hover:bg-blue-700 px-3 py-2 rounded">
                Películas
              </Link>
              <Link href="/admin/rooms" className="hover:bg-blue-700 px-3 py-2 rounded">
                Salas
              </Link>
              <Link href="/admin/functions" className="hover:bg-blue-700 px-3 py-2 rounded">
                Funciones
              </Link>
              <button 
                onClick={() => {
                  sessionStorage.removeItem('authToken');
                  router.push('/');
                }}
                className="hover:bg-red-700 px-3 py-2 rounded"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}