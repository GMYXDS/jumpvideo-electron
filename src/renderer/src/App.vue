<template>

  <main>
  </main>
  <div class="container">
    <div class="side-panel">
      <div class="logo">
        <img alt="logo" src="./assets/jve.svg" />
      </div>
      <h1 class="app-title bgcolor">JumpVideo Electron</h1>
      <Navigator class="navigator" :pages="pages" :defaultIndex="defaultIndex" @selected="changePage"></Navigator>
    </div>
    <div class="status-bar">
      <Icon class="close-button" name="close" color="black" selectedColor="red" @click="closeWindow"></Icon>
    </div>
    <div class="content-panel">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive,ref } from 'vue'
import { useRouter } from 'vue-router'

import Navigator from './components/Navigator.vue'
import Icon from './components/Icon.vue'
import { ElMessage, ElMessageBox } from 'element-plus';

const progress_status = ref<any>(null)

const router = useRouter()

const pages = reactive([
  { name: '主页', icon: 'main', path: '/' },
  { name: '设置', icon: 'setting', path: '/setting' },
  { name: '关于', icon: 'info', path: '/about' }
])
const defaultIndex = 0

const changePage = (pageIndex) => {
  router.push(pages[pageIndex].path)
}

const closeWindow = () => {
  window.electron.ipcRenderer.send('window-close')
}

// import Versions from './components/Versions.vue'

// const ipcHandle = () => window.electron.ipcRenderer.send('ping')

window.electron.ipcRenderer.on('message_to_render', (_event, msg) => {
  console.log(msg)
  ElMessageBox.alert(msg, '提示', {
    // if you want to disable its autofocus
    // autofocus: false,
    confirmButtonText: '确认',
    callback: (action) => {
      ElMessage({
        type: 'info',
        message: `action: ${action}`,
      })
    },
  })
})

// window.electron.ipcRenderer.on('update-available', (_event) => {
//   // 提示弹窗
//   ElMessageBox.confirm(`检测到JumpVideo-Electron有新的版本，是否更新！`, '提示', {
//     confirmButtonText: '现在更新',
//     cancelButtonText: '取消',
//     type: 'success'
//   }).then(() => {
//     window.electron.ipcRenderer.send('downloadUpdate')
//     open_process_win()
//   }).catch(() => { })
// })

// window.electron.ipcRenderer.on('update-error', (_event) => {
//   // 更新地址失效
//   ElMessageBox.confirm(`JumpVideo-Electron自动更新失败，请手动下载！`, '提示', {
//     confirmButtonText: '去网站下载',
//     cancelButtonText: '取消',
//     type: 'error'
//   }).then(() => {
//     window.electron.ipcRenderer.send('open_url','https://github.com/GMYXDS/jumpvideo-electron/releases')
//   }).catch(() => { })
// })
// window.electron.ipcRenderer.on('downloadProgress', (_event,progress) => {
//   console.log(progress);
//   progress_status.value = progress
// })
// function open_process_win(){
//   ElMessageBox.alert(`下载进度：${progress_status.value}`, '提示', {
//     confirmButtonText: '后台下载',
//     callback: (action) => {},
//   })
// }
</script>

<style lang="less" scoped>
.bgcolor {
  background: -webkit-linear-gradient(315deg, #7252fa 25%, #f2a320);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.logo {
  height: 85px;
  margin-top: 40px;
}

.logo img {
  width: 100%;
  height: 100%
}

.container {
  display: inline;
  background-color: white;
}

.side-panel {
  float: left;

  height: 100%;
  width: 200px;

  background-color: #f3f3f3;

  -webkit-app-region: drag;
  /* 允许用户进行窗口拖动 */
}

.app-title {
  height: 49px;

  margin-top: 5px;
  margin-bottom: 15px;

  font-size: 20px;
  text-align: center;

  color: black;
}

.navigator {
  -webkit-app-region: no-drag;
  /* 禁止拖动 */
  user-select: none;
}

.content-panel {
  margin-left: 0px;
  margin-right: 0px;
  margin-top: 0px;

  height: 100%;
  width: calc(100% - 200px);

  background-color: #f9f9f9;
  overflow: auto;
}

.status-bar {
  float: right;
  margin-top: 0px;
  margin-left: 0px;
  margin-right: 0px;
  height: 45px;
  width: calc(100% - 200px);

  background-color: #f9f9f9;

  -webkit-app-region: drag;
}

.close-button {
  width: 23px;
  height: 23px;
  margin-right: 18px;
  margin-top: 15px;
  float: right;

  -webkit-app-region: no-drag;
}
</style>
