// src/types/todo-list.ts
// Definiciones de tipos para la lista de tareas

export type LocationData = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

// Tarea completa tal como se usa internamente y como se recibe de la API
export type Task = {
  id: string;
  title: string;
  photoUri?: string | null;   // Internal use
  image?: string;             // API response variant 1
  imageUrl?: string;          // API response variant 2
  location?: LocationData | null;
  completed: boolean;
};

// Datos mínimos necesarios para crear una nueva tarea
export type NewTaskData = {
  title: string;
  photoUri?: string | null;      // OPCIONAL
  location?: LocationData | null; // OPCIONAL
};

