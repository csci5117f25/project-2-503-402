<script setup>
import { ChevronsDown, ChevronsUp, Equal, Percent, Star } from 'lucide-vue-next';

defineProps({
  topImage: {
    type: String,
    required: true
  },
  bottomImage: {
    type: String,
    required: true
  },
  topRating: {
    type: Number,
    required: true
  },
  bottomRating: {
    type: Number,
    required: true
  },
  diff: {
    type: Number,
    required: true
  },
  sim: {
    type: Number,
    required: true
  }
})
</script>

<template>
  <div class="compare-slot is-flex is-justify-content-center is-align-items-center">

    <label class="label is-inline-flex is-justify-content-center is-align-items-center">
      <Star size="18" fill="goldenrod" style="margin-right: 10px;"/>
      {{ topRating.toFixed(1) }}
    </label>

    <img class="poster-img" :src="topImage">
    <label class="label is-inline-flex is-justify-content-center is-align-items-center">
      {{  diff.toFixed(2) }}
      <span v-if="diff > 0" class="icon is-small is-inline-flex">
        <ChevronsUp class="has-text-success"/>
      </span>
      <span v-else-if="diff === 0" class="icon is-small is-inline-flex">
        <Equal color="white"/>
      </span>
      <span v-else class="icon is-small is-inline-flex">
        <ChevronsDown class="has-text-danger"/>
      </span>
    </label>
    {{ sim.toFixed(2) + '%' }}
    <img class="poster-img" :src="bottomImage">

    <label class="label is-inline-flex is-justify-content-center is-align-items-center">
      <Star size="18" fill="goldenrod" style="margin-right: 10px;"/>
      {{ bottomRating.toFixed(1) }}
    </label>

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
    width: 10vh;
    margin: auto;
    padding: 10px;
    border-radius: 10px;
  }
</style>
