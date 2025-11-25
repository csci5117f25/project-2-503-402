<script setup>
import { ref } from 'vue'
import { useCollection, useCurrentUser } from 'vuefire';
import { collection, setDoc, doc, Timestamp, addDoc } from 'firebase/firestore';

import { db } from '../firebase_conf'

const defautlForm = () => ({
  title: '', rating: 0,
  date: "",
  watchedWhere: "",
  commentary: ""
})

// Firestore data converter
const MovieConverter = {
  toFirestore: (movie) => {
    return {
      title: movie.title,
      date: movie.date,
      watchedWhere: movie.watchedWhere,
      commentary: movie.commentary
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      title: data.title,
      rating: data.rating,
      date: data.date,
      watchedWhere: data.watchedWhere ?? "",
      commentary: data.commentary ?? ""
    };
  }
};


const movieData = ref([defautlForm])

const formInput = ref('')
const error = ref(null)

async function handle_submit() {
  try {
    const user = useCurrentUser()
    if (user.value != null) {
      await addDoc(collection(db, "users", user.value.uid, "reviews"), {...movieData.value})
      movieData.value = defautlForm
      formInput.value = "added to db"
    }
  } catch(e) {
    console.log("error adding new movie data ", e)
    error.value = e
  }
}
</script>


<template>
  <div>{{ formInput }}</div>
  <div class="movie-form">
    <form @submit.prevent="handle_submit">
    <div class="form-row">
      <label>Title</label>
      <input v-model="movieData.title" type="text" required placeholder="movie name"/>
    </div>
    <div class="form-row">
      <label>Rating</label>
      <input v-model="movieData.rating" type="number" min="0" max="10" required placeholder="rating 0-10" />
    </div>
    <div class="form-row">
      <label>Date Watched</label>
      <input v-model="movieData.date" type="date" required />
    </div>
    <div class="form-row">
      <label>Watched Where</label>
      <input v-model="movieData.watchedWhere" type="text" placeholder="Theater" required />
    </div>
    <div class="form-row">
      <label>Commentary</label>
      <textarea
        v-model="movieData.commentary"
        placeholder="Your thoughts on the movie..."
        rows="4"
      ></textarea>
    </div>
    <button type="submit">Save Movie</button>
  </form>
  </div>

</template>


<style scoped>
.movie-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 450px;
  margin: 1rem 2rem;
  padding: 0.6rem;
}
.form-row {
  display: flex;
  padding: 0.6rem;
  flex-direction: column;
}
label {
  font-weight: 600;
  margin-bottom: 4px;
}
input,
textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  padding: 10px;
  display: flex;

  border: none;
  background: #4f46e5;
  color: white;
  border-radius: 6px;
  cursor: pointer;

  display: block;         /* allows margin auto */
  margin: 0 auto;
}
button:hover {
  background: #4338ca;
}
</style>
