<script setup lang="ts">
import MovieCompare from '@/components/Report/MovieCompare.vue';
import { tmdbImageURL } from '@/movies';
import { getUserSimilarities } from '@/similarities'
import { BCarouselList } from 'buefy'
// import 'buefy/dist/buefy.css'
import { ref, watch } from 'vue';


interface CompareItem {
  topImage: string,
  bottomImage: string,
  topRating: number,
  bottomRating: number,
  diff: number
}


const active = ref(0)

const maxDiff = ref<CompareItem[]>([])
const minDiff = ref<CompareItem[]>([])
const zeroDiff = ref<CompareItem[]>([])

getUserSimilarities('LZbZsaWfRfO2q69nOSXFL6pW9PH2', 'wajaclA5vMNdTiPR3Zq0FL8lWv82', 10)
.then(simReport => {
  console.log(simReport)
  for(const diff of simReport.diff.max) {
    maxDiff.value.push({
      topImage: tmdbImageURL(diff.current.poster_path) ?? '',
      bottomImage: tmdbImageURL(diff.compare.poster_path) ?? '',
      topRating: diff.current.rating,
      bottomRating: diff.compare.rating,
      diff: diff.diff
    })
  }
  for(const diff of simReport.diff.min) {
    minDiff.value.push({
      topImage: tmdbImageURL(diff.current.poster_path) ?? '',
      bottomImage: tmdbImageURL(diff.compare.poster_path) ?? '',
      topRating: diff.current.rating,
      bottomRating: diff.compare.rating,
      diff: diff.diff
    })
  }
  for(const diff of simReport.diff.zero) {
    zeroDiff.value.push({
      topImage: tmdbImageURL(diff.current.poster_path) ?? '',
      bottomImage: tmdbImageURL(diff.compare.poster_path) ?? '',
      topRating: diff.current.rating,
      bottomRating: diff.compare.rating,
      diff: diff.diff
    })
  }
})


</script>

<template>


  <div class="carousel-container">
    <h1 class="label"></h1>
    <BCarouselList
      v-model="active"
      :data="maxDiff"
      :items-to-show="5"
      :items-to-list="3"
      :arrow="true"
      :arrow-hover="true"
    >
      <template #item="compare">
        <MovieCompare
          :topImage="compare.topImage"
          :bottomImage="compare.bottomImage"
          :topRating="compare.topRating"
          :bottomRating="compare.bottomRating"
          :diff="compare.diff"
        />
      </template>
    </BCarouselList>
  </div>
</template>

<style scoped>

  .poster-img {
    margin: 5px;
    height: 12.5vh;
    border: 2px solid white;
    border-radius: 5px;
  }

  .label {
    margin-bottom: 0 !important;
  }

  .center-div {
    display: flex;
    background-color: white;
    width: 90%;
    height: 90%;
    min-height: 20vh;
    margin: auto;
    padding: 100px;
  }

  .compare-slot {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: rgba(30, 30, 30, 0.8);
    min-height: 30vh;
    margin: auto;
    padding: 10px;
    border-radius: 10px;
  }

  .carousel-container {
    width: 55vh;
  }


</style>

