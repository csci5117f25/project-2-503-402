<script setup lang="ts">
import MovieCompare from '@/components/Report/MovieCompare.vue';
import { BCarouselList } from 'buefy'


interface CompareItem {
  topImage: string,
  bottomImage: string,
  topRating: number,
  bottomRating: number,
  diff: number,
  sim: number
}

defineProps({
  list: {
    type: Array<CompareItem>,
    required: true
  }
})

</script>

<template>

  <div class="carousel-container">
    <BCarouselList
      :data="list"
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
          :sim="compare.sim"
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
