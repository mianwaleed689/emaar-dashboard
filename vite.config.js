import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react({ include: "**/*.{jsx,tsx}", babel: { parserOpts: { plugins: ["jsx"] } } })],
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if(id.includes("node_modules/react")) return "vendor-react";
          if(id.includes("node_modules/firebase")) return "vendor-firebase";
          if(id.includes("node_modules/recharts")) return "vendor-charts";
          if(id.includes("node_modules/lucide")) return "vendor-icons";
          if(id.includes("node_modules/date-fns")) return "vendor-dates";
          if(id.includes("/src/admin/AdminPanel")) return "chunk-admin-main";
          if(id.includes("/src/admin/DataManager")) return "chunk-admin-data";
          if(id.includes("/src/admin")) return "chunk-admin-other";
          if(id.includes("/src/tabs/TeamTab")) return "chunk-team";
          if(id.includes("/src/tabs/MarketTab")) return "chunk-market";
          if(id.includes("/src/tabs/ProjectsTab")) return "chunk-projects";
          if(id.includes("/src/tabs")) return "chunk-tabs";
          if(id.includes("/src/data")) return "chunk-data";
          if(id.includes("/src/utils")) return "chunk-utils";
          if(id.includes("/src/communities")) return "chunk-communities";
          if(id.includes("/src/components")) return "chunk-components";
        }
      }
    }
  },
  optimizeDeps: { esbuildOptions: { loader: { ".jsx": "jsx" } } },
  server: { port: 3000, open: true },
  define: { "process.env": {} }
});