// app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

// Componente que maneja la navegación basada en el estado de autenticación
function RootLayoutNav() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Efecto para redirigir según el estado de autenticación
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    
    if (!token && !inAuthGroup) {
      // Si no hay token y no estamos en auth, enviar a login
      router.replace("/auth");
    } else if (token && inAuthGroup) {
      // Si hay token y estamos en auth, enviar a home
      router.replace("/home");
    }
  }, [token, segments, isLoading]);

  // Mostrar indicador de carga mientras se verifica el estado de autenticación
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Configuración de la pila de navegación
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#3B82F6" },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
            title: "Cargando...",
            headerShown: false
        }} 
      />
      <Stack.Screen
        name="auth/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="home"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

// Layout raíz que envuelve la aplicación con el proveedor de autenticación
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}