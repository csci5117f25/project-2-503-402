<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header>
      <div class="header-content">
        <h1 class="logo">Movie Tracker</h1>
        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/profile">Profile</RouterLink>
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

main {
  flex: 1;
  width: 100%;
}

@media (max-width: 768px) {
  .header-content {
    padding: 1.25rem 2rem;
  }

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
}
</style>
