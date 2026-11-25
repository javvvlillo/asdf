import type { Config } from "tailwindcss";

// Paleta de la invitación: papel beige, azul tinta, blanco.
// Los nombres antiguos (cream, charcoal, gold...) se mantienen como alias
// para que el panel admin herede la paleta nueva sin reescribirlo.
const azul = {
  50: "#EEF2F9",
  100: "#D9E2F1",
  300: "#8FA6CF",
  500: "#4A6DB0",
  600: "#34589A", // azul principal de la invitación
  700: "#2A4780",
  900: "#1C2F55",
};
const beige = {
  100: "#F4EEE5",
  200: "#ECE3D5", // fondo papel
  300: "#E2D5C1",
  400: "#E8CFB0", // beige del dress code
};
const verde = { 100: "#E3EADF", 500: "#6A8763", 700: "#4C6446" };

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        azul,
        beige,
        verde,
        cream: beige[200],
        paper: beige[300],
        charcoal: azul[900],
        sage: { 50: verde[100], 100: verde[100], 300: verde[500], 500: verde[500], 700: verde[700] },
        terracotta: { 50: azul[50], 200: azul[100], 400: azul[500], 600: azul[700] },
        gold: azul[600],
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
