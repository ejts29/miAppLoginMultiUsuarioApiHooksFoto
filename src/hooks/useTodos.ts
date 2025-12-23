import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { NewTaskData, Task } from "../types/todolist";

export function useTodos() {
  const { token, signOut } = useAuth();
  // esto es el estado local de las tareas
  const [tasks, setTasks] = useState<Task[]>([]); // arreglo de tareas task variable y setTasks para actualizarlo 
  const [isLoading, setIsLoading] = useState(false); // estado de carga
  const [error, setError] = useState<string | null>(null); // estado de error

  // Cargar tareas
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTodos(token);
      setTasks(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar tareas");
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("401") || msg.includes("unauthorized")) {
        signOut();
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, signOut]);

  // Ejecutar fetch al montar si hay token
  useEffect(() => {
    if (token) {
        fetchTasks();
    }
  }, [token, fetchTasks]);

  // Crear tarea (maneja subida de imagen)
  const createTodo = async (data: { title: string; photoUri?: string | null; location?: any }) => {
    if (!token) return false;
    setIsLoading(true);
    try {
        let finalImage = data.photoUri;
        // Si hay foto y NO es remota (no empieza con http), intentar subirla
        if (finalImage && !finalImage.startsWith('http')) {
             // Soporte para file:// y content://
             finalImage = await api.uploadImage(finalImage, token);
        }

        const newTaskData: NewTaskData = {
            title: data.title,
            photoUri: finalImage, // Enviamos la URL remota (si se subió) o lo que había
            location: data.location
        };

        const created = await api.createTodo(token, newTaskData);// llamamos a la api para crear la tarea
        setTasks(prev => [created, ...prev]);
        return true;
    } catch (err: any) {
        Alert.alert("Error", err.message || "No se pudo crear la tarea");
        return false;
    } finally {
        setIsLoading(false);
    }
  };

  // Actualizar tarea
  const updateTodo = async (id: string, updates: { title?: string; completed?: boolean; image?: string | null; location?: any }) => {
    if (!token) return false;
    // Si solo estamos haciendo toggle de completed, actualizamos ya
    if (updates.completed !== undefined) {
         setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: updates.completed! } : t));
    }

    // Si NO es solo un toggle de completed, mostramos loading (ej: editar foto)
    const isHeavyUpdate = updates.title !== undefined || updates.image !== undefined;
    if (isHeavyUpdate) setIsLoading(true);

    try {
        let finalImage = updates.image;
        
        // Si la imagen cambió y no es remota, subirla
        if (finalImage && !finalImage.startsWith('http')) {
             finalImage = await api.uploadImage(finalImage, token);
        }

        // Preparamos payload
        const payload = {
            ...updates,
            image: finalImage
        };

        const updatedTask = await api.updateTodo(id, token, payload);
        
        // Actualizar estado local con la respuesta real
        // FIX: Preservar la imagen existente si no la estamos modificando y el backend no la devuelve (defensivo)
        setTasks(prev => prev.map(t => {
            if (t.id !== id) return t;

            const weTouchedImage = updates.image !== undefined;
            const backendHasImage = updatedTask.photoUri || updatedTask.image || updatedTask.imageUrl;

            // Si nosotros NO enviamos cambio de imagen, y el backend nos devuelve algo sin imagen...
            // asuminos que el backend no devolvió el campo y mantenemos la local.
            if (!weTouchedImage && !backendHasImage) {
                 return { ...updatedTask, photoUri: t.photoUri || t.image || t.imageUrl };
            }

            return updatedTask;
        }));
        return true;

    } catch (err: any) {
        console.error(err);
        Alert.alert("Error", err.message || "No se pudo actualizar la tarea");
        // Revertir en caso de error si fue optimista
        if (updates.completed !== undefined) {
             setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !updates.completed } : t));
        }
        return false;
    } finally {
        if (isHeavyUpdate) setIsLoading(false);
    }
  };

  // Eliminar tarea
  const deleteTodo = async (id: string) => {
      if (!token) return;
      // Optimistic delete
      const prevTasks = [...tasks];
      setTasks(prev => prev.filter(t => t.id !== id));

      try {
          await api.deleteTodo(id, token);
      } catch (err: any) {
          Alert.alert("Error", "No se pudo eliminar la tarea");
          setTasks(prevTasks); // Revertir
      }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
      await updateTodo(id, { completed: !currentStatus });
  };

  return {
      tasks,
      isLoading,
      error,
      fetchTasks, // Para RefreshControl
      createTodo,
      updateTodo,
      deleteTodo,
      toggleTodo
  };
}
