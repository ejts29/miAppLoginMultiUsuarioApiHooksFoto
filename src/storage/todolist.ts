// src/storage/todo-list.ts
// Funciones para gestionar la lista de tareas

// Jeremy S: Verificación de estructura y métodos de tareas.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { NewTaskData, Task } from "../types/todolist";

const TASKS_KEY = "@myapp_tasks";


// Cargar tareas
export const loadTasks = async (): Promise<Task[]> => {
  try {
    const json = await AsyncStorage.getItem(TASKS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Error cargando tareas:", e);
    return [];
  }
};


// Crear una tarea (FOTO Y UBICACIÓN OPCIONALES)
export const createTask = async (data: NewTaskData): Promise<Task> => {
  if (!data.title.trim()) throw new Error("El título es obligatorio");

  const tasks = await loadTasks();
  const id = Date.now().toString();

  // Si NO hay foto  usamos null y no copiamos nada
  let finalPhotoUri = data.photoUri ?? null;

  // Intentar copiar foto solo si existe
  if (data.photoUri) {
    try {
      const fs: any = FileSystem;
      const baseDir: string | null =
        fs.documentDirectory ?? fs.cacheDirectory ?? null;

      if (baseDir) {
        const photoDir = `${baseDir}photos/`;
        await FileSystem.makeDirectoryAsync(photoDir, { intermediates: true });

        finalPhotoUri = `${photoDir}${id}.jpg`;

        await FileSystem.copyAsync({
          from: data.photoUri,
          to: finalPhotoUri,
        });
      } else {
        console.warn(
          "FileSystem no tiene directorios disponibles. Se usa la URI original."
        );
      }
    } catch (e) {
      console.warn("No se pudo copiar la foto. Se usa la URI original.", e);
      finalPhotoUri = data.photoUri;
    }
  }

  // Crear la nueva tarea
  const newTask: Task = {
    id,
    title: data.title.trim(),
    photoUri: finalPhotoUri ?? null,
    location: data.location ?? null,
    completed: false,
  };

  tasks.push(newTask);
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

  return newTask;
};

// Alternar estado completado

export const toggleTaskCompleted = async (id: string): Promise<void> => {
  const tasks = await loadTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return;

  tasks[index].completed = !tasks[index].completed;

  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};


// Eliminar una tarea
// Si tiene foto local, eliminarla también

export const deleteTask = async (id: string): Promise<void> => {
  let tasks = await loadTasks();
  const task = tasks.find((t) => t.id === id);

  if (task?.photoUri) {
    try {
      const fs: any = FileSystem;
      const docDir: string | null = fs.documentDirectory ?? null;
      const cacheDir: string | null = fs.cacheDirectory ?? null;

      const shouldDelete =
        (docDir && task.photoUri.startsWith(docDir)) ||
        (cacheDir && task.photoUri.startsWith(cacheDir));

      if (shouldDelete) {
        await FileSystem.deleteAsync(task.photoUri, { idempotent: true });
      }
    } catch (e) {
      console.error("Error eliminando foto:", e);
    }
  }

  tasks = tasks.filter((t) => t.id !== id);
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};
