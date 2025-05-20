// app/admin/rooms/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { roomService } from '@/lib/api';
import type { Room } from '@/types/types';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const result = await roomService.getAll();
        if (Array.isArray(result)) {
          setRooms(result);
        } else {
          setError(result.message || 'Error al cargar salas');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta funcion?')) return;
    
        try {
          // TODO: Replace 'yourToken' with the actual token value
          const result = await roomService.delete(id, 'yourToken');
          if ('message' in result && (result as any).status) {
            setError(result.message || 'Error al eliminar');
          } else {
            setRooms(rooms.filter(rooms => rooms.idsalas !== id));
          }
        } catch (err) {
          setError('Error de conexión');
        }
      };

  if (loading) {
    return <div>Cargando salas...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Salas</h2>
        <Link 
          href="/admin/rooms/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Crear Nueva Sala
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Columnas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asientos Totales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rooms.map(room => (
              <tr key={room.idsalas}>
                <td className="px-6 py-4 whitespace-nowrap">{room.idsalas}</td>
                <td className="px-6 py-4 whitespace-nowrap">{room.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{room.fila}</td>
                <td className="px-6 py-4 whitespace-nowrap">{room.columnas}</td>
                <td className="px-6 py-4 whitespace-nowrap">{room.fila * room.columnas}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <Link 
                    href={`/admin/rooms/edit/${room.idsalas}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleDelete(room.idsalas)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}