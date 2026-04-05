import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react({
    babel: {
      plugins: []
    }
  })],
  build: {
    outDir: "build",
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    "process.env": {},
  },
});