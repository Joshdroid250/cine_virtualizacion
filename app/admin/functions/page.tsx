'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { funcionService } from '@/lib/api';
import type { Funcion } from '@/types/types';


export default function FuncionesPage() {
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
      const fetchRooms = async () => {
        try {
          const result = await funcionService.getAll();
          if (Array.isArray(result)) {
            setFunciones(result);
          } else {
            setError(result.message || 'Error al cargar funciones');
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
    if (!confirm('¿Estás seguro de eliminar esta función?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/funcion/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setFunciones(funciones.filter(f => f.id !== id));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  if (loading) return <div>Cargando funciones...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Funciones</h2>
        <Link 
          href="/admin/funciones/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Crear Nueva Función
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Película</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Sala</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {funciones.map(funcion => (
              <tr key={funcion.id}>
                <td className="px-6 py-4">{funcion.id}</td>
                <td className="px-6 py-4">{new Date(funcion.fecha).toLocaleDateString()}</td>
                <td className="px-6 py-4">{funcion.hora}</td>
                <td className="px-6 py-4">{funcion.id_movie}</td>
                <td className="px-6 py-4">{funcion.salas_idsalas}</td>
                <td className="px-6 py-4 space-x-2">
                  <Link 
                    href={`/admin/funciones/edit/${funcion.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleDelete(funcion.id)}
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
