// app/auth/register/page.tsx
'use client'; // Necesario para usar hooks

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Usar next/navigation en lugar de next/router
import { registerUser } from '@/lib/api';
import type { UserCredentials } from '@/types/types';

export default function RegisterPage() {
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
      const result = await registerUser(formData);
      
      if ('token' in result) {
        // Redirigir a login después del registro exitoso
        router.push('/auth/login');
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {loading ? 'Procesando...' : 'Crear cuenta'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Ya tienes una cuenta?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Iniciar sesion
          </a>
        </p>
      </div>
    </div>
  );
}