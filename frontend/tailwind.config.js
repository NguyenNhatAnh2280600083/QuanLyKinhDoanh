/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1677ff',
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind preflight to avoid conflicts with Ant Design
  },
}
