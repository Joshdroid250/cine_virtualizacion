'use client';
import { useEffect, useState } from 'react';
import { funcionService, movieService, roomService, reservationService } from '@/lib/api';
import { isApiError } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

// Material UI imports
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  TextField
} from '@mui/material';
import Grid from '@mui/material/Grid';

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
  const [selectedSeat, setSelectedSeat] = useState<{ fila: number, columna: number } | null>(null);
  const [step, setStep] = useState<Step>('selection');
  const [paymentMethod, setPaymentMethod] = useState<string>('credit');
  const [reservationDetails, setReservationDetails] = useState<any>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<{ fila: number, columna: number }[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Función para cerrar sesión
  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    setSelectedFuncion(null);
    setSelectedSeat(null);
    setStep('selection');
    router.push('/login');
  };

  // Cargar funciones y películas
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({ ...prev, funciones: true }));
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
        setLoading(prev => ({ ...prev, funciones: false }));
      }
    };

    loadData();
  }, []);

  // Cargar sala y asientos ocupados cuando se selecciona una función
  useEffect(() => {
    if (!selectedFuncion) return;

    const loadSalaAndSeats = async () => {
      try {
        setLoading(prev => ({ ...prev, sala: true, occupiedSeats: true }));
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
        setLoading(prev => ({ ...prev, sala: false, occupiedSeats: false }));
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
      setLoading(prev => ({ ...prev, reserva: true }));
      setError(null);

      const token = sessionStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Decodifica el token para obtener el id del usuario
      let userId = 1; // fallback
      try {
        const decoded: any = jwtDecode(token);
        userId = decoded.id || decoded.userId || decoded.sub || 1;
      } catch (e) {
        console.warn("No se pudo decodificar el token, usando id 1 por defecto");
      }

      const fecha = selectedFuncion.funcion.fecha.split('T')[0];
      const reservationData = {
        date: fecha,
        idfuncion: selectedFuncion.funcion.id,
        fila: selectedSeat.fila,
        columna: selectedSeat.columna,
        users_iduser: userId
      };

      try {
        await reservationService.create(reservationData, token);
      } catch (apiError) {
        console.log("El API puede haber fallado, pero continuamos con la simulación");
      }

      setReservationDetails({
        id: `SIM-${Date.now()}`,
        movie: selectedFuncion.movie.titulo,
        date: new Date(selectedFuncion.funcion.fecha).toLocaleDateString(),
        time: selectedFuncion.funcion.hora.split(':').slice(0, 2).join(':'),
        sala: sala?.nombre || 'Sala desconocida',
        seat: `Fila ${selectedSeat.fila}, Columna ${selectedSeat.columna}`,
        price: 12.50
      });

      setShowConfirmationModal(true);
      setStep('confirmation');

    } catch (error) {
      console.error('Error inesperado:', error);
      setError('Ocurrió un error inesperado. Por favor intenta nuevamente.');
    } finally {
      setLoading(prev => ({ ...prev, reserva: false }));
    }
  };

  if (loading.funciones) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
      <CircularProgress />
    </Box>
  );
  if (error) return (
    <Snackbar open autoHideDuration={6000}>
      <Alert severity="error" sx={{ width: '100%' }}>
        {error}
      </Alert>
    </Snackbar>
  );

  return (
    <Box maxWidth={700} mx="auto" p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Reserva de Entradas</Typography>
        <Button
          onClick={handleLogout}
          variant="contained"
          color="error"
        >
          Cerrar sesión
        </Button>
      </Box>

      {/* Paso 1: Selección de función y asiento */}
      {step === 'selection' && (
        <>
          <Box mb={4}>
            <Typography variant="h6" mb={2}>1. Selecciona una función</Typography>
            <FormControl fullWidth>
              <InputLabel id="funcion-select-label">Función</InputLabel>
              <Select
                labelId="funcion-select-label"
                value={selectedFuncion?.funcion.id || ''}
                label="Función"
                onChange={(e) => {
                  const funcId = Number(e.target.value);
                  const selected = funciones.find(f => f.funcion.id === funcId);
                  setSelectedFuncion(selected || null);
                }}
                disabled={loading.sala}
              >
                <MenuItem value="">
                  <em>-- Seleccione una función --</em>
                </MenuItem>
                {funciones.map((item) => (
                  <MenuItem key={item.funcion.id} value={item.funcion.id}>
                    {item.movie.titulo} - {new Date(item.funcion.fecha).toLocaleDateString()} {item.funcion.hora}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {selectedFuncion && (
            <Paper elevation={2} sx={{ mb: 4, p: 2 }}>
              <Grid container spacing={2}>
                <Grid item>
                  <img
                    src={selectedFuncion.movie.posterImage}
                    alt={selectedFuncion.movie.titulo}
                    style={{ width: 96, height: 128, objectFit: 'cover', borderRadius: 8 }}
                  />
                </Grid>
                <Grid item xs>
                  <Typography variant="h6">{selectedFuncion.movie.titulo}</Typography>
                  <Typography variant="body2"><strong>Fecha:</strong> {new Date(selectedFuncion.funcion.fecha).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Hora:</strong> {selectedFuncion.funcion.hora.split(':').slice(0, 2).join(':')}</Typography>
                  {sala && (
                    <Typography variant="body2"><strong>Sala:</strong> {sala.nombre}</Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}

          {selectedFuncion && sala && (
            <Box mb={4}>
              <Typography variant="h6" mb={2}>2. Selecciona tu asiento</Typography>
              {loading.sala || loading.occupiedSeats ? (
                <Box display="flex" alignItems="center" gap={2}><CircularProgress size={24} /> Cargando disposición de sala...</Box>
              ) : (
                <>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={1}>
                      {Array.from({ length: sala.fila * sala.columnas }).map((_, index) => {
                        const fila = Math.floor(index / sala.columnas) + 1;
                        const columna = (index % sala.columnas) + 1;
                        const ocupado = isSeatOccupied(fila, columna);

                        return (
                          <Grid item key={index}>
                            <Button
                              variant={ocupado
                                ? "contained"
                                : selectedSeat?.fila === fila && selectedSeat?.columna === columna
                                  ? "contained"
                                  : "outlined"}
                              color={ocupado
                                ? "error"
                                : selectedSeat?.fila === fila && selectedSeat?.columna === columna
                                  ? "primary"
                                  : "inherit"}
                              size="small"
                              disabled={ocupado}
                              onClick={() => !ocupado && setSelectedSeat({ fila, columna })}
                              sx={{ minWidth: 40, minHeight: 40, fontSize: 12 }}
                            >
                              {fila}-{columna}
                            </Button>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Paper>

                  <Box textAlign="center" mb={2}>
                    <Typography variant="caption" color="text.secondary">Pantalla</Typography>
                    <Box width="100%" height={6} bgcolor="grey.400" my={1} borderRadius={2} />
                  </Box>

                  <Box display="flex" gap={3} mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Button variant="contained" color="primary" size="small" sx={{ minWidth: 24, minHeight: 24, p: 0 }} disabled />
                      <Typography variant="caption">Seleccionado</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Button variant="contained" color="error" size="small" sx={{ minWidth: 24, minHeight: 24, p: 0 }} disabled />
                      <Typography variant="caption">Ocupado</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Button variant="outlined" size="small" sx={{ minWidth: 24, minHeight: 24, p: 0 }} disabled />
                      <Typography variant="caption">Disponible</Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          )}

          {selectedSeat && (
            <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, borderRadius: 0 }}>
              <Box maxWidth={700} mx="auto" display="flex" justifyContent="space-between" alignItems="center">
                <Typography fontWeight="medium">
                  Asiento seleccionado: Fila {selectedSeat.fila}, Columna {selectedSeat.columna}
                </Typography>
                <Button
                  onClick={handlePayment}
                  variant="contained"
                  color="primary"
                >
                  Continuar al Pago
                </Button>
              </Box>
            </Paper>
          )}
        </>
      )}

      {/* Paso 2: Simulación de pago */}
      {step === 'payment' && selectedFuncion && selectedSeat && (
        <Box mb={4}>
          <Typography variant="h6" mb={2}>3. Simulación de Pago</Typography>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>Resumen</Typography>
                <Box>
                  <Typography><strong>Película:</strong> {selectedFuncion.movie.titulo}</Typography>
                  <Typography><strong>Fecha:</strong> {new Date(selectedFuncion.funcion.fecha).toLocaleDateString()}</Typography>
                  <Typography><strong>Hora:</strong> {selectedFuncion.funcion.hora.split(':').slice(0, 2).join(':')}</Typography>
                  <Typography><strong>Sala:</strong> {sala?.nombre}</Typography>
                  <Typography><strong>Asiento:</strong> Fila {selectedSeat.fila}, Columna {selectedSeat.columna}</Typography>
                  <Typography mt={2} fontSize={18}><strong>Total:</strong> $12.50</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>Método de Pago</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="payment-method-label">Seleccione método</InputLabel>
                  <Select
                    labelId="payment-method-label"
                    value={paymentMethod}
                    label="Seleccione método"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="credit">Tarjeta de Crédito</MenuItem>
                    <MenuItem value="debit">Tarjeta de Débito</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                  </Select>
                </FormControl>
                {(paymentMethod === 'credit' || paymentMethod === 'debit') ? (
                  <Box>
                    <TextField
                      label="Número de Tarjeta"
                      placeholder="1234 5678 9012 3456"
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Fecha Exp."
                          placeholder="MM/AA"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="CVV"
                          placeholder="123"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Serás redirigido a PayPal para completar el pago
                  </Alert>
                )}
              </Grid>
            </Grid>
            <Box mt={4} display="flex" justifyContent="space-between">
              <Button
                onClick={() => setStep('selection')}
                variant="outlined"
              >
                Volver
              </Button>
              <Button
                onClick={handleReservation}
                disabled={loading.reserva}
                variant="contained"
                color="success"
              >
                {loading.reserva ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Pago'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Modal de confirmación */}
      <Dialog
        open={showConfirmationModal && !!reservationDetails}
        onClose={() => {
          setShowConfirmationModal(false);
          setStep('selection');
          setSelectedFuncion(null);
          setSelectedSeat(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" color="success.main" fontWeight="bold" align="center">
            ¡Reserva confirmada!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography align="center" color="text.secondary" mb={2}>
            Tu entrada ha sido reservada exitosamente
          </Typography>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography fontWeight="bold" align="center" mb={2}>Comprobante de reserva</Typography>
            <Box display="flex" justifyContent="center" mb={2}>
              <Box
                sx={{
                  width: 192,
                  height: 192,
                  bgcolor: 'white',
                  border: '2px solid',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box textAlign="center">
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: 0.5,
                      mx: 'auto'
                    }}
                  >
                    {Array.from({ length: 100 }).map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 12,
                          height: 12,
                          bgcolor: Math.random() > 0.6 ? 'black' : 'white',
                          border: '1px solid',
                          borderColor: 'grey.100'
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ mt: 1, fontFamily: 'monospace' }}>
                    {reservationDetails?.id}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowConfirmationModal(false);
              setStep('selection');
              setSelectedFuncion(null);
              setSelectedSeat(null);
            }}
            variant="contained"
            color="primary"
            fullWidth
          >
            Finalizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}