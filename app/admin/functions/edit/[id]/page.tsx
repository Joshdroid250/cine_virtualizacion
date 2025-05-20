'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { funcionService, movieService, roomService } from '@/lib/api';
import { Alert, Box, Button, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';

interface EditFunctionProps {
  params: { id: string };
}

export default function EditFunction({ params }: EditFunctionProps) {
  const router = useRouter();
  const id = parseInt(params.id, 10);

  const [form, setForm] = useState({
    fecha: '',
    hora: '',
    id_movie: '',
    salas_idsalas: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Para los combos
  const [movies, setMovies] = useState<{ idmovie: number; titulo: string }[]>([]);
  const [rooms, setRooms] = useState<{ idsalas: number; nombre: string }[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(true);

  useEffect(() => {
    if (!id) {
      setError('ID de fun no válido');
      setFetching(false);
      return;
    }
    const fetchCombos = async () => {
      setLoadingCombos(true);
      try {
        const moviesResult = await movieService.getAll();
        const roomsResult = await roomService.getAll();
        if (Array.isArray(moviesResult)) setMovies(moviesResult);
        if (Array.isArray(roomsResult)) setRooms(roomsResult);
      } catch (e) {
        setError('Error cargando películas o salas');
      } finally {
        setLoadingCombos(false);
      }
    };
    fetchCombos();
  }, []);

  useEffect(() => {
    if (!id) {
      setError('ID de función no válido');
      setFetching(false);
      return;
    }
    const fetchFunction = async () => {
      setFetching(true);
      setError(null);
      const result = await funcionService.getById(id);
      if ('message' in result && (result as any).status) {
        setError(result.message);
      } else if ('fecha' in result && 'hora' in result && 'id_movie' in result && 'salas_idsalas' in result) {
        setForm({
          fecha: result.fecha,
          hora: result.hora,
          id_movie: String(result.id_movie),
          salas_idsalas: String(result.salas_idsalas)
        });
      } else {
        setError('Respuesta inesperada del servidor');
      }
      setFetching(false);
    };
    fetchFunction();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm({ ...form, [name]: value });
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!id) return;
  setLoading(true);
  setError(null);
  setSuccess(false);

  // Validación simple
  if (!form.fecha || !form.hora || !form.id_movie || !form.salas_idsalas) {
    setError('Todos los campos son obligatorios');
    setLoading(false);
    return;
  }

  try {
    const data = {
      fecha: form.fecha,
      hora: form.hora,
      id_movie: Number(form.id_movie),
      salas_idsalas: Number(form.salas_idsalas)
    };
    const result = await funcionService.update(id, data);
    if ('message' in result && (result as any).status) {
      setError(result.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/admin/functions'), 1200);
  } catch (err: any) {
    setError(err.message || 'Error desconocido');
  } finally {
    setLoading(false);
  }
};

  if (fetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={500} mx="auto" mt={6}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={3}>Editar Función</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Fecha"
            name="fecha"
            type="date"
            value={form.fecha}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hora"
            name="hora"
            type="time"
            value={form.hora}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="movie-label">Película</InputLabel>
            <Select
              labelId="movie-label"
              name="id_movie"
              value={form.id_movie}
              label="Película"
              onChange={handleChange}
              disabled={loadingCombos}
            >
              <MenuItem value="">
                <em>Seleccione una película</em>
              </MenuItem>
              {movies.map(movie => (
                <MenuItem key={movie.idmovie} value={movie.idmovie}>
                  {movie.titulo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="room-label">Sala</InputLabel>
            <Select
              labelId="room-label"
              name="salas_idsalas"
              value={form.salas_idsalas}
              label="Sala"
              onChange={handleChange}
              disabled={loadingCombos}
            >
              <MenuItem value="">
                <em>Seleccione una sala</em>
              </MenuItem>
              {rooms.map(room => (
                <MenuItem key={room.idsalas} value={room.idsalas}>
                  {room.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Función actualizada correctamente</Alert>}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => router.push('/admin/functions')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Guardar
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}