// lib/api.ts
import { UserCredentials, AuthResponse, Reservation, Funcion, Movie, Room } from '../types/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string>;
}

interface OccupiedSeatsResponse {
  occupiedSeats: { fila: number; columna: number }[];
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

// lib/api.ts (modificaciones clave)

export const createReservation = async (
  reservationData: Omit<Reservation, 'id' | 'userId'>,
  token?: string  // Hacer el token opcional para manejar casos donde no exista
): Promise<Reservation | ApiError> => {
  try {
    // Obtener el token de sessionStorage si no se proporcionó
    const authToken = token || sessionStorage.getItem('authToken');
    
    if (!authToken) {
      return {
        message: 'No se encontró token de autenticación',
        status: 401
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`  // Usar el token obtenido
      },
      body: JSON.stringify(reservationData),
    });

    // Manejo específico de errores de autenticación
    if (response.status === 403) {
      // Limpiar el token inválido
      sessionStorage.removeItem('authToken');
      return {
        message: 'Sesión expirada o token inválido. Por favor inicie sesión nuevamente.',
        status: 403
      };
    }

    return await handleResponse<Reservation>(response);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Error de conexión al crear reserva',
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


export const movieService = {
  getById: async (id: number): Promise<Movie | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/movies/${id}`);
      return await handleResponse<Movie>(response);
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error al cargar película',
        status: 500
      };
    }
  },

  getAll: async (): Promise<Movie[] | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/movies`);
      return await handleResponse<Movie[]>(response);
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error al cargar películas',
        status: 500
      };
    }
  },
  create: async (movieData: Omit<Movie, 'idmovie'>): Promise<Movie | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/movies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify(movieData)
      });
      return await handleResponse<Movie>(response);
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error al crear película',
        status: 500
      };
    }
  },
  update: async (id: number, movieData: Partial<Movie>): Promise<Movie | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/movies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData)
      });
      return await handleResponse<Movie>(response);
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error al actualizar película',
        status: 500
      };
    }
  },
  delete: async (id: number, token: string): Promise<{ message: string } | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/movies/${id}`, {
        method: 'DELETE',
        headers: {
          
        }
      });
      return await handleResponse<{ message: string }>(response);
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error al eliminar película',
        status: 500
      };
    }
  }
};

export const funcionService = {
  getAll: async (): Promise<Funcion[] | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/funcion`);
      return await handleResponse<Funcion[]>(response);
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error al cargar funciones',
        status: 500
      };
    }
  }
};


export const roomService = {
  getById: async (id: number): Promise<Room | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${id}`);
      return await handleResponse<Room>(response);
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error al cargar sala',
        status: 500
      };
    }
  }, 

  getAll: async (): Promise<Room[] | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`);
      return await handleResponse<Room[]>(response);
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Error al cargar rooms',
        status: 500
      };
    }
  }
};

export const reservationService = {
  create: async (reservationData: Omit<Reservation, 'id'>, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reservationData)
      });

      if (!response.ok) {
        // Obtener el mensaje de error del servidor
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errorData);
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en reservationService:', error);
      throw error; // Re-lanzar para manejo en el componente
    }
  },

  getOccupiedSeats: async (idFuncion: number, token: string): Promise<OccupiedSeatsResponse | ApiError> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations/occupied-seats/${idFuncion}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getOccupiedSeats:', error);
      throw error;
    }
  }


  
};