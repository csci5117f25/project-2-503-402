<script setup lang="ts">
import MovieCarousel from '@/components/Report/MovieCarousel.vue';
// import MovieCompare from '@/components/Report/MovieCompare.vue';
import { tmdbImageURL } from '@/movies';
import { getUserSimilarities, type ReviewDiff } from '@/similarities'
import { ref } from 'vue';


interface CompareItem {
  topImage: string,
  bottomImage: string,
  topRating: number,
  bottomRating: number,
  diff: number,
  sim: number
}

const maxDiff = ref<CompareItem[]>([])
const minDiff = ref<CompareItem[]>([])
const zeroDiff = ref<CompareItem[]>([])

// lucas1 LZbZsaWfRfO2q69nOSXFL6pW9PH2
// lucas2 8MKabnDEswMX2nqapeiQsqRSCRm1
// else wajaclA5vMNdTiPR3Zq0FL8lWv82

getUserSimilarities('LZbZsaWfRfO2q69nOSXFL6pW9PH2', '8MKabnDEswMX2nqapeiQsqRSCRm1', 10)
.then(simReport => {

  const mapFunc = (diff: ReviewDiff) => {
    return {
      topImage: tmdbImageURL(diff.current.poster_path) ?? '',
      bottomImage: tmdbImageURL(diff.compare.poster_path) ?? '',
      topRating: diff.current.rating,
      bottomRating: diff.compare.rating,
      diff: diff.diff,
      sim: diff.sim
    }
  }
  maxDiff.value = simReport.max.map(mapFunc);
  minDiff.value = simReport.min.map(mapFunc);
  zeroDiff.value = simReport.same.map(mapFunc);

})
</script>

<template>
  <label class="label">Min difference</label>
  <MovieCarousel :list="minDiff"></MovieCarousel>
  <label class="label">Max difference</label>
  <MovieCarousel :list="maxDiff"></MovieCarousel>
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

