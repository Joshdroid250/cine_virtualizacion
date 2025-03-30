// lib/api.ts
import { UserCredentials, AuthResponse, Reservation, ApiError } from '../types/types';

const API_BASE_URL = 'https://cluster.sayerdis.com';

export const registerUser = async (userData: UserCredentials): Promise<AuthResponse | ApiError> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error: ApiError = {
        message: `Registration failed with status ${response.status}`,
        status: response.status
      };
      return error;
    }

    return await response.json() as AuthResponse;
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Unknown error during registration'
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

    if (!response.ok) {
      const error: ApiError = {
        message: `Login failed with status ${response.status}`,
        status: response.status
      };
      return error;
    }

    return await response.json() as AuthResponse;
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Unknown error during login'
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

    if (!response.ok) {
      const error: ApiError = {
        message: `Reservation creation failed with status ${response.status}`,
        status: response.status
      };
      return error;
    }

    return await response.json() as Reservation;
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Unknown error during reservation creation'
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

    if (!response.ok) {
      return {
        message: `Error al obtener reservas: ${response.status}`,
        status: response.status
      };
    }

    return await response.json() as Reservation[];
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};