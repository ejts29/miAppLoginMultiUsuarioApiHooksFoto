// app/home/index.tsx
// Pantalla de inicio Home
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

// Logo usando ruta para el logo
const logoSource = require("@assets/images/logo.png");

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mi App Login</Text>

      <Image source={logoSource} style={styles.logo} />

      <Text style={styles.text}>
        🏠 Bienvenido a la pantalla Home{"\n"}
        <Text style={styles.subtitle}>Esta Es Mi App Multi-usuario de lista de tareas App con api externa 😊😁</Text>
      </Text>
    </View>
  );
}

// Estilos para la pantalla Home
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  logo: {
    width: width * 0.4,
    height: width * 0.4,
    resizeMode: "contain",
    marginBottom: 20,
  },

  text: {
    fontSize: 26,
    color: "#3B82F6",
    textAlign: "center",
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 20,
    color: "gray",
    fontWeight: "normal",
    lineHeight: 25,
  },
});
