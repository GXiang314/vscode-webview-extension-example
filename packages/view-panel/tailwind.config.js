/** @type {import('tailwindcss').Config} */
export default {
  content: [
    'node_modules/flowbite-vue/**/*.{js,jsx,ts,tsx,vue}',
    'node_modules/flowbite/**/*.{js,jsx,ts,tsx}',
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xsss': {'min': '0px', 'max': '160px'},
        // => @media (min-width: 0px and max-width: 160px) { ... }
        'xss': {'min': '161px', 'max': '320px'},
        // => @media (min-width: 161px and max-width: 320px) { ... }
        'xs': {'min': '321px', 'max': '640px'},
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}