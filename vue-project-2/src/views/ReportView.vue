<script setup>
  import { useCurrentUser } from 'vuefire'
  import VueQrcode from 'vue-qrcode'
</script>


<template>
  <div>
    <h1>Qr code generation logic</h1>
    <vue-qrcode
      value="https://www.1stg.me"
      @change="onDataUrlChange"
    />
  </div>
  <h1>We should land here after successfully scanning qr code</h1>
</template>
