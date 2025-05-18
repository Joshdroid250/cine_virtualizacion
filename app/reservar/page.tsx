'use client';
import FuncionComboBox from '@/components/FuncionComboBox';

export default function ReservarPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Reserva de Entradas</h1>
        <FuncionComboBox />
      </div>
    </div>
  );
}