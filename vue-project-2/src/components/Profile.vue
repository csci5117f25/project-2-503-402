<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCurrentUser, useFirestore } from 'vuefire'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { Film, BarChart3, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
  
  import VueQrcode from 'vue-qrcode'
import { GetUserQrCode } from '@/qrcodes'

const router = useRouter()


const qrCodeValue = ref('')
const qrDataUrl = ref('')

function onDataUrlChange(data) {
  qrDataUrl.value = data
}

async function genQrCode(userId) {
  const qrData = await GetUserQrCode(userId)
  qrCodeValue.value = qrData.value
}

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
  
  onMounted(() => {
  if (user.value) {
    genQrCode(user.value.uid)
  }
})

// Calculate statistics when user changes
watch(
  user,
  async (newUser) => {
    if (newUser) {
      await calculateStats(newUser.uid)
      await fetchDraftReviews(newUser.uid)
    }
  },
])
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
          <div class="qr-code-section">
            <div v-if="qrCodeValue">
              <VueQrcode :value="qrCodeValue" @change="onDataUrlChange" />
              <a v-if="qrDataUrl" :href="qrDataUrl" download="movieprofile.png">Download QR</a>
            </div>
          </div>
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

<style scoped src="@/styles/profile.css">
  .qr-code-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.qr-code-section canvas,
.qr-code-section img {
  width: 120px;
  height: 120px;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: #f9fafb;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}
.qr-code-section a {
  font-size: 0.85rem;
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
}

.qr-code-section a:hover {
  text-decoration: underline;
}
</style>
