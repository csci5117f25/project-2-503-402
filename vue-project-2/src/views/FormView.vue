<script setup lang="ts">
import FormCard from '@/components/FormCard.vue'
import ReviewCard from '@/components/ReviewCard.vue';
import { tmdbImageURL, type UserMovieReview } from '@/movies';
import { ref } from 'vue';

const review = ref<UserMovieReview | undefined>(undefined)
const inputId = ref<number | undefined>(undefined)
const successMsg = ref<boolean>(false)
const today = new Date()


const placeholderReview = ref<UserMovieReview>({
  title: "Review Preview",
  release_date: today.toLocaleDateString(),
  tagline: "This review does not exist... YET!",
  runtime: 0,
  budget: 0,
  genres: {},
  rating_avg: 0,
  rating_count: 0,
  cached_at: today,
  rating: 0,
  comment: ''
} as UserMovieReview)


function handleMovie(id: number, data: UserMovieReview) {
  if(data && id) {
    review.value = data
    inputId.value = id
  }
  else {
    review.value = undefined
  }
}

function handleSubmit(success: boolean) {
  if(!success) {
    return
  }
  successMsg.value = true;
  setTimeout(() => {
    console.log('SUCCESS')
    successMsg.value = false;
  }, 3000)
}

</script>

<template>
  <div class="form-page form-center">
    <div class="form-container">
      <h1 class="title">Add a Review</h1>
      <ReviewCard v-if="review && inputId"
        key="preview-real"
        :review="{
          ...review,
          movieId: inputId,
          posterUrl: tmdbImageURL(review.poster_path) ?? '',
          genresText: Object.values(review.genres).join(', ') ?? ''
        }"
      ></ReviewCard>

      <ReviewCard v-else
        key="preview"
        :review="{
          ...placeholderReview,
          movieId: 0,
          posterUrl: '',
          genresText: ''
        }"
      ></ReviewCard>

      <FormCard
        @update:movie="handleMovie"
        @submit="handleSubmit"
      ></FormCard>

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

  /* For success message */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

</style>
