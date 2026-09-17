/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{html,ts}",],
  theme: {
    fontFamily:{
      heading: [ "JetBrains Mono", "monospace" ],
      content: [ "JetBrains Mono", "monospace" ],
      mono: [ "JetBrains Mono", "monospace" ]
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

