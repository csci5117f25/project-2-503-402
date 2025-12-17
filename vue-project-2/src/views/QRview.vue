<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { QrcodeCapture } from 'vue-qrcode-reader'
// import { onBeforeRouteUpdate } from 'vue-router'
// const defaultConstraintOptions = [
//   { label: 'rear camera', constraints: { facingMode: 'environment' } },
//   { label: 'front camera', constraints: { facingMode: 'user' } },
// ]
// const constraintOptions = ref(defaultConstraintOptions)

const router = useRouter()
const result = ref('')
// const error = ref(null)
// const paused = ref(false)
// const camera_ready = ref(false)

// const mode = ref('')

// function handleSubmit() {
//   router.push({ name: 'report', params: { id: result?.value } })
// }

function onDetect(detectedCodes) {
  console.log(detectedCodes[0].rawValue)
  // result.value = JSON.stringify(detectedCodes.map((code) => code.rawValue))
  result.value = detectedCodes[0].rawValue
 router.push({ name: 'report', params: { id: result?.value } })
}

// // the next 3 functions are from: https://gruhn.github.io/vue-qrcode-reader/demos/FullDemo.html
// function paintBoundingBox(detectedCodes, ctx) {
//   for (const detectedCode of detectedCodes) {
//     const {
//       boundingBox: { x, y, width, height },
//     } = detectedCode

//     ctx.lineWidth = 2
//     ctx.strokeStyle = '#007bff'
//     ctx.strokeRect(x, y, width, height)
//   }
// }

// async function onCameraReady() {
//   // NOTE: on iOS we can't invoke `enumerateDevices` before the user has given
//   // camera access permission. `QrcodeStream` internally takes care of
//   // requesting the permissions. The `camera-on` event should guarantee that this
//   // has happened.

//   const devices = await navigator.mediaDevices.enumerateDevices()
//   const videoDevices = devices.filter(({ kind }) => kind === 'videoinput')

//   constraintOptions.value = [
//     ...defaultConstraintOptions,
//     ...videoDevices.map(({ deviceId, label }) => ({
//       label: `${label} (ID: ${deviceId})`,
//       constraints: { deviceId },
//     })),
//   ]

//   // error.value = ''
//   camera_ready.value = true
// }

// function onError(err) {
//   // error.value = `[${err.name}]: `
//   // if (err.name === 'NotAllowedError') {
//   //   error.value += 'you need to grant camera access permission'
//   // } else if (err.name === 'NotFoundError') {
//   //   error.value += 'no camera on this device'
//   // } else if (err.name === 'NotSupportedError') {
//   //   error.value += 'secure context required (HTTPS, localhost)'
//   // } else if (err.name === 'NotReadableError') {
//   //   error.value += 'is the camera already in use?'
//   // } else if (err.name === 'OverconstrainedError') {
//   //   error.value += 'installed cameras are not suitable'
//   // } else if (err.name === 'StreamApiNotSupportedError') {
//   //   error.value += 'Stream API is not supported in this browser'
//   // } else if (err.name === 'InsecureContextError') {
//   //   error.value +=
//   //     'Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP.'
//   // } else {
//   //   error.value += err.message
//   // }

//   console.error(err)
// }

// onBeforeRouteUpdate(() => {
//   result.value = null
//   paused.value = false
// })
</script>

<template>
  <div class="qr-body">
    <!-- <div class="qr-text">
      <div v-if="result">
        <p class="decode-result">
          Last result: <b>{{ result }}</b>
        </p>
        <button @click="handleSubmit">See report</button>
      </div>
    </div> -->

    <div class="qr-section">
     <QrcodeCapture @detect="onDetect" />
    </div>

    <!-- <div class="qr-camera">
      <div class="camera-overlay" v-if="!camera_ready">
        <span>Enable camera</span>
      </div>

      <QrcodeStream @detect="onDetect" @camera-on="onCameraReady" @error="onError" :paused="paused" :track="paintBoundingBox">
        idk
      </QrcodeStream>
      <qrcode-stream
        class="qr-stream"
        :class="{ 'qr-stream--hidden': !camera_ready }"
        :paused="paused"
        :track="paintBoundingBox"
        @error="onError"
        @detect="onDetect"
        @camera-on="onCameraReady"
      />
    </div> -->
  </div>
</template>


<style scoped>
.qr-page-container {
  min-height: 100vh;
  width: 100%;
  padding: 2.5rem;
  background: #1a1a1a;
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-page-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(239, 68, 68, 0.08) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

.qr-page-container > * {
  position: relative;
  z-index: 1;
}

.qr-body {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

.qr-section {
  width: 100%;
  background: rgba(30, 30, 30, 0.88);
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(18px);
}

.qr-camera {
  position: relative;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 6 / 9;
  background: #000;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-stream {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.qr-stream--hidden {
  opacity: 0;
  pointer-events: none;
}

.camera-overlay {
  position: absolute;
  inset: 0;
  background: #000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.95rem;
  text-align: center;
  padding: 0.5rem;
  z-index: 2;
}

.qr-text {
  color: white;
}

@media (max-width: 768px) {
  .qr-page-container {
    padding: 1.5rem;
  }

  .qr-section {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .qr-page-container {
    padding: 1rem;
  }

  .qr-section {
    padding: 1rem;
    border-radius: 1rem;
  }

  .qr-camera {
    border-radius: 0.5rem;
  }
}
</style>
