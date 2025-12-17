<script setup lang="ts">
import FormCard from '@/components/FormCard.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import { tmdbImageURL, type UserMovieReview } from '@/movies'
import { computed, ref } from 'vue'

const review = ref<UserMovieReview | undefined>(undefined)
const inputId = ref<number | undefined>(undefined)
const successMsg = ref(false)
const today = new Date()

const previewMovie = ref<UserMovieReview | null>(null)
const previewMovieId = ref<number | null>(null)
const previewUserRating = ref<number | null>(null)
const previewUserThoughts = ref<string | null>(null)

const placeholderReview = ref<UserMovieReview>({
  title: 'Review Preview',
  release_date: today.toLocaleDateString(),
  tagline: 'Click Preview to see your card.',
  runtime: 0,
  budget: 0,
  genres: {},
  rating_avg: 0,
  rating_count: 0,
  cached_at: today,
  rating: 0,
  comment: '',
} as UserMovieReview)

function handleMovie(id: number | null, data?: UserMovieReview) {
  if (data && id) {
    review.value = data
    inputId.value = id
  } else {
    review.value = undefined
    inputId.value = undefined
  }
}

function handlePreview(payload: { movieId: number; rating: number; comment: string }) {
  if (!review.value || !inputId.value) return
  if (payload.movieId !== inputId.value) return

  previewMovie.value = review.value
  previewMovieId.value = inputId.value
  previewUserRating.value = payload.rating
  previewUserThoughts.value = payload.comment
}

function handleSubmit(success: boolean) {
  if (!success) return
  successMsg.value = true
  setTimeout(() => (successMsg.value = false), 3000)
}

const previewCard = computed(() => {
  if (!previewMovie.value || !previewMovieId.value) {
    return {
      ...placeholderReview.value,
      movieId: 0,
      posterUrl: '',
      genresText: '',
      user_rating: null,
      user_thoughts: null,
    }
  }

  const base = previewMovie.value

  return {
    ...base,
    movieId: previewMovieId.value,
    posterUrl: base.poster_path ? (tmdbImageURL(base.poster_path) ?? '') : '',
    genresText: base.genres ? Object.values(base.genres).join(', ') : '',
    user_rating: previewUserRating.value ?? 0,
    user_thoughts: previewUserThoughts.value ?? '',
  }
})
</script>

<template>
  <div class="form-page form-center">
    <div class="form-container">
      <h1 class="title">Add a Review</h1>

      <ReviewCard :review="previewCard" />

      <FormCard @update:movie="handleMovie" @submit="handleSubmit" @preview="handlePreview" />

      <transition name="fade">
        <span v-if="successMsg">Submitted Successfully!</span>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.form-center {
  display: flex;
  height: 100vh;
  justify-content: center;
}

.form-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 5%;
  margin-top: 5vh;
  gap: 20px;
}

h1.title {
  color: white;
  margin-bottom: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
