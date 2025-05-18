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
  const [reservationSuccess, setReservationSuccess] = useState(false);

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

      const fecha = selectedFuncion.funcion.fecha.split('T')[0]; // Formato YYYY-MM-DD

      const reservationData = {
        date: fecha,
        idfuncion: selectedFuncion.funcion.id,
        fila: selectedSeat.fila,
        columna: selectedSeat.columna,
        users_iduser: 1 // Esto debería venir del usuario logueado
      };

      const result = await reservationService.create(reservationData, token);
      if (isApiError(result)) {
        throw new Error(result.message);
      }

      setReservationSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear reserva');
    } finally {
      setLoading(prev => ({...prev, reserva: false}));
    }
  };

  if (loading.funciones) return <div className="p-4 text-center">Cargando funciones...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  if (reservationSuccess) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">¡Reserva exitosa!</h2>
        <p className="mb-4">Tu asiento ha sido reservado correctamente.</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Hacer otra reserva
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Reserva de Entradas</h1>

      {/* Selección de función */}
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

      {/* Detalles de la función seleccionada */}
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

      {/* Selección de asientos */}
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

      {/* Botón de reserva */}
      {selectedSeat && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div>
              <p className="font-medium">Asiento seleccionado: Fila {selectedSeat.fila}, Columna {selectedSeat.columna}</p>
            </div>
            <button
              onClick={handleReservation}
              disabled={loading.reserva}
              className={`bg-green-600 text-white px-6 py-2 rounded-lg ${
                loading.reserva ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
            >
              {loading.reserva ? 'Procesando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}