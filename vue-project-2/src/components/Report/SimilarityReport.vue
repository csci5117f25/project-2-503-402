<script setup lang="ts">
import MovieCarousel from '@/components/Report/MovieCarousel.vue';
// import MovieCompare from '@/components/Report/MovieCompare.vue';
import { tmdbImageURL } from '@/movies';
import { getUserSimilarities, type ReviewDiff } from '@/similarities'
import { ref } from 'vue';

const props = defineProps({
  current: {
    type: String,
    required: true
  },
  compare: {
    type: String,
    required: true
  },
  maxListings: {
    type: Number,
    default: 10
  }
})

interface CompareItem {
  topImage: string,
  bottomImage: string,
  topRating: number,
  bottomRating: number,
  diff: number,
  sim: number
}

interface SimStats {
  overlapPct: number,
  grade: string,
  avg: number,
  absAvg: number,
  sameAvg: number,
  diffAvg: number
}

const maxDiff = ref<CompareItem[]>()
const minDiff = ref<CompareItem[]>()
// const zeroDiff = ref<CompareItem[]>()
const stats = ref<SimStats>()
const ready = ref<boolean>(false)

getUserSimilarities(props.current, props.compare, props.maxListings)
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
  stats.value = simReport as SimStats;
  maxDiff.value = simReport.max.map(mapFunc);
  minDiff.value = simReport.min.map(mapFunc);
  // zeroDiff.value = simReport.same.map(mapFunc);
  ready.value = true;
})
</script>

<template>
  <transition name="expand">
    <div class="report-body" v-if="ready">

      <div v-if="stats" class="report-card">

        <div class="columns is-vcentered">

          <!-- Left-->
          <div class="column is-one-third has-text-centered">
            <p class="title is-4">Similarity Grade:</p>
            <p class="title is-1 has-text-weight-bold has-text-success">
              {{ stats.grade }}
            </p>
          </div>

          <!-- Right -->
          <div class="column is-two-thirds">
            <div class="columns is-multiline">

              <!-- First row -->
              <div class="column is-half">
                <p class="label">Overlap Percentage:</p>
                <p class="subtitle is-6">{{ (stats.overlapPct * 100).toFixed(0) }}%</p>
              </div>

              <div class="column is-half">
                <p class="label">Absolute Difference:</p>
                <p class="subtitle is-6">{{ stats.absAvg.toFixed(2) }}</p>
              </div>

              <div class="column is-half">
                <p class="label">Average Difference:</p>
                <p class="subtitle is-6">{{ stats.avg.toFixed(2) }}</p>
              </div>

              <!-- <div class="column is-half">
                <p class="label">Similar Difference:</p>
                <p class="subtitle is-6">{{ stats.diffAvg.toFixed(2) }}</p>
              </div> -->
              <!-- Add more fields here if needed -->
            </div>
          </div>
        </div>
      </div>

      <br>

      <div v-if="minDiff">
        <label class="title">Similar Movies You Rated Higher</label>
        <hr>
        <MovieCarousel :list="minDiff"></MovieCarousel>
      </div>

      <br>

      <div v-if="maxDiff">
        <label class="title">Similar Movies They Rated Higher</label>
        <hr>
        <MovieCarousel :list="maxDiff"></MovieCarousel>
      </div>
    </div>
  </transition>
</template>

<style scoped>

  .report-body {
    padding: 20px;
    background: rgba(30, 30, 30, 0.88);
    max-width: 920px;
  }

  .report-card {
    background: rgba(30, 30, 30, 0.88);
    border-radius: 1.1rem;
    padding: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(18px);
    max-width: 920px;
  }

  hr {
    background-color: white;
    margin: 5px;
  }

  /* Fade in  */
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.4s ease;
  }
  .expand-enter-from,
  .expand-leave-to {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
  }
  .expand-enter-to,
  .expand-leave-from {
    max-height: 500px; /* adjust to content */
    opacity: 1;
  }

</style>
