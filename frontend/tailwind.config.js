/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}",],
  theme: {
    fontFamily:{
      heading: [ "Roboto", "serif" ],
      content: [ "Open Sans", "serif" ]
    },
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
      }
    },
  },
  plugins: [],
}

