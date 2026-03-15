import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f7fafc",
        surface: "#ffffff",
        ink: "#0f172a",
        slate: "#334155",
        navy: "#102a43",
        trust: "#2f855a",
        caution: "#d69e2e",
        danger: "#c53030",
        border: "#dbe4ee"
      },
      boxShadow: {
        soft: "0 12px 40px -18px rgba(16, 42, 67, 0.35)"
      },
      borderRadius: {
        xl2: "1.1rem"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at 15% 20%, rgba(47,133,90,0.16), transparent 45%), radial-gradient(circle at 85% 10%, rgba(16,42,67,0.2), transparent 40%)"
      }
    }
  },
  plugins: []
};

export default config;
