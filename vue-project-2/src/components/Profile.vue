<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCurrentUser } from 'vuefire'
import { Film, BarChart3 } from 'lucide-vue-next'

const currentUser = useCurrentUser()

const user = computed(() => {
  if (!currentUser.value) return null
  return {
    displayName: currentUser.value.displayName || 'User',
    email: currentUser.value.email,
    uid: currentUser.value.uid,
  }
})

const stats = ref({
  moviesWatched: 142,
  totalHours: 284,
  favoriteGenre: 'Sci-Fi',
  averageRating: 4.2,
})

const movies = ref([
  {
    id: 1,
    title: 'Inception',
    year: 2010,
    rating: 4.8,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
  },
  {
    id: 2,
    title: 'The Matrix',
    year: 1999,
    rating: 4.7,
    poster: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=300&h=450&fit=crop',
  },
  {
    id: 3,
    title: 'Interstellar',
    year: 2014,
    rating: 4.9,
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop',
  },
  {
    id: 4,
    title: 'Blade Runner 2049',
    year: 2017,
    rating: 4.5,
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop',
  },
])
</script>

<template>
  <div class="profile-container">
    <div v-if="!user" class="not-logged-in">
      <div class="icon">🔒</div>
      <h2>Please Log In</h2>
      <p>You need to be logged in to view your profile.</p>
    </div>

    <template v-else>
      <div class="profile-header">
        <div class="profile-image-section">
          <div class="profile-image-wrapper">
            <div class="profile-image-placeholder">
              {{ user.displayName?.[0]?.toUpperCase() || 'U' }}
            </div>
          </div>
        </div>

        <div class="profile-info">
          <h1 class="user-name">{{ user.displayName }}</h1>
          <p class="user-email">{{ user.email }}</p>
        </div>
      </div>

      <!-- Statistics Summary Section -->
      <div class="section-divider">
        <BarChart3 :size="20" />
        <h2>Statistics Summary</h2>
      </div>

      <div class="statistics-section">
        <div class="stat-card">
          <h3>{{ stats.moviesWatched }}</h3>
          <p>Movies Watched</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.totalHours }}</h3>
          <p>Hours Watched</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.favoriteGenre }}</h3>
          <p>Favorite Genre</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.averageRating }}</h3>
          <p>Avg Rating</p>
        </div>
      </div>

      <!-- Movie Cards Section -->
      <div class="section-divider">
        <Film :size="20" />
        <h2>Your Movie Collection</h2>
      </div>

      <div class="movies-section">
        <div v-for="movie in movies" :key="movie.id" class="movie-card">
          <img :src="movie.poster" :alt="movie.title" class="movie-poster" />
          <div class="movie-info">
            <h3>{{ movie.title }}</h3>
            <p>{{ movie.year }}</p>
            <div class="movie-rating">⭐ {{ movie.rating }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(to bottom, #f9fafb, #ffffff);
}

.profile-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3rem;
  margin-bottom: 3rem;
  background: white;
  padding: 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 2rem;
  }
}

.profile-image-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-image-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.profile-image-placeholder {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 4px solid #667eea;
  font-size: 4rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.profile-info {
  flex: 1;
  min-width: 0;
  overflow: visible;
}

.user-name {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  word-break: break-word;
}

.user-email {
  margin: 0;
  font-size: 1.1rem;
  color: #6b7280;
  word-break: break-word;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 2rem 0 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-divider h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.statistics-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  border-radius: 1rem;
  color: white;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card h3 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.stat-card p {
  margin: 0.5rem 0 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.movies-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.movie-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
}

.movie-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.movie-poster {
  width: 100%;
  height: 350px;
  object-fit: cover;
}

.movie-info {
  padding: 1rem;
}

.movie-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  color: #1f2937;
}

.movie-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.movie-rating {
  margin-top: 0.5rem;
  color: #f59e0b;
  font-weight: 600;
}
</style>
