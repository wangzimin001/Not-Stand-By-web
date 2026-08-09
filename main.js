import App from './App'

// uni-app 条件编译：仅在 Vue 2 构建目标中引入旧版运行时和 Promise 适配器。
// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({ ...App })
app.$mount()
// #endif

// uni-app 条件编译：当前项目的 manifest 指定 Vue 3，因此实际从这里创建应用实例。
// #ifdef VUE3
import { createSSRApp } from 'vue'

/**
 * 创建 uni-app 的 Vue 3 根应用。
 * @returns {{app: import('vue').App}} uni-app 启动器需要的应用对象。
 */
export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
// #endif
