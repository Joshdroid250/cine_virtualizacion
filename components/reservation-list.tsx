// components/ui/reservation-list.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserReservations } from '@/lib/api';
import type { Reservation } from '@/types/types';

export function ReservationList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchReservations = async () => {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const result = await getUserReservations(token);
        if (Array.isArray(result)) {
          setReservations(result);
        } else {
          setError(result.message || 'Error al cargar reservaciones');
        }
      } catch (err) {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [router]);

  if (loading) return <div className="text-center py-8">Cargando reservas...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="space-y-4">
      {reservations.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No tienes reservaciones aún</p>
      ) : (
        reservations.map(reservation => (
          <div key={reservation.id} className="p-4 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold">{reservation.movie}</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p><span className="font-medium">Fecha:</span> {reservation.date}</p>
              <p><span className="font-medium">Hora:</span> {reservation.time}</p>
              <p><span className="font-medium">Sala:</span> {reservation.sala}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}