<script setup lang="ts">
import MovieSearch from '@/components/MovieSearch.vue'
import { useCurrentUser } from 'vuefire'
import { computed, ref, onMounted, watch } from 'vue'
import {
  addUserReview,
  getMovie,
  getUserMovieReview,
  type MovieData,
  type UserReview,
} from '@/movies'
import { useRoute } from 'vue-router'
import vue3StarRatings from 'vue3-star-ratings'
import { Star } from 'lucide-vue-next'

const emit = defineEmits<{
  (
    e: 'preview',
    payload: {
      movieId: number | null
      movie: MovieData | null
      rating: number | null
      comment: string | null
    },
  ): void
  (e: 'cleared'): void
  (e: 'submit', success: boolean): void
}>()

const route = useRoute()

const movieId = ref<number | undefined>(undefined)
const rating = ref<number | undefined>(undefined)
const comment = ref<string>('')

const currentUser = useCurrentUser()
const userId = computed(() => (currentUser.value?.uid ? currentUser.value.uid : null))

const selectedMovie = ref<MovieData | null>(null)

function resetForm() {
  movieId.value = undefined
  rating.value = undefined
  comment.value = ''
  selectedMovie.value = null

  emit('cleared')
  emit('preview', { movieId: null, movie: null, rating: null, comment: null })
}

defineExpose({ resetForm })

onMounted(async () => {
  if (route.query.movieId) movieId.value = parseInt(route.query.movieId as string)
  if (route.query.rating) rating.value = parseFloat(route.query.rating as string)
  if (route.query.comment) comment.value = route.query.comment as string
})

watch(rating, () => {
  if (rating.value === undefined || rating.value === null) return
  const v = rating.value
  const snapped = Math.round(v * 2) / 2
  if (snapped !== v) rating.value = snapped
})

watch(movieId, async () => {
  if (!movieId.value) {
    rating.value = undefined
    comment.value = ''
    selectedMovie.value = null
    emit('preview', { movieId: null, movie: null, rating: null, comment: null })
    return
  }

  try {
    if (userId.value) {
      const userReview = await getUserMovieReview(userId.value, movieId.value)
      if (userReview) {
        rating.value = userReview.rating
        comment.value = userReview.comment
        selectedMovie.value = userReview as MovieData
        return
      }
    }

    const data = await getMovie(movieId.value)
    selectedMovie.value = data ?? null
  } catch (err) {
    console.log(err)
    alert('Invalid movie selected!')
    selectedMovie.value = null
  }
})

function handlePreviewClick() {
  if (!movieId.value || !selectedMovie.value) {
    emit('preview', { movieId: null, movie: null, rating: null, comment: null })
    return
  }

  emit('preview', {
    movieId: movieId.value,
    movie: selectedMovie.value,
    rating: rating.value ?? null,
    comment: comment.value?.trim() ? comment.value : null,
  })
}

async function handleSubmit(event: SubmitEvent) {
  if (!userId.value) {
    emit('submit', false)
    throw new Error('User needs to be logged in for form submission')
  }
  if (!movieId.value) {
    emit('submit', false)
    throw new Error('Invalid movie selected')
  }
  if (rating.value === undefined || rating.value === null) {
    emit('submit', false)
    throw new Error('You must rate this movie!')
  }

  const review: UserReview = {
    rating: rating.value,
    comment: comment.value,
    draft: (event.submitter as HTMLButtonElement).value === 'draft',
  }

  await addUserReview(userId.value, movieId.value, review)

  resetForm()
  emit('submit', true)
}

function handleClearClick() {
  resetForm()
}
</script>

<template>
  <div class="form-page-container">
    <div class="review-card">
      <form @submit.prevent="handleSubmit">
        <MovieSearch v-model:id="movieId" />

        <div class="ratings-container">
          <label class="label bulma-label">Your Rating (0-10)</label>

          <div class="columns">
            <div class="column">
              <div class="control has-icons-left">
                <input
                  v-model.number="rating"
                  class="input bulma-input"
                  name="rating"
                  required
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                />
                <span class="icon is-small is-left">
                  <Star color="#e5e7eb" />
                </span>
              </div>
            </div>

            <div class="column is-flex is-justify-content-center">
              <vue3StarRatings
                v-model="rating"
                :star-size="30"
                :number-of-stars="10"
                :disable-click="false"
                name="rating"
              />
            </div>
          </div>
        </div>

        <label class="label bulma-label">Personal Thoughts</label>
        <div class="control">
          <textarea
            class="textarea bulma-input"
            name="comment"
            rows="4"
            maxlength="2000"
            placeholder="What made you remember this movie?"
            v-model="comment"
          ></textarea>
        </div>

        <div class="field is-grouped isgrouped-center is-grouped-multiline mt-5" style="margin-top: 20px; gap: 10px">
          <p class="control">
            <button class="button" type="button" @click="handlePreviewClick">Preview</button>
          </p>

          <p class="control">
            <button class="button" type="submit" value="post">Submit</button>
          </p>

          <p class="control">
            <button class="button" type="submit" value="draft">Save as Draft</button>
          </p>

          <p class="control">
            <button class="button" type="button" @click="handleClearClick">Clear</button>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped src="@/styles/reviewCard.css"></style>

<style scoped>
.bulma-input,
.input.bulma-input,
.textarea.bulma-input {
  background: rgba(15, 23, 42, 0.55) !important;
  color: #f3f4f6 !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  box-shadow: none !important;
}

.bulma-input::placeholder,
.input.bulma-input::placeholder,
.textarea.bulma-input::placeholder {
  color: rgba(243, 244, 246, 0.45) !important;
}

.bulma-input:focus,
.input.bulma-input:focus,
.textarea.bulma-input:focus {
  outline: none !important;
  border-color: rgba(239, 68, 68, 0.6) !important; /* red focus */
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18) !important;
}

.control.has-icons-left .icon {
  color: #e5e7eb !important;
}

.form-page-container :deep(input[type='text']),
.form-page-container :deep(input[type='search']) {
  background: rgba(15, 23, 42, 0.55) !important;
  color: #f3f4f6 !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  box-shadow: none !important;
}

.form-page-container :deep(input[type='text']::placeholder),
.form-page-container :deep(input[type='search']::placeholder) {
  color: rgba(243, 244, 246, 0.45) !important;
}

.form-page-container :deep(input[type='text']:focus),
.form-page-container :deep(input[type='search']:focus) {
  outline: none !important;
  border-color: rgba(239, 68, 68, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18) !important;
}
</style>
