'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { roomService } from '@/lib/api';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';

export default function EditRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const id = idParam ? parseInt(idParam, 10) : null;

  const [form, setForm] = useState({
    nombre: '',
    fila: '',
    columnas: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID de sala no válido');
      setFetching(false);
      return;
    }
    const fetchRoom = async () => {
      setFetching(true);
      setError(null);
      const result = await roomService.getById(id);
      if ('message' in result && (result as any).status) {
        setError(result.message);
      } else {
        setForm({
          nombre: result.nombre,
          fila: String(result.fila),
          columnas: String(result.columnas)
        });
      }
      setFetching(false);
    };
    fetchRoom();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData = {
        nombre: form.nombre,
        fila: Number(form.fila),
        columnas: Number(form.columnas)
      };
      const result = await roomService.update(id, updateData);
      if ('message' in result && (result as any).status) {
        setError(result.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/admin/rooms'), 1200);
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
        <Typography variant="h5" mb={3}>Editar Sala</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Filas"
            name="fila"
            value={form.fila}
            onChange={handleChange}
            type="number"
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Columnas"
            name="columnas"
            value={form.columnas}
            onChange={handleChange}
            type="number"
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Sala actualizada correctamente</Alert>}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => router.push('/admin/rooms')}
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