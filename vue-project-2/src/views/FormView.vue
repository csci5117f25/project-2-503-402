<script setup lang="ts">
import MovieSearch from '@/components/MovieSearch.vue';
import { Star } from 'lucide-vue-next';
import { useCurrentUser } from 'vuefire';
import { ref } from 'vue'
import { getCachedMovies, getMovie } from '@/movies';


// Hold movie ID from movie search component
const movieId = ref(undefined)
// const movieUpdate = async (id: number) => {
  


// }

// Submit handler
async function handleSubmit() {

  // Ensure a user is logged in
  const userID = useCurrentUser().value?.uid;
  if(!userID) {
    throw new Error("User needs to be logged in for form submission")
  }

  if(!movieId.value) {
    throw new Error('Invalid movie selected')
  }

  const movie = await getMovie(movieId.value);
  console.log(movie)
  console.log(movie.cached_at)

  // // Get formdata and tags
  // const formData = new FormData(<HTMLFormElement>event.target)
  // const tagContainer = <HTMLDivElement>document.querySelector("#genre-container");
  // const tagNodes = tagContainer.querySelectorAll("span.tag.is-success");
  // const genres = Array.from(tagNodes).map(span => span.innerHTML).sort();

  // addReview({
  //     title: <string>formData.get("title"),
  //     director: <string>formData.get("director"),
  //     description: <string>formData.get("description"),
  //     genres: genres,
  //     rating: <number>(formData.get("rating") ? formData.get("rating"): 0),
  //     comment: <string>formData.get("comment")
  //   },
  //   userID
  // )
}

async function testFunc() {
  console.log(await getCachedMovies(['694', '8859']))
}

</script>

<template>

  <form class="form-container" @submit.prevent="handleSubmit">
    <div class="box">

      <MovieSearch v-model:id="movieId"></MovieSearch>

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

  <button class="button" @click="testFunc()">Test</button>
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
