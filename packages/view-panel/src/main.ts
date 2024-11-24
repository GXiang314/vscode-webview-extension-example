import './style.css'
import '../node_modules/flowbite-vue/dist/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import router from './router'
import App from './App.vue'
const app = createApp(App)

app.use(createPinia()).use(router).mount('#app')
