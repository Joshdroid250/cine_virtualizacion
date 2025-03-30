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
    movie: string;
    date: string; // formato YYYY-MM-DD
    time: string; // formato HH:MM:SS
    sala: number;
    userId?: number;
  }
  
  export interface ApiError {
    message: string;
    status?: number;
  }