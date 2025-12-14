<script setup lang="ts">
import { getUserSimilarities } from '@/similarities';

  const getReviews = async () => {
    // if(userId.value)
    //   console.log(await getAllUserMovieReviewsObject(userId.value))

    await getUserSimilarities('LZbZsaWfRfO2q69nOSXFL6pW9PH2', '8MKabnDEswMX2nqapeiQsqRSCRm1')
  }

</script>


<template>

  <h1>Test page</h1>
  <h6>This is a test page</h6>

  <button class="button" @click="getReviews()">Test</button>

</template>
