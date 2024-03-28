<template>
  <div>
    <input type="file" ref="file">

    <button @click="handleUpload">提交</button>
  </div>
</template>

<script>
import { sliceFile, uploadFile } from './file.utils'
export default {

  methods: {
    async handleUpload() {
      const file = this.$refs.file.files[0]

      if(!file) {
        return
      }

      const chunks = await sliceFile(file)
      console.log(chunks)
      uploadFile(
        chunks
      )
    }
  }
}
</script>

<style>

</style>