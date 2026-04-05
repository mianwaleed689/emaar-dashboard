import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react({
    include: "**/*.{jsx,tsx}",
    babel: {
      parserOpts: {
        plugins: ["jsx"]
      }
    }
  })],
  build: {
    outDir: "build",
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".jsx": "jsx"
      }
    }
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    "process.env": {},
  },
});