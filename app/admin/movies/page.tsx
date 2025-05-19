// app/admin/movies/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { movieService } from '@/lib/api';
import type { Movie } from '@/types/types';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const result = await movieService.getAll();
        if (Array.isArray(result)) {
          setMovies(result);
        } else {
          setError(result.message || 'Error al cargar películas');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta película?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/movies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setMovies(movies.filter(movie => movie.idmovie !== id));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  if (loading) {
    return <div>Cargando películas...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Películas</h2>
        <Link 
          href="/admin/movies/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Crear Nueva Película
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Género</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movies.map(movie => (
              <tr key={movie.idmovie}>
                <td className="px-6 py-4 whitespace-nowrap">{movie.idmovie}</td>
                <td className="px-6 py-4 whitespace-nowrap">{movie.titulo}</td>
                <td className="px-6 py-4 whitespace-nowrap">{movie.duration}</td>
                <td className="px-6 py-4 whitespace-nowrap">{movie.genre}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <Link 
                    href={`/admin/movies/edit/${movie.idmovie}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleDelete(movie.idmovie)}
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