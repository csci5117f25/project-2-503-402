<script setup lang="ts">
import MovieCompare from '@/components/Report/MovieCompare.vue';
import { BCarouselList } from 'buefy'
import MovieCompareKey from './MovieCompareKey.vue';
import { ChevronLeft, ChevronRight, Pause } from 'lucide-vue-next';
import { ref } from 'vue';


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

// SET THIS for max elements visible on static
// ALSO need to change width of carousel container...
const MAX_PER_PAGE = ref(5)
const active = ref(0)

if(window.innerWidth < 968) {
  MAX_PER_PAGE.value = 2
}

// TODO if time move movieCompare to here, no need for that component

</script>

<template>

  <div class="carousel-container">
    <MovieCompareKey
      topImage=""
      bottomImage=""
      :topRating="99"
      :bottomRating="0"
      :diff="1"
      :sim="0"
    ></MovieCompareKey>

    <ChevronLeft v-if="active > 0" @click="active--" :size="60" />
    <Pause v-else :size="45"></Pause>

    <BCarouselList
      v-model="active"
      :data="list"
      :items-to-show="MAX_PER_PAGE"
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

    <ChevronRight v-if="active < list.length - MAX_PER_PAGE" @click="active++" :size="60"/>
    <Pause v-else :size="45"></Pause>

  </div>

</template>

<style scoped>

  .carousel-container {
    display: flex;
    flex-direction: row;
    width: 70vh;
    gap: 10px;
  }

  @media (max-width: 968px) {
    .carousel-container {
      width: 40vh;
    }
  }



</style>
