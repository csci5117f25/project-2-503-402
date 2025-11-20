import './assets/main.css'

import { createApp } from 'vue'
import { VueFire, VueFireAuth } from 'vuefire'
import { initializeApp } from 'firebase/app'
import App from './App.vue'
import router from './router'

const firebaseConfig = {
  apiKey: "AIzaSyDT2yOU36LV6oTJwI65j7qx9IrmUdhXsgY",
  authDomain: "p2-502-402.firebaseapp.com",
  projectId: "p2-502-402",
  storageBucket: "p2-502-402.firebasestorage.app",
  messagingSenderId: "414378086538",
  appId: "1:414378086538:web:441ce74554f29340f45d73"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig)

const app = createApp(App)

app.use(router)
app.use(VueFire, {
  firebaseApp,
  modules: [
    VueFireAuth()
  ]
})

app.mount('#app')
