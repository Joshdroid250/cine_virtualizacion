// app/mis-reservas/page.tsx
import { ReservationList } from '@/components/reservation-list';

export default function MisReservasPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Mis Reservas</h1>
      <ReservationList />
    </div>
  );
}