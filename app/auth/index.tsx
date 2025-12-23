// app/auth/index.tsx
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";

// Importa el logo desde los assets
const logoSource = require("@assets/images/logo.png");

// Validación simple de email (formato usuario@dominio.com)
const isValidEmail = (email: string) => {
  return /\S+@\S+\.\S+/.test(email);
};

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  
  // estado para el formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // estado para el modo (Iniciar sesión vs Registrarse)
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    // VALIDACIÓN DE EMAIL 
    if (!isValidEmail(email)) {
      Alert.alert(
        "Correo inválido",
        "Debe ser un correo válido, por ejemplo: usuario@dominio.com"
      );
      return;
    }

    // VALIDACIÓN DE CONTRASEÑA 
    if (password.trim().length < 6) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    setLoading(true);
    try {
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim(); 

      if (isLogin) {
        await signIn(emailTrimmed, passwordTrimmed);
      } else {
        await signUp(emailTrimmed, passwordTrimmed);
      }
    } catch (error: any) {
      console.log("Auth Error:", error);
      const msg = error.message || (typeof error === 'string' ? error : "Ocurrió un error desconocido");
      Alert.alert("Error de Autenticación", msg);
    } finally {
      setLoading(false);
    }
  };

  // Renderiza la pantalla de autenticación
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mi App Login Multi-Usuario</Text>
      <Image source={logoSource} style={styles.logo} />
      
      <Text style={styles.title}>{isLogin ? "Iniciar Sesión" : "Registrarse"}</Text>

      {/* Campo de entrada para el correo electrónico */}
      {/* La API exige un correo válido con formato estándar (ejemplo: usuario@dominio.com). */}
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
        Debe ser un correo válido, por ejemplo: usuario@dominio.com
      </Text>

      {/* Campo de entrada para la contraseña */}
      {/* La API del profesor exige una contraseña mínima de 6 caracteres. 
          No requiere símbolos, números ni mayúsculas: solo 6+ caracteres. */}
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
        La contraseña debe tener al menos 6 caracteres.
      </Text>

      {/* Botón para enviar el formulario de autenticación */}
      <Text style={{textAlign: 'center', marginBottom: 10, color: '#888'}}>
        {isLogin ? "Ingresa tus credenciales" : "Crea una cuenta nueva"}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" />
      ) : (
        <Button 
          title={isLogin ? "Ingresar" : "Registrarse"} 
          onPress={handleSubmit} 
        />
      )}

      {/* Botón para cambiar entre modos de autenticación */}
      <TouchableOpacity 
        style={styles.switchButton} 
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.switchText}>
          {isLogin 
            ? "¿No tienes cuenta? Regístrate aquí" 
            : "¿Ya tienes cuenta? Inicia sesión"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilo de la pantalla de autenticación
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 12,
    color: "#3b82f6",
    fontWeight: "bold",
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#3b82f6",
  },
  input: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  switchButton: {
    marginTop: 20,
    alignItems: "center",
  },
  switchText: {
    color: "#3b82f6",
    fontSize: 14,
  }
});
