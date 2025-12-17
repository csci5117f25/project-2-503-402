<script setup>
import SimilarityReport from '@/components/Report/SimilarityReport.vue'
import { db } from '@/firebase_conf'
import { doc, setDoc } from 'firebase/firestore'
import { computed, ref, watch } from 'vue'
// import { useRouter } from 'vue-router'
import { QrcodeCapture, QrcodeStream } from 'vue-qrcode-reader'
import { useCurrentUser } from 'vuefire'
// import { onBeforeRouteUpdate } from 'vue-router'
const defaultConstraintOptions = [
  { label: 'rear camera', constraints: { facingMode: 'environment' } },
  { label: 'front camera', constraints: { facingMode: 'user' } },
]
const constraintOptions = ref(defaultConstraintOptions)

// const router = useRouter()
const result = ref('')

// Add logic to auto-update similarity reports per user
const currentUser = useCurrentUser()
const userId = computed(() => (currentUser.value?.uid ?? null))
watch(result, () => {
  if(!userId.value || !result.value) {
    return
  }
  // Set references to the reports in the respective users' firestores
  // The similarity report uses useCollection, so automatically updated
  // TODO need to set NAME of other user, but we don't store this in the database ...  ALLOW EDITS???
  setDoc(doc(db, `users/${userId.value}/reports/${result.value}`), { name: 'OTHER USER', uid: result.value})
  setDoc(doc(db, `users/${result.value}/reports/${userId.value}`), { name: 'OTHER USER', uid: userId.value})
})



// const error = ref(null)
// const paused = ref(false)
const camera_ready = ref(false)

const mode = ref('upload')
function changeMode(newMode) {
  mode.value = newMode
}

function onDetect(detectedCodes) {
  console.log(detectedCodes[0].rawValue)
  // result.value = JSON.stringify(detectedCodes.map((code) => code.rawValue))
  result.value = detectedCodes[0].rawValue
}

// the next 3 functions are from: https://gruhn.github.io/vue-qrcode-reader/demos/FullDemo.html
function paintBoundingBox(detectedCodes, ctx) {
  for (const detectedCode of detectedCodes) {
    const {
      boundingBox: { x, y, width, height },
    } = detectedCode

    ctx.lineWidth = 2
    ctx.strokeStyle = '#007bff'
    ctx.strokeRect(x, y, width, height)
  }
}

async function onCameraReady() {
  // NOTE: on iOS we can't invoke `enumerateDevices` before the user has given
  // camera access permission. `QrcodeStream` internally takes care of
  // requesting the permissions. The `camera-on` event should guarantee that this
  // has happened.

  const devices = await navigator.mediaDevices.enumerateDevices()
  const videoDevices = devices.filter(({ kind }) => kind === 'videoinput')

  constraintOptions.value = [
    ...defaultConstraintOptions,
    ...videoDevices.map(({ deviceId, label }) => ({
      label: `${label} (ID: ${deviceId})`,
      constraints: { deviceId },
    })),
  ]

  // error.value = ''
  camera_ready.value = true
}

function onError(err) {
  console.error(err)
}
</script>

<template>
  <div v-if="result">
    <p class="decode-result">
      Last result: <b>{{ result }}</b>
    </p>
    <h1>This is where report goes</h1>
  </div>

  <template v-else>
    <div class="qr-body">
      <div class="qr-section">
        <div class="tabs-header">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: mode === 'upload' }"
            @click="changeMode('upload')"
          >
            Upload QR Code
          </button>

          <button
            type="button"
            class="tab-btn"
            :class="{ active: mode === 'scan' }"
            @click="changeMode('scan')"
          >
            Scan QR Code
          </button>
        </div>
        <div class="tab-content">
          <div v-if="mode === 'upload'" class="qr-upload">
            <div class="upload-container">
              <p class="qr-instruction">Upload an image file containing a QR code.</p>
              <QrcodeCapture @detect="onDetect" class="file-input" />
            </div>
          </div>

          <div v-if="mode === 'scan'" class="qr-scan">
            <div class="qr-camera">
              <QrcodeStream
                @detect="onDetect"
                @camera-on="onCameraReady"
                @error="onError"
                :paused="paused"
                :track="paintBoundingBox"
              />

              <p class="qr-instruction">Use your camera to scan a QR code.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  <SimilarityReport></SimilarityReport>
</template>

<style scoped>
.qr-body {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: calc(100vh - 100px);
  padding: 1rem;
  box-sizing: border-box;
}

.qr-section {
  width: 100%;
  max-width: 420px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.tabs-header {
  display: flex;
  background-color: #222;
  border-bottom: 1px solid #333;
}

.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #888;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #ccc;
  background-color: #2a2a2a;
}

.tab-btn.active {
  color: white;
  border-bottom-color: #ef4444;
  background-color: #262626;
}

.upload-container {
  position: relative;
  border: 2px dashed #444;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  overflow: hidden;
  transition: border-color 0.2s;
}

.upload-container:hover {
  border-color: #666;
}

.qr-scan {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-camera {
  width: 100%;
  aspect-ratio: 1;
  background: black;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
}

.qr-instruction {
  color: #aaa;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}
</style>
