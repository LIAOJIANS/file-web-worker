<template>
  <div>
    <input type="file" ref="file">

    <button @click="handleUpload">提交</button>

    <p>进度：{{ progress * 100 }}%</p>
  </div>
</template>

<script>
import { sliceFile, uploadFile, handleEvent } from './file.utils'
// import md5 from 'js-md5'
export default {

  data() {
    return {
      progress: 0
    }
  },

  methods: {
    async handleUpload() {
      const file = this.$refs.file.files[0]
    
      if(!file) {
        return
      }

      console.time()

      const dfd = sliceFile(file)

      dfd
        .promise
        .then(({ chunks, chunkNum }) => {
          uploadFile(chunks)

          const { addEventListener } = handleEvent()

          const eject = addEventListener(window, ({ detail: schedule }) => {

            this.progress = schedule / chunkNum

            if(schedule === chunkNum) { // 上传完成，关闭事件监听
              eject()
            }
          })
        })

      console.timeEnd() 
    }
  }
}
</script>

<style>

</style>