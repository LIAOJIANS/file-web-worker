import Vue from 'vue'
import File from './File.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(File),
}).$mount('#app')
