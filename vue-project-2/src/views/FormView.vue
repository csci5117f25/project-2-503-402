<script setup lang="ts">
import MovieSearch from '@/components/MovieSearch.vue';
import { Star } from 'lucide-vue-next';
import { useCurrentUser } from 'vuefire';
import { computed, ref } from 'vue'
import { addUserReview, getMovie } from '@/movies';


// Hold movie ID from movie search component
const movieId = ref(undefined)
const currentUser = useCurrentUser();
const userId = computed(() => currentUser.value?.uid ? currentUser.value.uid : null)

// TODO enforce movie exists
async function movieUpdate (id: number) {
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

  // Ensure a user is logged in
  if(!userId.value) {
    throw new Error("User needs to be logged in for form submission")
  }

  if(!movieId.value) {
    throw new Error('Invalid movie selected')
  }

  const formData = new FormData(<HTMLFormElement>event.target);
  await addUserReview(userId.value, movieId.value, {
    rating: parseInt(formData.get('rating') as string),
    comment: formData.get('comment') as string
  });
  console.log(`Submitted user review, user ${userId.value}`)
}
</script>

<template>

  <form class="form-container" @submit.prevent="handleSubmit">
    <div class="box">

      <MovieSearch v-model:id="movieId" @update:id="movieUpdate($event)"></MovieSearch>

      <label class="label">Your Rating (1-10)</label>
      <div class="control has-icons-left">
        <input class="input" name="rating" required type="number" step="1" min="1" max="10">
        <span class="icon is-small is-left">
          <Star />
        </span>
      </div>

      <label class="label">Personal Thoughts</label>
      <div class="control">
        <textarea class="textarea" name="comment" rows="4" maxlength="255" placeholder="What made you remember this movie?"></textarea>
      </div>
    </div>

    <button class="button" type="submit">Submit</button>
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
