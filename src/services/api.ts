/**
 * src/services/api.ts
 * Servicio API para interactuar con el backend Hono.
 */
// Jeremy S: Revisión de servicios API y verificación de endpoints. Aporte: Jeremy Sanhueza.

import { NewTaskData, Task } from "../types/todolist";

// Asegurar que usamos la variable de entorno correctamente
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, ""); // Eliminar slash final si existe

if (!API_URL) {
  console.error("CRITICAL: Falta EXPO_PUBLIC_API_URL en el archivo .env");
}

// Servicio API con métodos para autenticación y gestión de tareas
export const api = {
  /**
   *   para manejar respuestas y errores
   */
  async handleResponse(res: Response) {
    if (!res.ok) {
        let errorText = await res.text();
        try {
            const jsonError = JSON.parse(errorText);
            // La API puede devolver { message: ... } o { error: ... }
            const rawError = jsonError.message || jsonError.error;
            
            if (rawError) {
                if (typeof rawError === 'object') {
                    errorText = JSON.stringify(rawError);
                } else {
                    errorText = String(rawError);
                }
            }
        } catch {
            // Si falla el parseo, usar el texto plano o status
            if (errorText.includes("<!DOCTYPE html>")) {
                 errorText = `Error del servidor (${res.status})`;
            }
        }
        throw new Error(errorText || `Error ${res.status}: ${res.statusText}`);
    }
    // Si la respuesta es 204 No Content (p. ej. delete), no intentamos parsear JSON
    if (res.status === 204) return null;
    return res.json();
  },

  /**
   * Registra un nuevo usuario
   */
  async register(email: string, password: string): Promise<any> {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ email, password }),
        });
        const json = await this.handleResponse(res);
        // Si la API devuelve { success: true, data: { ... } }
        if (json.data) return json.data;
        return json;
    } catch (error: any) {
        // Relanzar con mensaje limpio
        throw new Error(error.message || "Error al registrarse");
    }
  },

  /**
   * Inicia sesión y retorna el token
   */
  async login(email: string, password: string): Promise<{ token: string }> {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ email, password }),
        });
        const json = await this.handleResponse(res);
        // Normalizar respuesta si viene anidada en 'data'
        if (json.data && json.data.token) {
            return json.data;
        }
        return json;
    } catch (error: any) {
        throw new Error(error.message || "Error al iniciar sesión");
    }
  },

  /**
   * Obtiene todas las tareas del usuario autenticado
   * autenticado mediante Bearer token
   */
  async getTodos(token: string): Promise<Task[]> { // funcion getTodos que recibe el token como un Bearer token
    try {
        const res = await fetch(`${API_URL}/todos`, {
          headers: {
            Authorization: `Bearer ${token}`,// seguridad jwt 
          },
        });
        const json = await this.handleResponse(res);
        // La API doc dice que retorna { success: true, data: [...] }
        if (json.data && Array.isArray(json.data)) {
            return json.data;
        }
        // Fallback por si retorna el array directo
        if (Array.isArray(json)) {
            return json;
        }
        return [];
    } catch (error: any) {
        console.error("GET /todos error:", error);
        throw error;
    }
  },

  /**
   * Subida de imágenes al servidor. Sube imagenes asociadas a las tareas, gestiona el tipo de archivo y retorna URL en caso de subir imagen con exito.
   */
  async uploadImage(uri: string, token: string): Promise<string> {
    try {
      const formData = new FormData(); // crear un form data para enviar la imagen
      
      // Inferir nombre y tipo
      const uriParts = uri.split('.');
      const ext = uriParts[uriParts.length - 1];
      
      // Ajuste de robustez: usar jpeg si la extensión no es clara o es muy larga (url presignada, etc)
      const fileType = (ext && ext.length < 5) ? ext : 'jpeg';
      
      const name = `photo.${fileType}`;
      const type = `image/${fileType}`;

      formData.append('image', {
        uri,
        name,
        type,
      } as any);

      const res = await fetch(`${API_URL}/images`, {  // endpoint de subida de imagenes
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            // NOTA: No agregar Content-Type aquí, fetch lo pone automáticamente con el boundary para FormData
        },
        body: formData,
      });

      const json = await this.handleResponse(res);
      
      // La respuesta esperada es { success: true, data: { url: "...", ... } }
      if (json.data && json.data.url) {
          return json.data.url;
      }
      throw new Error("No se recibió la URL de la imagen");
    } catch (error: any) {
        console.error("Upload error:", error);
        throw new Error(error.message || "Error al subir imagen");
    }
  },

  /**
   * Crea una nueva tarea (puede incluir imagen)
   */
  async createTodo(token: string, data: NewTaskData): Promise<Task> {
    // 1. Validar datos mínimos
    if (!data.title?.trim()) {
        throw new Error("El título es obligatorio");
    }

    // 2. Construir payload estricto
    const payload: any = {
        title: data.title.trim(),
    };

    // 3. Location: Objeto { latitude, longitude } (SIN stringify)
    if (data.location) {
        payload.location = {
            latitude: data.location.latitude,
            longitude: data.location.longitude
        };
    }

    // 4. Image: String URL limpia (si existe)
    // NOTA: El backend define explícitamente "photoUri" en su esquema OpenAPI
    if (data.photoUri && typeof data.photoUri === 'string') {
        payload.photoUri = data.photoUri;
    }

    try {
        const res = await fetch(`${API_URL}/todos`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
        });
        const json = await this.handleResponse(res);
        if (json.data) return json.data;
        return json;
    } catch (error: any) {
        // Mejorar mensaje de error
        throw new Error(error.message || "Error al crear tarea");
    }
  },

  /**
   * Actualiza el estado de una tarea
   */
  async updateTodo(id: string, token: string, data: { completed?: boolean; title?: string; image?: string | null; location?: any } | boolean): Promise<Task> {
    try {
        let payload: any = {};
        
        // Soporte legacy para cuando 'data' era solo 'completed' (boolean)
        if (typeof data === 'boolean') {
            payload = { completed: data };
        } else {
            // Nuevo soporte para objeto completo
            // Solo agregamos propiedades si están definidas
            if (data.title !== undefined) payload.title = data.title;
            if (data.completed !== undefined) payload.completed = data.completed;
            
            // Imagen: Si es string, enviamos. 
            if (data.image !== undefined) {
                 payload.photoUri = data.image; // API espera photoUri
            }

            // Location: igual que createTodo
            if (data.location) {
                payload.location = {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude
                };
            }
        }

        const res = await fetch(`${API_URL}/todos/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
        });
        const json = await this.handleResponse(res);
        if (json.data) return json.data;
        return json;
    } catch (error: any) {
        throw new Error(error.message || "Error al actualizar tarea");
    }
  },

  /**
   * Elimina una tarea
   */
  async deleteTodo(id: string, token: string): Promise<void> {
    try {
        const res = await fetch(`${API_URL}/todos/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        await this.handleResponse(res);
    } catch (error: any) {
         throw new Error(error.message || "Error al eliminar tarea");
    }
  }
};
