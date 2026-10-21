// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@tanstack/react-router",
        "@tanstack/react-query",
        "leaflet",
        "idb",
        "lucide-react",
        "clsx",
        "tailwind-merge",
        "date-fns",
        "sonner",
      ],
    },
    server: {
      warmup: {
        clientFiles: [
          "./src/routes/__root.tsx",
          "./src/routes/_app.tsx",
          "./src/routes/_app.dashboard.tsx",
          "./src/routes/_app.trips.index.tsx",
          "./src/components/app/AppShell.tsx",
          "./src/lib/store.ts",
          "./src/lib/i18n.ts",
        ],
      },
    },
    build: {
      target: "esnext",
      cssMinify: true,
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/leaflet")) return "vendor-leaflet";
            if (id.includes("node_modules/recharts")) return "vendor-recharts";
            if (id.includes("node_modules/lucide-react")) return "vendor-lucide";
            if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
            return undefined;
          },
        },
      },
    },
  },
});
