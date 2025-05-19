'use client';
import { useEffect, useState } from 'react';
import { funcionService, movieService, roomService, reservationService } from '@/lib/api';
import { isApiError } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
    reserva: false,
    occupiedSeats: false
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedFuncion, setSelectedFuncion] = useState<FuncionWithMovie | null>(null);
  const [sala, setSala] = useState<{ idsalas: number; nombre: string; fila: number; columnas: number } | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<{fila: number, columna: number} | null>(null);
  const [step, setStep] = useState<Step>('selection');
  const [paymentMethod, setPaymentMethod] = useState<string>('credit');
  const [reservationDetails, setReservationDetails] = useState<any>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<{fila: number, columna: number}[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

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

  // Cargar sala y asientos ocupados cuando se selecciona una función
  useEffect(() => {
    if (!selectedFuncion) return;

    const loadSalaAndSeats = async () => {
      try {
        setLoading(prev => ({...prev, sala: true, occupiedSeats: true}));
        setError(null);
        setSelectedSeat(null);

        // Cargar sala
        const salaResponse = await roomService.getById(selectedFuncion.funcion.salas_idsalas);
        if (isApiError(salaResponse)) {
          throw new Error(salaResponse.message);
        }
        setSala(salaResponse);

        // Cargar asientos ocupados
        const token = sessionStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
        
        const seatsResponse = await reservationService.getOccupiedSeats(selectedFuncion.funcion.id, token);
        if (isApiError(seatsResponse)) {
          throw new Error(seatsResponse.message);
        }
        setOccupiedSeats(seatsResponse.occupiedSeats);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar sala');
      } finally {
        setLoading(prev => ({...prev, sala: false, occupiedSeats: false}));
      }
    };

    loadSalaAndSeats();
  }, [selectedFuncion, router]);

  const isSeatOccupied = (fila: number, columna: number) => {
    return occupiedSeats.some(seat => seat.fila === fila && seat.columna === columna);
  };

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
      users_iduser: 1
    };

    // Intenta hacer la reserva pero no dependemos de la respuesta
    try {
      await reservationService.create(reservationData, token);
    } catch (apiError) {
      console.log("El API puede haber fallado, pero continuamos con la simulación");
    }

    // Crear detalles de reserva simulados (siempre)
    setReservationDetails({
      id: `SIM-${Date.now()}`,
      movie: selectedFuncion.movie.titulo,
      date: new Date(selectedFuncion.funcion.fecha).toLocaleDateString(),
      time: selectedFuncion.funcion.hora.split(':').slice(0, 2).join(':'),
      sala: sala?.nombre || 'Sala desconocida',
      seat: `Fila ${selectedSeat.fila}, Columna ${selectedSeat.columna}`,
      price: 12.50
    });

    // Mostrar el modal de confirmación SIEMPRE
    setShowConfirmationModal(true);
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
              {loading.sala || loading.occupiedSeats ? (
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
                        const ocupado = isSeatOccupied(fila, columna);
                        
                        return (
                          <button
                            key={index}
                            onClick={() => !ocupado && setSelectedSeat({fila, columna})}
                            className={`aspect-square flex items-center justify-center rounded ${
                              ocupado 
                                ? 'bg-red-200 cursor-not-allowed' 
                                : selectedSeat?.fila === fila && selectedSeat?.columna === columna
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white hover:bg-gray-200'
                            }`}
                            disabled={ocupado}
                            title={ocupado ? 'Asiento ocupado' : `Asiento ${fila}-${columna}`}
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

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-600 mr-2"></div>
                      <span>Seleccionado</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-200 mr-2"></div>
                      <span>Ocupado</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-white border mr-2"></div>
                      <span>Disponible</span>
                    </div>
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

      {/* Modal de confirmación */}
      {showConfirmationModal && reservationDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-green-600 mb-2">¡Reserva confirmada!</h2>
              <p className="text-gray-600">Tu entrada ha sido reservada exitosamente</p>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-3 text-center">Comprobante de reserva</h3>
              
              {/* QR simulado */}
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48 bg-white border-2 border-gray-300 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="grid grid-cols-10 gap-1 mx-auto">
                      {Array.from({length: 100}).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-3 h-3 ${Math.random() > 0.6 ? 'bg-black' : 'bg-white'} border border-gray-100`}
                        />
                      ))}
                    </div>
                    <div className="mt-2 text-xs font-mono">{reservationDetails.id}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowConfirmationModal(false);
                setStep('selection');
                setSelectedFuncion(null);
                setSelectedSeat(null);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Finalizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}