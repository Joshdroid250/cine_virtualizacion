'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { movieService } from '@/lib/api';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';

export default function CreateMovie() {
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: '',
    duration: '',
    description: '',
    genre: '',
    posterImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await movieService.create(form);
      if ('message' in result && (result as any).status) {
        setError(result.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/admin/movies'), 1200);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={500} mx="auto" mt={6}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" mb={3}>Crear Nueva Película</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Título"
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Duración (minutos)"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            type="number"
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Descripción"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Género"
            name="genre"
            value={form.genre}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="URL de Poster"
            name="posterImage"
            value={form.posterImage}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Película creada correctamente</Alert>}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => router.push('/admin/movies')}
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
              Crear
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}