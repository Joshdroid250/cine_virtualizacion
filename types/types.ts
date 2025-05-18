// types.ts
export interface UserCredentials {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    token: string;
  }
  
  export interface Reservation {
  id?: number;
  date: string; // formato YYYY-MM-DD
  idfuncion: number;
  fila: number;
  columna: number;
  users_iduser?: number;
}
  
  export interface ApiError {
    message: string;
    status?: number;
  }

  export interface Movie {
  idmovie: number;
  titulo: string;
  duration: string;
  description: string;
  genre: string;
  posterImage: string; // Cambiado a string para la URL
}

export interface Funcion {
  id: number;
  fecha: string;
  id_movie: number;
  hora: string;
  salas_idsalas: number;
}

export interface Room {
  idsalas: number;
  nombre: string;
  fila: number;
  columnas: number;
}
