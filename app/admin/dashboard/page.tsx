// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  //funcionService, 
  movieService, 
  //roomService 
} from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    movies: 0,
    //rooms: 0,
    //functions: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [moviesRes] = await Promise.all([
          movieService.getAll(),
          //roomService.getAll(),
         //funcionService.getAll()
        ]);

        setStats({
          movies: Array.isArray(moviesRes) ? moviesRes.length : 0
          //rooms: Array.isArray(roomsRes) ? roomsRes.length : 0,
          //functions: Array.isArray(functionsRes) ? functionsRes.length : 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Resumen del Sistema</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Películas</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.movies}</p>
          <button 
            onClick={() => router.push('/admin/movies')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Gestionar Películas
          </button>
        </div>
        
        {/* <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Salas</h3>
          <p className="text-3xl font-bold text-blue-600">{}</p>
          <button 
            onClick={() => router.push('/admin/rooms')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Gestionar Salas
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Funciones</h3>
          <p className="text-3xl font-bold text-blue-600">{}</p>
          <button 
            onClick={() => router.push('/admin/functions')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Gestionar Funciones
          </button>
        </div> */}
      </div>
    </div>
  );
}