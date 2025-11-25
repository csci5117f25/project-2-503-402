import { createApp } from 'vue'
import { VueFire, VueFireAuth } from 'vuefire'
import { firebaseApp } from './firebase_conf'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.use(VueFire, {
  firebaseApp,
  modules: [
    VueFireAuth()
  ]
})
app.mount('#app')
