<script setup>
// import { useRoute } from 'vue-router'
// const route = useRoute()
defineProps({
  id: String,
})
</script>

<template>
  <h1>This is where we generate Report between {{ $route.params.id }} and current user</h1>
</template>
