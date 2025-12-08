<script setup lang="ts">
import { Clapperboard } from 'lucide-vue-next';
import { tmdb } from '../movies';
import { ref } from 'vue';
import type { MovieResultItem } from '@lorenzopant/tmdb';

defineProps({
  id: {
    type: Number,
    default: undefined
  },
  inputTitle: {
    type: String,
    default: 'Movie Title',
  }
})
const emit = defineEmits([
  'update:id'
])

// Debounce search entries
const searchText = ref('');
const searchResults = ref<MovieResultItem[]>([]);
let searchTimeout: number | null = null;
function searchBar() {
  if(searchTimeout)
    return;

  // Perform API search on string on timeout (prevent spam)
  searchTimeout = setTimeout(async () => {
    const result = await tmdb.search.movies({
      query: searchText.value
    })
    searchResults.value = result.results;
    clearTimeout(searchTimeout!)
    searchTimeout = null
  }, 1500)
}

function handleDropdown(id: number, title: string) {
  searchText.value = title;
  searchResults.value = [];
  emit('update:id', id)
}

function formatTitle(movie: MovieResultItem) {
  const year = new Date(movie.release_date)
  if(!isNaN(year.getFullYear()))
    return `${movie.title} (${year.getFullYear()})`
  return `${movie.title}`
}
</script>

<template>

  <div class="dropdown is-active">
    <div class="dropdown-trigger is-fullwidth">
      <label class="label">{{ inputTitle }}</label>
      <div class="control is-fullwidth has-icons-left">
        <input v-model.trim="searchText" @input="searchBar" class="input" name="title" required type="text">
        <span class="icon is-small is-left"><Clapperboard /></span>
      </div>
    </div>
    <div v-if="searchResults.length > 0" class="dropdown-menu" id="dropdown-menu" role="menu">
      <div class="dropdown-content">
        <div
          v-for="movie in searchResults"
          :key="movie.id"
          @click="handleDropdown(movie.id, formatTitle(movie))"
          class="dropdown-content"
        >
          {{ formatTitle(movie)}}
        </div>
      </div>
    </div>
  </div>

</template>

<style scoped>

.dropdown {
  width: 100%;
}

.dropdown-trigger {
  width: 100%;
}

</style>