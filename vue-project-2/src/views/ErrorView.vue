<template>
  <div class="center">
    <div class="not-logged-in">
      <div class="icon">📽️</div>
      <h2>404 Error</h2>
      <p>Unable to find requested endpoint</p>
      <RouterLink to="/">Return Home</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
}

.not-logged-in {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(30, 30, 30, 0.9);
  border-radius: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  max-width: 500px;
  width: 100%;
}

.not-logged-in .icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.not-logged-in h2 {
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.not-logged-in p {
  font-size: 1.1rem;
  color: #d1d5db;
}
</style>
