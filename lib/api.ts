// lib/api.ts
import { UserCredentials, AuthResponse, Reservation } from '../types/types';

const API_BASE_URL = 'https://cluster.sayerdis.com';

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

export const registerUser = async (userData: UserCredentials): Promise<AuthResponse | ApiError> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    return await handleResponse<AuthResponse>(response);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Network error during registration',
      status: 500
    };
  }
};

export const loginUser = async (credentials: UserCredentials): Promise<AuthResponse | ApiError> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    return await handleResponse<AuthResponse>(response);
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