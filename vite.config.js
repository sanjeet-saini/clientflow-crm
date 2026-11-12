import { defineConfig } from 'vite';

// Automatic JSX runtime keeps components readable without a React default import.
// base: './' → build ke saare file paths relative banenge, taaki app
// GitHub Pages ke sub-folder (username.github.io/clientflow-crm/) mein bhi chale.
export default defineConfig({ base: './', esbuild: { jsx: 'automatic' } });
