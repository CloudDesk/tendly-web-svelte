import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: "build", // Output HTML files here
      assets: "build", // Output assets (JS, CSS) here
      fallback: "index.html", // For SPA routing
      precompress: false,
      prerender: {
        entries: ["*"], // Prerender all routes by default
      },
    }),
    // Remove the separate prerender block
    // prerender: { enabled: true }, // This was causing the error
    alias: {
      $lib: "./src/lib",
    },
  },
  preprocess: [
    vitePreprocess(),
    sveltePreprocess({
      typescript: true, // Enable TypeScript preprocessing
    }),
  ],
};

export default config;
