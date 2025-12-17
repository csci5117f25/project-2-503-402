<script setup lang="ts">
import MovieSearch from '@/components/MovieSearch.vue'
import { useCurrentUser } from 'vuefire'
import { computed, ref, onMounted, defineComponent, watch } from 'vue'
import { addUserReview, getMovie, getUserMovieReview, type MovieData, type UserReview, } from '@/movies'
import { useRoute } from 'vue-router'
import vue3StarRatings from "vue3-star-ratings"
import { Star } from 'lucide-vue-next'

defineComponent({
  components: {
    vue3StarRatings
  }
})

const emit = defineEmits([
  'update:movie',
  'submit'
])

const route = useRoute()

// Hold movie ID from movie search component
const movieId = ref<number | undefined>(undefined)
const currentUser = useCurrentUser()
const userId = computed(() => (currentUser.value?.uid ? currentUser.value.uid : null))

const rating = ref<number | undefined>(undefined)
const comment = ref<string>('')

// Auto-populate from route query params
onMounted(async () => {
  if (route.query.movieId) {
    const id = parseInt(route.query.movieId as string)
    movieId.value = id
  }
  if (route.query.rating) {
    rating.value = parseInt(route.query.rating as string)
  }
  if (route.query.comment) {
    comment.value = route.query.comment as string
  }
})

// Round ratings by half star
watch(rating, () => {
  if(!rating.value || rating.value % 0.5 === 0) {
    return
  }
  if(rating.value % 1 < 0.5) {
    rating.value = Math.floor(rating.value) + 0.5
  }
  else {
    rating.value = Math.ceil(rating.value)
  }
})

// TODO enforce movie exists
watch(movieId, async () => {
  if (!movieId.value) {
    rating.value = 0
    comment.value = ''
    emit('update:movie', null)
    return
  }
  try {
    if(userId.value) {
      const userReview = await getUserMovieReview(userId.value, movieId.value)
      if(userReview) {
        rating.value = userReview.rating;
        comment.value = userReview.comment;
        emit('update:movie', movieId.value, userReview as MovieData)
        return
      }
    }
    const data = await getMovie(movieId.value)
    if(data)
      emit('update:movie', movieId.value, data)
  } catch (err) {
    console.log(err)
    alert('Invalid movie selected!')
  }
})

// Submit handler
async function handleSubmit(event: SubmitEvent) {
  if (!userId.value) {
    emit('submit', false)
    throw new Error('User needs to be logged in for form submission')
  }
  if (!movieId.value) {
    emit('submit', false)
    throw new Error('Invalid movie selected')
  }
  if (!rating.value) {
    emit('submit', false)
    throw new Error('You must rate this movie!')
  }

  const review: UserReview = {
    rating: rating.value,
    comment: comment.value,
    draft: (<HTMLButtonElement>event.submitter).value === 'draft',
  }
  await addUserReview(userId.value, movieId.value, review)
  console.log(`Submitted user review, user ${userId.value}`)

  movieId.value = undefined
  rating.value = undefined
  comment.value = ''
  emit('submit', true)
}
</script>

<template>
  <div class="form-page-container">
    <div class="review-card">
      <form @submit.prevent="handleSubmit">
        <MovieSearch v-model:id="movieId"></MovieSearch>

        <div class="ratings-container">
          <label class="label bulma-label">Your Rating (0-10)</label>

          <div class="columns">
            <!-- Column for the numeric input -->
            <div class="column">
              <div class="control has-icons-left">
                <input
                  v-model="rating"
                  class="input bulma-input"
                  name="rating"
                  required
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                />
                <span class="icon is-small is-left">
                  <Star color="black" />
                </span>
              </div>
            </div>

            <!-- Column for the star rating component -->
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

        <div class="field is-grouped isgrouped-center" style="margin-top: 20px">
          <p class="control">
            <button class="button" type="submit" value="post">Submit</button>
          </p>
          <p class="control">
            <button class="button" type="submit" value="draft">Save as Draft</button>
          </p>
          <p class="control">
            <button class="button" type="reset" @click="movieId = undefined" value="reset">
              Clear
            </button>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped src="@/styles/reviewCard.css"></style>
