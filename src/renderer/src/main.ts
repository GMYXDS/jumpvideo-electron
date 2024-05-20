import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import registerIcons from './tools/register-icons'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.use(registerIcons)
app.mount('#app')
