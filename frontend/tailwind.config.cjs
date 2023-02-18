/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      boxShadow: {
        'total': '0 0 0 1000px rgba(0, 0, 0, 0.35)'
      },
      content: {
        'comma': ', '
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
