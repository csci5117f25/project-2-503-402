<template>
  <div class="center">
    <div class="not-logged-in">
      <div class="icon">📽️</div>
      <h2>Login First</h2>
      <p>To use MOVIETRACKER, you must be logged in!</p>
    </div>
  </div>
</template>

<style scoped>
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-logged-in {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 3rem;
  width: 90%;
}

.not-logged-in .icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.not-logged-in h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.not-logged-in p {
  font-size: 1.1rem;
  color: #666;
}
</style>
