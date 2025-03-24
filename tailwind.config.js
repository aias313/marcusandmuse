/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#1E293B',
        light: '#FAFAFA',
        accent: '#DB7B5A',
        muted: '#CBD5E1'
      }
    },
  },
  plugins: [],
};
