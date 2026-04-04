import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
    target: "es2015",
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx$/,
    exclude: [],
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    "process.env": {},
  },
});