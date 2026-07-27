import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The demo consumes the built `dist` output of each workspace package.
export default defineConfig({
  plugins: [react()],
  server: { open: true, port: 5173 },
});
