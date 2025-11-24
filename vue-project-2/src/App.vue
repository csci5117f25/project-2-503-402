<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useCurrentUser, useFirebaseAuth } from 'vuefire'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { provide, computed } from 'vue'

const user = useCurrentUser()
const auth = useFirebaseAuth()
const provider = new GoogleAuthProvider()

// Provide user data to child components (like Profile.vue)
const userData = computed(() => {
  if (!user.value) return null
  return {
    displayName: user.value.displayName || 'User',
    email: user.value.email,
    photoURL: user.value.photoURL,
    uid: user.value.uid
  }
})

provide('userData', userData)

async function login() {
  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    console.error('Login failed:', error)
  }
}

async function logout() {
  try {
    await signOut(auth)
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
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div v-else class="user-section">
              <img
                v-if="user.photoURL"
                :src="user.photoURL"
                :alt="user.displayName || 'User'"
                class="user-avatar"
              />
              <div v-else class="user-avatar-placeholder">
                {{ (user.displayName || user.email || 'U')[0].toUpperCase() }}
              </div>
              <span class="user-name">{{ user.displayName || user.email }}</span>
              <button @click="logout" class="auth-btn logout-btn">
                Log out
              </button>
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

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.app-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  padding: 1.5rem 4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.logo {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.logo:hover {
  transform: scale(1.05);
}

nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 1.05rem;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

nav a::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

nav a:hover::before {
  transform: translateX(0);
}

nav a:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.auth-section {
  margin-left: 1rem;
  display: flex;
  align-items: center;
}

.auth-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-btn {
  background: white;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 150px;
  white-space: nowrap;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

main {
  flex: 1;
  width: 100%;
}

@media (max-width: 968px) {
  .header-content {
    padding: 1.25rem 2rem;
    flex-direction: column;
    gap: 1rem;
  }

  nav {
    flex-wrap: wrap;
    justify-content: center;
  }

  .auth-section {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .logo {
    font-size: 1.5rem;
  }

  nav {
    gap: 0.25rem;
  }

  nav a {
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
  }

  .auth-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .user-avatar,
  .user-avatar-placeholder {
    width: 32px;
    height: 32px;
  }

  .user-name {
    display: none;
  }
}
</style>
