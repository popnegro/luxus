const themeVars = require('@tailwindcss/theme-vars');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.html',
    './assets/js/**/*.js',
  ],
  theme: {
    // Carga las variables desde tu archivo de tema
    extend: themeVars.loadFile('./assets/css/theme.css'),
  },
  plugins: [
    themeVars.plugin,
  ],
};