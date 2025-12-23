// app/home/todo-list/edit/[id].tsx
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
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

// Contexto y servicios
import { useTodos } from "@/src/hooks/useTodos"; // HOOK
import { LocationData } from "@/src/types/todolist";

// Pantalla para editar una tarea existente
export default function EditTodoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Obtener ID
  const { tasks, updateTodo, isLoading } = useTodos(); // Usamos hook
  
  const [title, setTitle] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [completed, setCompleted] = useState(false);
  
  const [locLoading, setLocLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Cargar datos de la tarea desde el estado global del hook
  useEffect(() => {
    if (!id) return;
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        setTitle(task.title);
        setCompleted(task.completed);
        
        // Imagen
        const img = task.photoUri || task.image || task.imageUrl;
        if (img) setPhotoUri(img);

        // Ubicación
        if (task.location) {
           let loc = task.location;
           if (typeof loc === 'string') {
               try { loc = JSON.parse(loc); } catch {}
           }
           if (loc && loc.latitude && loc.longitude) {
               setLocationData({
                   latitude: Number(loc.latitude),
                   longitude: Number(loc.longitude),
                   timestamp: loc.timestamp || Date.now()
               });
           }
        }
        setInitialLoading(false);
    } else {
        // Si no está en tasks (recarga de página), no hacemos fetch individual
        // porque useTodos ya hace fetch al montar. Si sigue sin estar, es error.
        // Damos un pequeño margen por si tasks se está cargando
        if (!isLoading) {
             Alert.alert("Error", "Tarea no encontrada");
             router.back();
        }
    }
  }, [id, tasks, isLoading]);


  // Tomar foto (Igual que Create)
  const handlePickImage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
         Alert.alert("Permiso denegado", "Se necesita acceso a la cámara");
         return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Obtener ubicación (Igual que Create)
  const handleGetLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
         Alert.alert("Permiso denegado", "Se necesita acceso a la ubicación");
         return;
    }

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
      Alert.alert("Éxito", "Ubicación actualizada");
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "No se pudo obtener ubicación.");
    } finally {
      setLocLoading(false);
    }
  };

  // Guardar cambios vía Hook
  const handleUpdate = async () => {
    if (!title.trim()) return Alert.alert("Error", "El título es obligatorio");

    // El hook se encarga de subir la imagen SI es local (empieza con file:)
    // Si sigue siendo http..., el hook la ignora o la manda igual (el backend deberia aceptarla o hook filtrarla)
    // Mi implementación de useTodos hace: if (image) payload.image = image.
    // Y sube si startsWith('file:'). Perfecto.
    
    const success = await updateTodo(id as string, {
        title: title.trim(),
        completed,
        image: photoUri,
        location: locationData ? {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timestamp: locationData.timestamp
        } : undefined
    });

    if (success) {
        Alert.alert("Éxito", "Tarea actualizada correctamente");
        router.back();
    }
  };

  if (initialLoading && isLoading) {
      return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }
  // Renderizar formulario de edición
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Editar Tarea</Text>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />

      {/* FOTO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📷 Foto</Text>
        {photoUri ? (
          <Image 
            source={{ uri: photoUri }} 
            style={styles.imagePreview} 
            resizeMode="cover" 
          />
        ) : (
          <Text style={styles.placeholder}>Sin foto</Text>
        )}
        <Button title={photoUri ? "Cambiar Foto" : "Agregar Foto"} onPress={handlePickImage} />
      </View>

      {/* UBICACIÓN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Ubicación</Text>
        {locationData ? (
          <Text style={{ marginBottom: 10 }}>
            Lat: {locationData.latitude.toFixed(4)}, Lon: {locationData.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.placeholder}>Sin ubicación</Text>
        )}
        <Button
          title="Actualizar Ubicación"
          onPress={handleGetLocation}
          disabled={locLoading || isLoading}
        />
        {locLoading && <ActivityIndicator style={{ marginTop: 10 }} />}
      </View>

      {/* GUARDAR */}
      <View style={{ marginTop: 30, marginBottom: 50 }}>
        <Button
            title={isLoading ? "Guardando..." : "Guardar Cambios"}
            onPress={handleUpdate}
            disabled={isLoading || locLoading}
        />
        <View style={{ marginTop: 10 }}>
            <Button
                title="Cancelar"
                color="red"
                onPress={() => router.back()}
                disabled={isLoading}
            />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 26, fontWeight: "bold", marginVertical: 20, textAlign: "center" },
  section: { marginVertical: 15 },
  sectionTitle: { fontSize: 18, marginBottom: 10, fontWeight: '600' },
  imagePreview: { width: "100%", height: 250, marginVertical: 10, borderRadius: 10, backgroundColor: '#eee' },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 10 },
  label: { fontWeight: "bold", marginBottom: 5 },
  placeholder: { color: "#888", marginBottom: 10, fontStyle: 'italic' },
});
