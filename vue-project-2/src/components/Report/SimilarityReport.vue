<script setup async lang="ts">
import SingleSimilarityReport from '@/components/Report/SingleSimilarityReport.vue'
import { db } from '@/firebase_conf'
import { collection } from 'firebase/firestore'
import { computed, ref } from 'vue'
import { useCollection, useCurrentUser } from 'vuefire'

// Testing uids
// lucas1 LZbZsaWfRfO2q69nOSXFL6pW9PH2
// lucas2 8MKabnDEswMX2nqapeiQsqRSCRm1
// else wajaclA5vMNdTiPR3Zq0FL8lWv82

const currentUser = useCurrentUser()
const userId = computed(() => currentUser.value?.uid ?? null)
const reports = useCollection(
  computed(() => (userId.value ? collection(db, `users/${userId.value}/reports`) : null)),
)
const active = ref('')

function handleActive(name: string) {
  if (active.value !== '') {
    active.value = ''
  } else {
    active.value = name
  }
}
</script>

<template>
  <div v-if="typeof userId === 'string' && reports.length > 0">
    <div v-for="report in reports" :key="report.name ? report.name : report.uid" class="drop-box">
      <br />
      <label class="label" @click="handleActive(report.uid)"
        >You vs {{ report.name ?? report.uid }}</label
      >
      <SingleSimilarityReport
        v-if="active === report.uid"
        :current="userId"
        :compare="report.uid"
        :max-listings="20"
      ></SingleSimilarityReport>
    </div>
  </div>

  <div v-else class="drop-box">
    <label class="label">No Reports Recorded!</label>
  </div>
</template>

<style scoped>
.drop-box {
  background: rgba(30, 30, 30, 0.88);
  border-radius: 1.1rem;
  padding: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(18px);
  max-width: 920px;
}
</style>
