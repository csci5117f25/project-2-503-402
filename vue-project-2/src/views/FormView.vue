<script setup lang="ts">
import MovieSearch from '@/components/MovieSearch.vue';
import { Star } from 'lucide-vue-next';
import { useCurrentUser } from 'vuefire';
import { computed, ref, onMounted } from 'vue'
import { addUserReview, getMovie, type UserReview } from '@/movies';
import { useRoute } from 'vue-router';

const route = useRoute();

// Hold movie ID from movie search component
const movieId = ref<number | undefined>(undefined)
const currentUser = useCurrentUser();
const userId = computed(() => currentUser.value?.uid ? currentUser.value.uid : null)

const rating = ref<number | undefined>(undefined)
const comment = ref<string>('')

// Auto-populate from route query params
onMounted(async () => {
  if (route.query.movieId) {
    const id = parseInt(route.query.movieId as string)
    movieId.value = id
    await movieUpdate(id)
  }
  if (route.query.rating) {
    rating.value = parseInt(route.query.rating as string)
  }
  if (route.query.comment) {
    comment.value = route.query.comment as string
  }
})

// TODO enforce movie exists
async function movieUpdate (id: number) {
  if(!id)
    return
  try{
    await getMovie(id)
    console.log(`Movie id: ${id}`)
  }
  catch(err) {
    console.log(err)
    alert('Invalid movie selected!')
  }
}

// Submit handler
async function handleSubmit(event: SubmitEvent) {
  if(!userId.value) {
    throw new Error("User needs to be logged in for form submission")
  }
  if(!movieId.value) {
    throw new Error('Invalid movie selected')
  }

  const formData = new FormData(<HTMLFormElement>event.target);
  const review: UserReview = {
    rating: parseInt(formData.get('rating') as string),
    comment: formData.get('comment') as string,
    draft: (<HTMLButtonElement>event.submitter).value === "draft"
  }

  await addUserReview(userId.value, movieId.value, review);
  console.log(`Submitted user review, user ${userId.value}`)
}
</script>

<template>

  <form class="form-container" @submit.prevent="handleSubmit">
    <div class="box">

      <MovieSearch v-model:id="movieId" @update:id="movieUpdate($event)"></MovieSearch>

      <label class="label">Your Rating (1-10)</label>
      <div class="control has-icons-left">
        <input
          class="input"
          name="rating"
          required
          type="number"
          step="1"
          min="1"
          max="10"
          v-model="rating"
        >
        <span class="icon is-small is-left">
          <Star />
        </span>
      </div>

      <label class="label">Personal Thoughts</label>
      <div class="control">
        <textarea
          class="textarea"
          name="comment"
          rows="4"
          maxlength="255"
          placeholder="What made you remember this movie?"
          v-model="comment"
        ></textarea>
      </div>
    </div>

    <button class="button" type="submit" value="post">Submit</button>
    <button class="button" type="submit" value="draft">Save Draft</button>
  </form>

</template>


<style scoped>

form.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10vh auto;
  width: 80%;
}

div.box {
  width: 100%;
}

label {
  margin-top: 2vh;
}

</style>