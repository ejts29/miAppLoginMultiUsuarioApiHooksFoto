// src/storage/async.ts
// Funciones genéricas para AsyncStorage (guardar, leer, eliminar)

import AsyncStorage from "@react-native-async-storage/async-storage";

// Guardar un valor
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error("Error guardando en AsyncStorage:", error);
  }
};

// Obtener un valor
export const getItem = async (key: string): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    console.error("Error leyendo desde AsyncStorage:", error);
    return null;
  }
};

// Eliminar un valor
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Error eliminando de AsyncStorage:", error);
  }
};
