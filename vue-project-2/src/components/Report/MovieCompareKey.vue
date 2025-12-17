<script setup>
import { Star } from 'lucide-vue-next';
</script>

<template>
  <div class="compare-slot is-flex is-justify-content-center is-align-items-center">

    <label class="label is-inline-flex is-justify-content-center is-align-items-center">
      <Star size="18" fill="goldenrod" style="margin-right: 10px;"/>
      You
    </label>

    <img class="poster-img" src="">
    <label class="label is-inline-flex is-justify-content-center is-align-items-center">
      Difference:
    </label>
      Similarity:
    <img class="poster-img" src="">

    <label class="label is-inline-flex is-justify-content-center is-align-items-center">
      <Star size="18" fill="goldenrod" style="margin-right: 10px;"/>
      Them
    </label>

  </div>
</template>

<style scoped src="@/styles/movieCompare.css"></style>
