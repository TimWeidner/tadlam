import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => undefined)
  else navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => registration.unregister()))
}
