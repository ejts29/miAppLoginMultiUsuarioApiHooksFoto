// eslint.config.js
// Documentación → https://docs.expo.dev/guides/using-eslint/

const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,

  {
    ignores: ["dist/*", "build/*"],

    rules: {
      // Permite alias sin que ESLint marque errores
      "import/no-unresolved": [
        "error",
        {
          ignore: ["^@/", "^@src/", "^@assets/", "^@components/"],
        },
      ],
    },
  },
]);
