<script setup lang="ts">
import { addReview, genres, } from '@/movies';
import { Clapperboard, Clock, MessageCircle, Star } from 'lucide-vue-next';
import { useCurrentUser } from 'vuefire';


// TODO add genres to movie data
function tagHandler(event: Event) {
  if(!event.target || !(event.target instanceof HTMLSpanElement))
    return;
  console.log(event.target.innerHTML)

  if(event.target.classList.contains('is-success')) {
    event.target.classList.remove('is-success');
  } else {
    event.target.classList.add('is-success');
  }
}

// Submit handler
async function handleSubmit(event: SubmitEvent) {

  // Ensure a user is logged in
  const userID = useCurrentUser().value?.uid;
  if(!userID)
    return;

  // Get formdata and tags
  const formData = new FormData(<HTMLFormElement>event.target)
  const tagContainer = <HTMLDivElement>document.querySelector("#genre-container");
  const tagNodes = tagContainer.querySelectorAll("span.tag.is-success");
  const genres = Array.from(tagNodes).map(span => span.innerHTML).sort();

  addReview({
      title: <string>formData.get("title"),
      description: <string>formData.get("description"),
      genres: genres,
      rating: <number>(formData.get("rating") ? formData.get("rating"): 0),
      comment: <string>formData.get("comment")
    },
    userID
  )
}

</script>

<template>

  <form class="form-container" @submit.prevent="handleSubmit">
    <div class="box">
      <label class="label">Movie Title</label>
      <div class="control has-icons-left">
        <input class="input" name="title" required type="text">
        <span class="icon is-small is-left">
          <Clapperboard />
        </span>
      </div>

      <br>
      <label class="label">Release Year</label>
      <div class="control has-icons-left">
        <input class="input" name="release-year" type="number">
        <span class="icon is-small is-left">
          <Clock />
        </span>
      </div>

      <!-- TODO add genre  -->
      <br>
      <label class="label">Genres</label>
      <div id="genre-container" class="control tag-container" @click="tagHandler">
        <span v-for="genre in genres" :key="'genre-'+ genre" class="tag is-medium">{{ genre }}</span>
      </div>
    </div>

    <div class="box">
      <label class="label">Movie Rating (1-10)</label>
      <div class="control has-icons-left">
        <input class="input" name="rating" required type="number" step="1" min="1" max="10">
        <span class="icon is-small is-left">
          <Star />
        </span>
      </div>

      <label class="label">Personal Comment</label>
      <div class="control has-icons-left">
        <textarea class="textarea" name="comment" rows="4"></textarea>
        <span class="icon is-small is-left">
          <MessageCircle />
        </span>
      </div>
    </div>

    <button class="button" type="submit">Submit</button>
  </form>
</template>


<style scoped>
@import "https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css";

form.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10vh auto;
  width: 70%;
}

div.box {
  width: 100%;
}

div.tag-container {
  display: flex;
  gap: 2vh;
  width: 80%;
  margin: 0 auto;
  justify-content: center;
  flex-wrap: wrap;
}

</style>
