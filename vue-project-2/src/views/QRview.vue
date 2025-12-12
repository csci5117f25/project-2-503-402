
<script setup>
  import { ref } from 'vue'
  import { useRouter, onBeforeRouteUpdate } from 'vue-router'

  const router = useRouter()

  const result = ref(null)
  const error = ref(null)

  const paused = ref(false)



  function handleSubmit() {
    router.push({name: 'report', params: { id: "qrId" }})
  }


  onBeforeRouteUpdate(() => {
    result.value = null
    paused.value = false     // restart when route changes *to* this view
  })

  function onDetect(detectedCodes) {
    console.log(detectedCodes)
    result.value = JSON.stringify(detectedCodes.map((code) => code.rawValue))
    paused.value = true
  }
  function paintBoundingBox(detectedCodes, ctx) {
    for (const detectedCode of detectedCodes) {
      const {
        boundingBox: { x, y, width, height }
      } = detectedCode

      ctx.lineWidth = 2
      ctx.strokeStyle = '#007bff'
      ctx.strokeRect(x, y, width, height)
    }
  }

  const defaultConstraintOptions = [
    { label: 'rear camera', constraints: { facingMode: 'environment' } },
    { label: 'front camera', constraints: { facingMode: 'user' } }
  ]
  const constraintOptions = ref(defaultConstraintOptions)

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
        constraints: { deviceId }
      }))
    ]

    error.value = ''
  }


  function onError(err) {
    error.value = `[${err.name}]: `

    if (err.name === 'NotAllowedError') {
      error.value += 'you need to grant camera access permission'
    } else if (err.name === 'NotFoundError') {
      error.value += 'no camera on this device'
    } else if (err.name === 'NotSupportedError') {
      error.value += 'secure context required (HTTPS, localhost)'
    } else if (err.name === 'NotReadableError') {
      error.value += 'is the camera already in use?'
    } else if (err.name === 'OverconstrainedError') {
      error.value += 'installed cameras are not suitable'
    } else if (err.name === 'StreamApiNotSupportedError') {
      error.value += 'Stream API is not supported in this browser'
    } else if (err.name === 'InsecureContextError') {
      error.value +=
        'Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP.'
    } else {
      error.value += err.message
    }
  }


</script>


<template>
   <div class="qr-body">
      <div class="qr-text">
        <p class="error">{{ error }}</p>
        <div v-if="result">
          <p class="decode-result">
          Last result: <b>{{ result }}</b>
          </p>
          <button @click="handleSubmit"> See report</button>
        </div>
      </div>


      <div class="qr-camera">
        <qrcode-stream
          :paused="paused"
          :track="paintBoundingBox"
          @error="onError"
          @detect="onDetect"
          @camera-on="onCameraReady"
        />

      </div>
  </div>
</template>

<style scoped>
  button {
    white-space: nowrap;
    border: none;
    border-radius: 999px;
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    background-color: #234c6a;
    color: #ffffff;
  }



  .qr-camera {
    width: 600px;
    height: 400px;
    margin-top: 3rem;
  }

  .qr-text {
    /* background-color: white; */
    color: black;
  }
</style>
