'use client';
import { useEffect, useState } from 'react';
import { funcionService, movieService, roomService, reservationService } from '@/lib/api';
import { isApiError } from '@/lib/api';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

type FuncionWithMovie = {
  funcion: {
    id: number;
    fecha: string;
    hora: string;
    salas_idsalas: number;
  };
  movie: {
    idmovie: number;
    titulo: string;
    posterImage: string;
  };
};

type Step = 'selection' | 'payment' | 'confirmation';

export default function FuncionReserva() {
  const router = useRouter();
  const [funciones, setFunciones] = useState<FuncionWithMovie[]>([]);
  const [loading, setLoading] = useState({
    funciones: true,
    sala: false,
    reserva: false
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedFuncion, setSelectedFuncion] = useState<FuncionWithMovie | null>(null);
  const [sala, setSala] = useState<{ idsalas: number; nombre: string; fila: number; columnas: number } | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<{fila: number, columna: number} | null>(null);
  const [step, setStep] = useState<Step>('selection');
  const [paymentMethod, setPaymentMethod] = useState<string>('credit');
  const [reservationId, setReservationId] = useState<string>('');
  const [reservationDetails, setReservationDetails] = useState<any>(null);

  // Cargar funciones y películas
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({...prev, funciones: true}));
        setError(null);

        const funcionesResponse = await funcionService.getAll();
        if (isApiError(funcionesResponse)) {
          throw new Error(funcionesResponse.message);
        }

        const funcionesConPeliculas = await Promise.all(
          funcionesResponse.map(async (funcion) => {
            const movieResponse = await movieService.getById(funcion.id_movie);
            if (isApiError(movieResponse)) {
              throw new Error(movieResponse.message);
            }
            return {
              funcion: {
                id: funcion.id,
                fecha: funcion.fecha,
                hora: funcion.hora,
                salas_idsalas: funcion.salas_idsalas
              },
              movie: {
                idmovie: movieResponse.idmovie,
                titulo: movieResponse.titulo,
                posterImage: movieResponse.posterImage
              }
            };
          })
        );

        setFunciones(funcionesConPeliculas);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(prev => ({...prev, funciones: false}));
      }
    };

    loadData();
  }, []);

  // Cargar sala cuando se selecciona una función
  useEffect(() => {
    if (!selectedFuncion) return;

    const loadSala = async () => {
      try {
        setLoading(prev => ({...prev, sala: true}));
        setError(null);
        setSelectedSeat(null);

        const salaResponse = await roomService.getById(selectedFuncion.funcion.salas_idsalas);
        if (isApiError(salaResponse)) {
          throw new Error(salaResponse.message);
        }

        setSala(salaResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar sala');
      } finally {
        setLoading(prev => ({...prev, sala: false}));
      }
    };

    loadSala();
  }, [selectedFuncion]);

  const handlePayment = () => {
    if (!selectedFuncion || !selectedSeat) return;
    setStep('payment');
  };

  const handleReservation = async () => {
    if (!selectedFuncion || !selectedSeat) return;

    try {
      setLoading(prev => ({...prev, reserva: true}));
      setError(null);

      const token = sessionStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const fecha = selectedFuncion.funcion.fecha.split('T')[0];
      const reservationData = {
        date: fecha,
        idfuncion: selectedFuncion.funcion.id,
        fila: selectedSeat.fila,
        columna: selectedSeat.columna,
        users_iduser: 1 // Temporal (deberías obtenerlo del token decodificado)
      };

      const result = await reservationService.create(reservationData, token);
      
      if (isApiError(result)) {
        if (result.status === 403) {
          sessionStorage.removeItem('authToken');
          setError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }
        
        setError(result.message || 'Error al crear la reserva');
        return;
      }

      // Guardar todos los detalles de la reserva
      setReservationDetails({
        id: result.id,
        movie: selectedFuncion.movie.titulo,
        date: fecha,
        time: selectedFuncion.funcion.hora.split(':').slice(0, 2).join(':'),
        sala: sala?.nombre,
        seat: `Fila ${selectedSeat.fila}, Columna ${selectedSeat.columna}`,
        price: 12.50
      });

      setReservationId(result.id);
      setStep('confirmation');

    } catch (error) {
      console.error('Error inesperado:', error);
      setError('Ocurrió un error inesperado. Por favor intenta nuevamente.');
    } finally {
      setLoading(prev => ({...prev, reserva: false}));
    }
  };

  if (loading.funciones) return <div className="p-4 text-center">Cargando funciones...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Reserva de Entradas</h1>

      {/* Paso 1: Selección de función y asiento */}
      {step === 'selection' && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Selecciona una función</h2>
            <select
              value={selectedFuncion?.funcion.id || ''}
              onChange={(e) => {
                const funcId = Number(e.target.value);
                const selected = funciones.find(f => f.funcion.id === funcId);
                setSelectedFuncion(selected || null);
              }}
              className="w-full p-2 border rounded-lg"
              disabled={loading.sala}
            >
              <option value="">-- Seleccione una función --</option>
              {funciones.map((item) => (
                <option key={item.funcion.id} value={item.funcion.id}>
                  {item.movie.titulo} - {new Date(item.funcion.fecha).toLocaleDateString()} {item.funcion.hora}
                </option>
              ))}
            </select>
          </div>

          {selectedFuncion && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-4">
                <img 
                  src={selectedFuncion.movie.posterImage} 
                  alt={selectedFuncion.movie.titulo}
                  className="w-24 h-32 object-cover rounded"
                />
                <div>
                  <h3 className="text-lg font-bold">{selectedFuncion.movie.titulo}</h3>
                  <p className="text-sm">
                    <strong>Fecha:</strong> {new Date(selectedFuncion.funcion.fecha).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <strong>Hora:</strong> {selectedFuncion.funcion.hora.split(':').slice(0, 2).join(':')}
                  </p>
                  {sala && (
                    <p className="text-sm">
                      <strong>Sala:</strong> {sala.nombre}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedFuncion && sala && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Selecciona tu asiento</h2>
              {loading.sala ? (
                <p>Cargando disposición de sala...</p>
              ) : (
                <>
                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <div className="grid gap-2" style={{
                      gridTemplateColumns: `repeat(${sala.columnas}, minmax(0, 1fr))`
                    }}>
                      {Array.from({length: sala.fila * sala.columnas}).map((_, index) => {
                        const fila = Math.floor(index / sala.columnas) + 1;
                        const columna = (index % sala.columnas) + 1;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedSeat({fila, columna})}
                            className={`aspect-square flex items-center justify-center rounded ${
                              selectedSeat?.fila === fila && selectedSeat?.columna === columna
                                ? 'bg-blue-600 text-white'
                                : 'bg-white hover:bg-gray-200'
                            }`}
                          >
                            {fila}-{columna}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600 mb-4">
                    Pantalla
                    <div className="w-full h-1 bg-gray-400 my-1"></div>
                  </div>
                </>
              )}
            </div>
          )}

          {selectedSeat && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
              <div className="max-w-2xl mx-auto flex justify-between items-center">
                <div>
                  <p className="font-medium">Asiento seleccionado: Fila {selectedSeat.fila}, Columna {selectedSeat.columna}</p>
                </div>
                <button
                  onClick={handlePayment}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Continuar al Pago
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Paso 2: Simulación de pago */}
      {step === 'payment' && selectedFuncion && selectedSeat && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Simulación de Pago</h2>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-4">Resumen</h3>
                <div className="space-y-2">
                  <p><strong>Película:</strong> {selectedFuncion.movie.titulo}</p>
                  <p><strong>Fecha:</strong> {new Date(selectedFuncion.funcion.fecha).toLocaleDateString()}</p>
                  <p><strong>Hora:</strong> {selectedFuncion.funcion.hora.split(':').slice(0, 2).join(':')}</p>
                  <p><strong>Sala:</strong> {sala?.nombre}</p>
                  <p><strong>Asiento:</strong> Fila {selectedSeat.fila}, Columna {selectedSeat.columna}</p>
                  <p className="mt-4 text-lg"><strong>Total:</strong> $12.50</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Método de Pago</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Seleccione método</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="credit">Tarjeta de Crédito</option>
                      <option value="debit">Tarjeta de Débito</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>

                  {paymentMethod === 'credit' || paymentMethod === 'debit' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Número de Tarjeta</label>
                        <input 
                          type="text" 
                          placeholder="1234 5678 9012 3456" 
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Fecha Exp.</label>
                          <input 
                            type="text" 
                            placeholder="MM/AA" 
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">CVV</label>
                          <input 
                            type="text" 
                            placeholder="123" 
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800">
                      Serás redirigido a PayPal para completar el pago
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep('selection')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={handleReservation}
                disabled={loading.reserva}
                className={`bg-green-600 text-white px-6 py-2 rounded-lg ${
                  loading.reserva ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'
                }`}
              >
                {loading.reserva ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paso 3: Confirmación con QR */}
      {step === 'confirmation' && reservationDetails && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">¡Reserva confirmada!</h2>
          <p className="mb-6">Tu entrada ha sido reservada exitosamente. Presenta este código QR en taquilla:</p>
          
          <div className="mx-auto w-max p-4 bg-white rounded-lg shadow-lg mb-6">
            <div className="p-2 bg-white">
              <QRCode 
                value={reservationDetails.id} 
                size={180}
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto mb-6 text-left">
            <h3 className="font-bold mb-2">Detalles de la reserva:</h3>
            <p><strong>Película:</strong> {reservationDetails.movie}</p>
            <p><strong>Fecha:</strong> {reservationDetails.date}</p>
            <p><strong>Hora:</strong> {reservationDetails.time}</p>
            <p><strong>Sala:</strong> {reservationDetails.sala}</p>
            <p><strong>Asiento:</strong> {reservationDetails.seat}</p>
            <p><strong>Total pagado:</strong> ${reservationDetails.price.toFixed(2)}</p>
            <p><strong>Código de reserva:</strong> {reservationDetails.id}</p>
          </div>

          <button
            onClick={() => {
              setStep('selection');
              setSelectedFuncion(null);
              setSelectedSeat(null);
              setReservationDetails(null);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Hacer nueva reserva
          </button>
        </div>
      )}
    </div>
  );
}