// app/index.tsx
import { Redirect } from "expo-router";

// Redirige automáticamente a la pantalla de autenticación
export default function Index() {
  return <Redirect href="/auth" />;
}