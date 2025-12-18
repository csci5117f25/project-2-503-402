<script setup lang="ts">
import FormCard from '@/components/FormCard.vue'
import ReviewCard from '@/components/ReviewCard.vue'
import { tmdbImageURL, type MovieData } from '@/movies'
import { computed, ref } from 'vue'

const formRef = ref<InstanceType<typeof FormCard> | null>(null)

const previewMovie = ref<MovieData | null>(null)
const previewMovieId = ref<number | null>(null)
const previewRating = ref<number | null>(null)
const previewThoughts = ref<string | null>(null)

const successMsg = ref(false)
const today = new Date()

const placeholderCard = computed(() => ({
  movieId: 0,
  title: 'Review Preview',
  tagline: 'Click Preview to see how your card will look.',
  release_date: today.toLocaleDateString(),
  runtime: null,
  rating_avg: 0,
  rating_count: 0,
  budget: null,
  genresText: '',
  posterUrl: '',
  user_rating: null,
  user_thoughts: null,
  rewatch: false,
}))

const hasPreview = computed(() => !!previewMovie.value && previewMovieId.value !== null)

const previewCardData = computed(() => {
  if (!hasPreview.value || !previewMovie.value || previewMovieId.value === null) return null

  const m = previewMovie.value

  return {
    movieId: previewMovieId.value,
    title: m.title ?? 'Untitled',
    tagline: m.tagline ?? null,
    release_date: m.release_date ?? today.toLocaleDateString(),
    runtime: m.runtime ?? null,
    rating_avg: m.rating_avg ?? 0,
    rating_count: m.rating_count ?? 0,
    budget: m.budget ?? null,
    genresText: m.genres ? Object.values(m.genres).join(', ') : '',
    posterUrl: m.poster_path ? (tmdbImageURL(m.poster_path) ?? '') : '',

    user_rating: previewRating.value,
    user_thoughts: previewThoughts.value,

    rewatch: false,
  }
})

function clearPreview() {
  previewMovie.value = null
  previewMovieId.value = null
  previewRating.value = null
  previewThoughts.value = null
}

function handlePreview(payload: {
  movieId: number | null
  movie: MovieData | null
  rating: number | null
  comment: string | null
}) {
  if (!payload.movieId || !payload.movie) {
    clearPreview()
    return
  }

  previewMovieId.value = payload.movieId
  previewMovie.value = payload.movie
  previewRating.value = payload.rating
  previewThoughts.value = payload.comment
}

function handleCleared() {
  clearPreview()
}

function handleSubmit(success: boolean) {
  if (!success) return

  successMsg.value = true
  setTimeout(() => (successMsg.value = false), 2500)

  formRef.value?.resetForm()
  clearPreview()
}
</script>

<template>
  <div class="form-page form-center">
    <div class="form-container">
      <h1 class="title">Add a Review</h1>

      <ReviewCard
        v-if="previewCardData"
        :review="previewCardData"
        :show-actions="false"
        :show-facts="false"
      />

      <ReviewCard v-else :review="placeholderCard" :show-actions="false" :show-facts="false" />

      <FormCard
        ref="formRef"
        @preview="handlePreview"
        @cleared="handleCleared"
        @submit="handleSubmit"
      />

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
