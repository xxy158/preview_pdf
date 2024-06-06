import 'babel-polyfill'
import promise from 'es6-promise'
promise.polyfill()

import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import utils from  './utils/utils'
import App from './App'
import router from './router'
import '../static/css/default.css'

Vue.prototype.$utils = utils
Vue.use(ElementUI)

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
