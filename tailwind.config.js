/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,njk}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ["light, dark"],
  },
  plugins: [require("daisyui")],
}

