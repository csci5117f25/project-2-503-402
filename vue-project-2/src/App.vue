<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { getCurrentUser, useCurrentUser, useFirebaseAuth } from 'vuefire'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { provide, computed } from 'vue'
import router from './router'

const user = useCurrentUser()
const auth = useFirebaseAuth()
const provider = new GoogleAuthProvider()

const getFirstName = (fullName: string | null) => {
  if (!fullName) return 'User'
  return fullName.split(' ')[0]
}

const userData = computed(() => {
  if (!user.value) return null
  return {
    displayName: user.value.displayName || 'User',
    email: user.value.email,
    photoURL: user.value.photoURL || null,
    uid: user.value.uid,
  }
})

provide('userData', userData)

provide('userData', userData)
async function login() {
  try {
    if (auth) {
      await signInWithPopup(auth, provider)
      if (!(await getCurrentUser())) throw new Error('Invalid user')
      router.push('/')
    }
  } catch (error) {
    console.error('Login failed:', error)
  }
}

async function logout() {
  try {
    if (auth) {
      await signOut(auth)
      router.push('/login')
    }
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

<template>
  <div class="app-container">
    <header>
      <div class="header-content">
        <h1 class="logo">Movie Tracker</h1>
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/form">Form</RouterLink>
          <RouterLink to="/QR">QR Code</RouterLink>
          <RouterLink to="/profile">Profile</RouterLink>

          <div class="auth-section">
            <button v-if="!user" @click="login" class="auth-btn login-btn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
            <div v-else class="user-section">
              <span class="user-name">{{ getFirstName(user.displayName) || user.email }}</span>
              <button @click="logout" class="auth-btn logout-btn">Log out</button>
            </div>
          </div>
        </nav>
      </div>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>
<style scoped src="@/styles/app.css"></style>
