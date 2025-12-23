// app/home/todo-list/create.tsx
// Pantalla para crear una nueva tarea
import * as ImagePicker from "expo-image-picker"; // librería para manejo de imágenes
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
// Tipos de datos

//  relacionados con la ubicación
import { useTodos } from "@/src/hooks/useTodos"; // HOOK 
import { LocationData } from "@/src/types/todolist";

// Pantalla para crear una nueva tarea
export default function CreateTodoScreen() {
  const router = useRouter();
  const { createTodo, isLoading } = useTodos(); // Usamos el hook
  
  const [title, setTitle] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  // Solicitar permisos al montar el componente
  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  //  Tomar foto
  const handlePickImage = async () => {
    // acceso a api nativa de la camara
    const result = await ImagePicker.launchCameraAsync({ //esto abre la camara del dispositivo 
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      // se guarda la ruta nativa de la imagen
      setPhotoUri(result.assets[0].uri);
    }
  };

  //  Obtener ubicación
  const handleGetLocation = async () => {
    setLocLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocationData({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      });
      Alert.alert("Éxito", "Ubicación registrada");
    } catch (error) {
      console.error("Error al obtener la ubicación:", error);
      Alert.alert("Error", "No se pudo obtener ubicación. Verifica GPS.");
    } finally {
      setLocLoading(false);
    }
  };

// Guardar tarea vía Hook
const handleSaveTask = async () => {
  if (!title.trim()) {
    return Alert.alert("Error", "El título es obligatorio");
  }

  // Llamamos al hook que encapsula la logica (subida de imagen + creación)
  const success = await createTodo({
      title: title.trim(),
      photoUri,
      location: locationData ? {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: locationData.timestamp
      } : undefined,
  });

  if (success) {
      Alert.alert("Éxito", "Tarea creada");
      if (router.canGoBack()) {
          router.back();
      } else {
          router.replace("/home/todo-list");
      }
  }
};

// Renderizado de la pantalla de creación de tarea
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Crear Nueva Tarea</Text>

      <TextInput
        style={styles.input}
        placeholder="Título de la tarea *(obligatorio)"
        value={title}
        onChangeText={setTitle}
      />

      {/* FOTO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📷 Foto (Opcional)</Text>
        {photoUri ? (
          <Image 
            source={{ uri: photoUri }} 
            style={styles.imagePreview} 
            resizeMode="cover" 
          />
        ) : (
          <Text style={styles.placeholder}>No hay foto</Text>
        )}
        <Button title="Tomar Foto" onPress={handlePickImage} />
      </View>

      {/* UBICACIÓN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Ubicación (Opcional)</Text>
        {locationData ? (
          <Text>
            Lat: {locationData.latitude.toFixed(4)}{"\n"}
            Long: {locationData.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.placeholder}>No hay ubicación</Text>
        )}

        {/* Botón para obtener ubicación */}
        <Button
          title={locLoading ? "Obteniendo..." : "Obtener Ubicación Actual"}
          onPress={handleGetLocation}
          disabled={locLoading || isLoading}
        />

        {locLoading && <ActivityIndicator style={{ marginTop: 10 }} />}
      </View>

      {/* GUARDAR */}
      <View style={{ marginTop: 20, marginBottom: 50 }}>
        <Button
            title={isLoading ? "Guardando..." : "Guardar Tarea"}
            onPress={handleSaveTask}
            disabled={isLoading || locLoading}
        />
      </View>
    </ScrollView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },
  section: { marginVertical: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 10, fontWeight: '600' },
  imagePreview: {
    width: "100%",
    height: 300,
    marginVertical: 10,
    borderRadius: 10,

  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16
  },
  placeholder: { color: "#888", marginBottom: 10 },
});
