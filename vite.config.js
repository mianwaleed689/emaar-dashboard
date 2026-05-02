import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react({ include: "**/*.{jsx,tsx}", babel: { parserOpts: { plugins: ["jsx"] } } })],
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if(id.includes("node_modules/react")) return "vendor-react";
          if(id.includes("node_modules/firebase")) return "vendor-firebase";
          if(id.includes("node_modules/recharts")) return "vendor-charts";
          if(id.includes("/src/admin")) return "chunk-admin";
        }
      }
    }
  },
  optimizeDeps: { esbuildOptions: { loader: { ".jsx": "jsx" } } },
  server: { port: 3000, open: true },
  define: { "process.env": {} }
});