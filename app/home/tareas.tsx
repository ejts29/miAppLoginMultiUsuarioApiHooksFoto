// app/home/tareas.tsx
// Redirige a la pantalla de lista de tareas

import { Redirect } from "expo-router";

// Componente de redirección a la lista de tareas
export default function TareasRedirect() {
  return <Redirect href="/home/todo-list" />;
}
