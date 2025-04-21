
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
<<<<<<< HEAD
import { cartographer } from '@replit/vite-plugin-cartographer';
=======
import { fileURLToPath } from "url";
import cartographer from '@replit/vite-plugin-cartographer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
>>>>>>> refs/remotes/origin/main

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
<<<<<<< HEAD
    cartographer()
=======
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [cartographer()]
      : []),
>>>>>>> refs/remotes/origin/main
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'esm',
      },
    },
  },
});
