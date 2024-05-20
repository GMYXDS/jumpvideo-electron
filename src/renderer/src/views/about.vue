<template>
  <div class="about">
    <div>
      <div class="icon-container">
        <img alt="logo" class="icon" src="../assets/jve.svg" />
      </div>
      <h1 class="title">JumpVideo-Electron</h1>
      <p class="description">power by Electron</p>
      <p class="description">Version 1.1.0 <el-button size="small" round @click.prevent="check_update">检查更新</el-button>
      </p>
      <div class="wrapper">
        <div class="item">
          <h2 class="title">帮助</h2>
          <p class="description">开源地址: <a href="" @click.prevent="open_url('main_github')">JumpVideo-Electron</a></p>
          <p class="description">使用说明: <a href="" @click.prevent="open_url('doc')">官方文档</a></p>
          <p class="description">Bilibili: <a href="" @click.prevent="open_url('bilibili')">点击跳转</a></p>
          <p class="description">QQ群: <a href="" @click.prevent="open_url('qq')">689978959</a></p>
        </div>
        <div class="item">
          <h2 class="title">致谢</h2>
          <p class="description">Github: <a href="" @click.prevent="open_url('author_github')">GMYXDS</a></p>
          <p class="description">Github: <a href="" @click.prevent="open_url('contributer')">livelycode36</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const main_repo = 'https://github.com/GMYXDS/jumpvideo-electron'
const jump_tar = {
  // update: main_repo + '/releases/latest',
  update: 'https://gmyxds.github.io/jumpvideo-electron-doc/download.html' ,
  main_github: main_repo,
  bilibili: 'https://space.bilibili.com/351215045',
  doc: 'https://gmyxds.github.io/jumpvideo-electron-doc/',
  qq: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=R76P4g8W_S7-8hWUyIZxaK-5wAnmmfdm&authKey=oncTBkp%2BLfniS6o8F%2B5B503lppd7LTVSABIaaigPyXlx%2FOGarKZgCsrvs80c9AQk&noverify=0&group_code=689978959',
  author_github: 'https://github.com/GMYXDS',
  contributer: 'https://github.com/livelycode36/'
}
const open_url = (key) => {
  window.electron.ipcRenderer.invoke('open_url', jump_tar[key])
}
function check_update() {
  open_url('update')
  // window.electron.ipcRenderer.invoke('checkForUpdates')
}
</script>

<style lang="less" scoped>
.icon-container {
  text-align: center;
  margin-top: 70px;
}

.icon {
  width: 85px;
  height: 85px;
  border: 2px solid #f3f3f3;
  border-radius: 20px;
  padding: 20px;
  background-color: white;
}

.title {
  text-align: center;
  margin-top: 8px;
  margin-bottom: 8px;
}

.description {
  text-align: center;
  margin-top: 3px;
}

.wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;

  .item {
    margin-left: 30px;
  }

  .description {
    text-align: left;
  }
}
</style>
