<script setup lang="ts">
import { getUserSimilarities, testUserDiff } from '@/similarities';

  const getReviews = async () => {
    // if(userId.value)
    //   console.log(await getAllUserMovieReviewsObject(userId.value))
    await testUserDiff()
  }

</script>


<template>

  <h1>Test page</h1>
  <h6>This is a test page</h6>

  <button class="button" @click="getReviews()">Test</button>

</template>
