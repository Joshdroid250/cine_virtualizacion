// components/ui/reservation.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createReservation } from '@/lib/api';
import type { Reservation, ApiError } from '@/types/types';

export function ReservationForm() {
  const [formData, setFormData] = useState<Omit<Reservation, 'id' | 'userId'>>({
    movie: '',
    date: '',
    time: '',
    sala: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'sala' ? parseInt(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const result = await createReservation(formData, token);
      
      if ('id' in result) {
        router.push('/reserva'); // Redirige a la lista de reservas después de crear
      } else if ('message' in result) {
        setError(result.message);
      }
    } catch (error) {
      setError('Error al crear la reservación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nueva Reservación</h1>
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campos del formulario */}
        <div>
          <label htmlFor="movie" className="block mb-1 font-medium">Película</label>
          <input
            type="text"
            id="movie"
            name="movie"
            value={formData.movie}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="date" className="block mb-1 font-medium">Fecha</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="time" className="block mb-1 font-medium">Hora</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="sala" className="block mb-1 font-medium">Sala</label>
          <input
            type="number"
            id="sala"
            name="sala"
            value={formData.sala}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            min="1"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex justify-center items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </>
          ) : 'Reservar'}
        </button>
        
        <div className="pt-4 text-center">
          <Link 
            href="/reserva" 
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
          >
            ← Ver mis reservas existentes
          </Link>
        </div>
      </form>
    </div>
  );
}