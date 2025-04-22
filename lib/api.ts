// lib/api.ts
import { UserCredentials, AuthResponse, Reservation } from '../types/types';

const API_BASE_URL = 'http://localhost:3000';

interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string>;
}

// Función de utilidad para manejar respuestas HTTP
async function handleResponse<T>(response: Response): Promise<T | ApiError> {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    return {
      message: data.message || `Request failed with status ${response.status}`,
      status: response.status,
      errors: data.errors
    };
  }

  return data as T;
}

export const registerUser = async (
  userData: {
    name: string;
    email: string;
    password: string;
    role: number;
  }
): Promise<{ message: string } | { message: string; status: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role
      }),
    });

    if (!response.ok) {
      // Manejo de errores de la API
      const errorData = await response.json();
      return {
        message: errorData.message || 'Error during registration',
        status: response.status
      };
    }

    // Respuesta exitosa
    const data: { message: string } = await response.json();
    return {
      message: data.message
    };

  } catch (error) {
    // Manejo de errores de red
    return {
      message: error instanceof Error ? error.message : 'Network error during registration',
      status: 500
    };
  }
};

export const loginUser = async (credentials: { email: string; password: string }): Promise<{ message: string; token?: string } | { message: string; status: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      }),
    });

    if (!response.ok) {
      // Si la respuesta no es exitosa, manejamos el error
      const errorData = await response.json();
      return {
        message: errorData.message || 'Error during login',
        status: response.status
      };
    }

    // Si la respuesta es exitosa, devolvemos los datos
    const data: { message: string; token: string } = await response.json();
    return {
      message: data.message,
      token: data.token
    };

  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Network error during login',
      status: 500
    };
  }
};

export const createReservation = async (
  reservationData: Omit<Reservation, 'id' | 'userId'>,
  token: string
): Promise<Reservation | ApiError> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reservationData),
    });

    return await handleResponse<Reservation>(response);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Network error during reservation creation',
      status: 500
    };
  }
};

export const getUserReservations = async (token: string): Promise<Reservation[] | ApiError> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reservations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return await handleResponse<Reservation[]>(response);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Network error fetching reservations',
      status: 500
    };
  }
};

// Función de utilidad para verificar si la respuesta es un error
export function isApiError(response: any): response is ApiError {
  return response && typeof response.message === 'string';
}