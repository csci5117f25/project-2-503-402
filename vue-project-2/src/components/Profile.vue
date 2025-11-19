<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Film, BarChart3 } from 'lucide-vue-next'

const profileImage = ref<string | null>(null)
const userName = ref('John Doe')
const fileInput = ref<HTMLInputElement | null>(null)

const stats = ref({
  moviesWatched: 142,
  totalHours: 284,
  favoriteGenre: 'Sci-Fi',
  averageRating: 4.2
})

const movies = ref([
  {
    id: 1,
    title: 'Inception',
    year: 2010,
    rating: 4.8,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop'
  },
  {
    id: 2,
    title: 'The Matrix',
    year: 1999,
    rating: 4.7,
    poster: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=300&h=450&fit=crop'
  },
  {
    id: 3,
    title: 'Interstellar',
    year: 2014,
    rating: 4.9,
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop'
  },
  {
    id: 4,
    title: 'Blade Runner 2049',
    year: 2017,
    rating: 4.5,
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop'
  }
])

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profileImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div class="profile-container">
    <!-- Profile Header -->
    <div class="profile-header">
      <div class="profile-image-section">
        <div class="profile-image-wrapper">
          <img
            v-if="profileImage"
            :src="profileImage"
            alt="Profile"
            class="profile-image"
          />
          <div v-else class="profile-image-placeholder">
            <Upload :size="48" />
          </div>
          <input
            ref="fileInput"
            type="file"
            @change="handleImageUpload"
            accept="image/*"
            style="display: none"
          />
          <button @click="triggerFileInput" class="upload-button">
            Upload Image
          </button>
        </div>
      </div>

      <div class="profile-info">
        <input
          v-model="userName"
          type="text"
          placeholder="Enter your name"
          class="name-input"
        />
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
      <div
        v-for="movie in movies"
        :key="movie.id"
        class="movie-card"
      >
        <img :src="movie.poster" :alt="movie.title" class="movie-poster" />
        <div class="movie-info">
          <h3>{{ movie.title }}</h3>
          <p>{{ movie.year }}</p>
          <div class="movie-rating">⭐ {{ movie.rating }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3rem;
  margin-bottom: 3rem;
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

.profile-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #3b82f6;
}

.profile-image-placeholder {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  border: 4px solid #d1d5db;
}

.upload-button {
  padding: 0.5rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.upload-button:hover {
  background: #2563eb;
}

.profile-info {
  width: 100%;
  max-width: 400px;
}

.name-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.5rem;
  text-align: center;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: border-color 0.2s;
}

.name-input:focus {
  outline: none;
  border-color: #3b82f6;
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
  transition: transform 0.2s, box-shadow 0.2s;
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
