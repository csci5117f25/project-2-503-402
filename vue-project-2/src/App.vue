<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'

const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <div class="app-container">
    <header>
      <div class="header-content">
        <h1 class="logo">🎬 Movie Tracker</h1>

        <!-- Mobile Menu Button -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <span v-if="!isMobileMenuOpen">☰</span>
          <span v-else>✕</span>
        </button>

        <!-- Desktop Navigation -->
        <nav class="desktop-nav">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/profile">Profile</RouterLink>
        </nav>
      </div>

      <!-- Mobile Navigation -->
      <nav v-if="isMobileMenuOpen" class="mobile-nav">
        <RouterLink to="/" @click="closeMobileMenu">Home</RouterLink>
        <RouterLink to="/about" @click="closeMobileMenu">About</RouterLink>
        <RouterLink to="/profile" @click="closeMobileMenu">Profile</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  width: 100%;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

/* Mobile Menu Button - Show on Mobile Only */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}

/* Desktop Navigation - Show by Default */
.desktop-nav {
  display: flex;
  gap: 0.5rem;
}

.desktop-nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: background 0.2s;
}

.desktop-nav a:hover {
  background: rgba(255, 255, 255, 0.2);
}

.desktop-nav a.router-link-active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

/* Mobile Navigation - Hidden by Default */
.mobile-nav {
  display: none;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
}

.mobile-nav a {
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  transition: background 0.2s;
  border-left: 3px solid transparent;
}

.mobile-nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-nav a.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  border-left-color: white;
  font-weight: 600;
}

main {
  flex: 1;
  width: 100%;
}

/* Tablet and Desktop Styles */
@media (max-width: 767px) {
  /* Show mobile menu button on small screens */
  .mobile-menu-btn {
    display: block;
  }

  /* Hide desktop navigation on mobile */
  .desktop-nav {
    display: none;
  }

  /* Show mobile navigation when open */
  .mobile-nav {
    display: flex;
  }
}

/* Large Desktop */
@media (min-width: 1024px) {
  .header-content {
    padding: 1.25rem 3rem;
  }

  .logo {
    font-size: 1.75rem;
  }

  .desktop-nav {
    gap: 1.5rem;
  }

  .desktop-nav a {
    font-size: 1.1rem;
    padding: 0.5rem 1.25rem;
  }
}
</style>
