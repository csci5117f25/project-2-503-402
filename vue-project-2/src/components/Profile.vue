<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCurrentUser, useFirestore } from 'vuefire'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { Film, BarChart3, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentUser = useCurrentUser()
const db = useFirestore()
const user = computed(() => {
  if (!currentUser.value) return null
  return {
    displayName: currentUser.value.displayName || 'User',
    email: currentUser.value.email,
    uid: currentUser.value.uid,
  }
})
const stats = ref({
  moviesWatched: 0,
  totalHours: 0,
  favoriteGenre: 'N/A',
  averageRating: 0,
})

const isLoadingStats = ref(false)
const showMoviesList = ref(false)
const watchedMovies = ref<Array<{ id: string; title: string; year?: number; poster?: string }>>([])
const isLoadingMovies = ref(false)

const draftReviews = ref<
  Array<{
    id: string
    title: string
    year?: number
    poster?: string
    rating?: number
    comment?: string
  }>
>([])
const isLoadingDrafts = ref(false)

function navigateToDraft(movieId: string, rating?: number, comment?: string) {
  router.push({
    name: 'form',
    query: {
      movieId: movieId,
      rating: rating?.toString() || '',
      comment: comment || '',
    },
  })
}

// Calculate statistics when user changes
watch(
  user,
  async (newUser) => {
    if (newUser) {
      await calculateStats(newUser.uid)
      await fetchDraftReviews(newUser.uid)
    }
  },
  { immediate: true },
)

async function calculateStats(userId: string) {
  isLoadingStats.value = true

  try {
    const reviewsRef = collection(db, 'users', userId, 'reviews')
    const reviewsSnapshot = await getDocs(reviewsRef)

    if (reviewsSnapshot.empty) {
      stats.value = {
        moviesWatched: 0,
        totalHours: 0,
        favoriteGenre: 'N/A',
        averageRating: 0,
      }
      return
    }

    let totalMovies = 0
    let totalMinutes = 0
    const genreCounts: Record<string, number> = {}
    let totalRating = 0
    let ratingCount = 0

    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data()
      const movieId = reviewDoc.id

      // Only count reviews where draft is false
      if (reviewData && reviewData.draft === false) {
        totalMovies++

        if (reviewData.rating !== undefined) {
          totalRating += reviewData.rating
          ratingCount++
        }

        try {
          const movieRef = doc(db, 'movies', movieId)
          const movieSnap = await getDoc(movieRef)

          if (movieSnap.exists()) {
            const movieData = movieSnap.data()

            if (movieData.runtime) {
              totalMinutes += movieData.runtime
            }

            if (movieData.genres) {
              for (const genreId in movieData.genres) {
                const genreName = movieData.genres[genreId]
                genreCounts[genreName] = (genreCounts[genreName] || 0) + 1
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching movie ${movieId}:`, error)
        }
      }
    }

    // Calculate favorite genre
    let favoriteGenre: string = 'N/A'
    if (Object.keys(genreCounts).length > 0) {
      const maxCount = Math.max(...Object.values(genreCounts))
      const topGenres = Object.keys(genreCounts).filter((genre) => genreCounts[genre] === maxCount)
      const selectedGenre = topGenres[Math.floor(Math.random() * topGenres.length)]
      if (selectedGenre !== undefined) {
        favoriteGenre = selectedGenre
      }
    }
    const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100

    stats.value = {
      moviesWatched: totalMovies,
      totalHours: totalHours,
      favoriteGenre: favoriteGenre,
      averageRating: averageRating,
    }
  } catch (error) {
    console.error('Error calculating stats:', error)
  } finally {
    isLoadingStats.value = false
  }
}

async function fetchDraftReviews(userId: string) {
  isLoadingDrafts.value = true

  try {
    const reviewsRef = collection(db, 'users', userId, 'reviews')
    const reviewsSnapshot = await getDocs(reviewsRef)

    const drafts: Array<{
      id: string
      title: string
      year?: number
      poster?: string
      rating?: number
      comment?: string
    }> = []

    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data()
      const movieId = reviewDoc.id

      // Check if draft is true
      if (reviewData.draft === true) {
        try {
          const movieRef = doc(db, 'movies', movieId)
          const movieSnap = await getDoc(movieRef)

          if (movieSnap.exists()) {
            const movieData = movieSnap.data()
            const posterUrl = movieData.poster_path
              ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
              : undefined
            const year = movieData.release_date
              ? new Date(movieData.release_date).getFullYear()
              : undefined

            drafts.push({
              id: movieId,
              title: movieData.title || 'Unknown Title',
              year: year,
              poster: posterUrl,
              rating: reviewData.rating,
              comment: reviewData.comment,
            })
          }
        } catch (error) {
          console.error(`Error fetching movie ${movieId}:`, error)
        }
      }
    }

    // Sort by title
    drafts.sort((a, b) => a.title.localeCompare(b.title))
    draftReviews.value = drafts
  } catch (error) {
    console.error('Error fetching draft reviews:', error)
  } finally {
    isLoadingDrafts.value = false
  }
}

async function fetchWatchedMovies() {
  if (!user.value) return

  isLoadingMovies.value = true
  showMoviesList.value = true

  try {
    const reviewsRef = collection(db, 'users', user.value.uid, 'reviews')
    const reviewsSnapshot = await getDocs(reviewsRef)

    const moviesList: Array<{ id: string; title: string; year?: number; poster?: string }> = []

    for (const reviewDoc of reviewsSnapshot.docs) {
      const reviewData = reviewDoc.data()
      const movieId = reviewDoc.id

      // Only show movies where draft is false
      if (reviewData.draft === false) {
        try {
          const movieRef = doc(db, 'movies', movieId)
          const movieSnap = await getDoc(movieRef)

          if (movieSnap.exists()) {
            const movieData = movieSnap.data()
            const posterUrl = movieData.poster_path
              ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
              : undefined
            moviesList.push({
              id: movieId,
              title: movieData.title || 'Unknown Title',
              year: movieData.release_date
                ? new Date(movieData.release_date).getFullYear()
                : undefined,
              poster: posterUrl,
            })
          }
        } catch (error) {
          console.error(`Error fetching movie ${movieId}:`, error)
        }
      }
    }

    // Sort by title
    moviesList.sort((a, b) => a.title.localeCompare(b.title))
    watchedMovies.value = moviesList
  } catch (error) {
    console.error('Error fetching watched movies:', error)
  } finally {
    isLoadingMovies.value = false
  }
}

function closeMoviesList() {
  showMoviesList.value = false
}
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

      <div v-if="isLoadingStats" class="loading-stats">Loading your statistics...</div>

      <div v-else class="statistics-section">
        <div class="stat-card clickable" @click="fetchWatchedMovies">
          <h3>{{ stats.moviesWatched }}</h3>
          <p>Movies Watched</p>
          <div class="click-hint">Click to view list</div>
        </div>
        <div class="stat-card">
          <h3>{{ stats.totalHours }}</h3>
          <p>Total Hours Watched</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.favoriteGenre }}</h3>
          <p>Favorite Genre</p>
        </div>
        <div class="stat-card">
          <h3>{{ stats.averageRating }}</h3>
          <p>Average Rating (out of 10)</p>
        </div>
      </div>

      <div v-if="showMoviesList" class="modal-overlay" @click.self="closeMoviesList">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Movies You've Watched</h2>
            <button class="close-button" @click="closeMoviesList">
              <X :size="24" />
            </button>
          </div>

          <div v-if="isLoadingMovies" class="modal-loading">
            <div class="loading-spinner"></div>
            <p>Loading your movies...</p>
          </div>

          <div v-else class="movies-list">
            <div v-if="watchedMovies.length === 0" class="no-movies">No movies found</div>
            <div v-else class="movie-item" v-for="movie in watchedMovies" :key="movie.id">
              <div class="movie-item-poster">
                <img v-if="movie.poster" :src="movie.poster" :alt="movie.title" />
                <div v-else class="movie-item-placeholder">
                  <Film :size="24" />
                </div>
              </div>
              <div class="movie-item-info">
                <h3>{{ movie.title }}</h3>
                <p v-if="movie.year">{{ movie.year }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Movie Cards Section -->
      <div class="section-divider">
        <Film :size="20" />
        <h2>Review Draft Collection</h2>
      </div>

      <div v-if="isLoadingDrafts" class="loading-stats">Loading your draft reviews...</div>

      <div v-else-if="draftReviews.length === 0" class="no-drafts">
        <p>No draft reviews found</p>
      </div>

      <div v-else class="movies-section">
        <div
          v-for="movie in draftReviews"
          :key="movie.id"
          class="movie-card"
          @click="navigateToDraft(movie.id, movie.rating, movie.comment)"
        >
          <img v-if="movie.poster" :src="movie.poster" :alt="movie.title" class="movie-poster" />
          <div v-else class="movie-poster-placeholder">
            <Film :size="48" />
          </div>
          <div class="movie-info">
            <h3>{{ movie.title }}</h3>
            <p v-if="movie.year" class="movie-year">{{ movie.year }}</p>
            <div v-if="movie.rating !== undefined" class="movie-rating">⭐ {{ movie.rating }}</div>
            <p v-if="movie.comment" class="movie-comment">{{ movie.comment }}</p>
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
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
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

.click-hint {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
}

.stat-card.clickable:hover .click-hint {
  opacity: 0.8;
}

.loading-stats {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 1.1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
  font-weight: 700;
}

.close-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: #6b7280;
}

.movies-list {
  overflow-y: auto;
  padding: 1rem;
  max-height: calc(80vh - 80px);
}

.no-movies {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
  font-size: 1rem;
}

.movie-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  transition: background 0.2s;
  cursor: pointer;
}

.movie-item:hover {
  background: #f9fafb;
}

.movie-item-poster {
  width: 60px;
  height: 90px;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.movie-item-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.movie-item-placeholder {
  color: #9ca3af;
}

.movie-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.movie-item-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movie-item-info p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.no-drafts {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
  font-size: 1rem;
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

.movie-poster-placeholder {
  width: 100%;
  height: 350px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.movie-info {
  padding: 1rem;
}

.movie-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  color: #1f2937;
}

.movie-year {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.movie-rating {
  margin-top: 0.5rem;
  color: #f59e0b;
  font-weight: 600;
}

.movie-comment {
  margin-top: 0.75rem;
  color: #4b5563;
  font-size: 0.9rem;
  line-height: 1.5;
  font-style: italic;
}

.not-logged-in {
  text-align: center;
  padding: 4rem 2rem;
}

.not-logged-in .icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.not-logged-in h2 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.not-logged-in p {
  color: #6b7280;
}
</style>
