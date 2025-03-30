// app/auth/login/page.tsx
'use client'; // ← Esto es esencial para usar hooks

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ← Cambiado a next/navigation
import { loginUser } from '@/lib/api';
import type { UserCredentials } from '@/types/types';

export default function LoginPage() {
  const [formData, setFormData] = useState<UserCredentials>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await loginUser(formData);
      
      if ('token' in result) {
        sessionStorage.setItem('authToken', result.token);
        router.push('/reservar');
      } else {
        setError(result.message || 'Error desconocido');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
    <div className="auth-container">
      <h1>Iniciar Sesión</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Tu email"
          required
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Tu contraseña"
          required
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>
      </form>
    </div>
    </div>
  );
}