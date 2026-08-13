import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1F2937",
        mist: "#F5F5F5",
        green: "#34C759",
        greenDeep: "#1F8A3C",
      },
    },
  },
  plugins: [],
};

export default config;
