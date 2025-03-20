import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      prerender: { default: false },
      pages: "build", // Output HTML files here
      assets: "build", // Output assets (JS, CSS) here
      fallback: "index.html", // For SPA routing
      precompress: false,
    }),
    alias: {
      $lib: "./src/lib",
    },
  },
  preprocess: vitePreprocess(),
};

export default config;
