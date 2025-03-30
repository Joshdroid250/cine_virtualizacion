import { ReservationForm } from '@/components/reservation';

export default function ReservarPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Reserva</h1>
      <ReservationForm />
    </div>
  )
}

