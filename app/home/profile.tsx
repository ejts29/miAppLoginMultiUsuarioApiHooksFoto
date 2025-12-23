// app/home/profile.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { getItem } from "../../src/storage/async";

// Pantalla de perfil de usuario 
export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [user, setUser] = useState<string | null>(null);

  // Cargar el correo del usuario al montar el componente
  useEffect(() => {
    (async () => {
      const storedUser = await getItem("userEmail");
      if (storedUser) {
        setUser(storedUser);
      }
    })();
  }, []);

  // Renderizado de la pantalla de perfil 
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>

      <Text style={styles.info}>Usuario: {user || "Cargando..."}</Text>

      <Button 
        title="Cerrar Sesión" 
        onPress={signOut} 
        color="#ef4444" 
      />
    </View>
  );
}

// Estilos para la pantalla de perfil
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#3B82F6",
  },
  info: {
    fontSize: 20,
    marginBottom: 40,
    color: "gray",
  },
});
