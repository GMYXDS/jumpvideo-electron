<template>
  <div class="main">
    <div class="title">选择链接获取方式</div>
    <div class="content status">
      <el-radio-group v-model="player_type" @change="handle_change_player">
        <el-radio :value="0">
          <p>Potplayer</p>
          <!-- <p>Potplayer <span><el-button :type="pp_status?'success':'danger'" :icon="pp_status?Check:Close" circle /></span></p> -->
        </el-radio>
        <el-radio :value="1">
          <p>浏览器</p>
          <!-- <p>浏览器 <span><el-button :type="web_status?'success':'danger'" :icon="web_status?Check:Close" circle /></span> </p> -->
        </el-radio>
      </el-radio-group>
    </div>
    <div class="title">其他功能</div>
    <div class="content func">
      <p><el-button type="default" @click="jump_to_srt">字幕转换链接</el-button></p>
      <p><el-button type="default" @click="open_float">悬浮窗</el-button></p>
      <p><el-button type="default" @click="jump_to_m2p">从markdown2potplayer迁移</el-button></p>
      <p><el-button type="default" @click="jump_to_old_jv">从旧版本jumpvideo迁移</el-button></p>
      <!-- <p><el-button type="default" @click="test(0)">test</el-button></p>
      <p><el-button type="default" @click="test(1)">test1</el-button></p>
      <p><el-button type="default" @click="test(2)">test2</el-button></p>
      <p><el-button type="default" @click="test(3)">test3</el-button></p>
      <p><el-button type="default" @click="test(4)">test4</el-button></p> -->
    </div>
  </div>
</template>

<script setup>
// import { Check, Close } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue'
const player_type = ref(0)
// const pp_status = ref(false)
// const web_status = ref(false)
const router = useRouter()
// const test = (index)=>{
// window.electron.ipcRenderer.invoke('test_all',index)
// }
const open_float = () => {
  window.electron.ipcRenderer.send('open-float-window')
}
const jump_to_m2p = () => {
  router.push('/from_m2p')
}
const jump_to_old_jv = () => {
  router.push('/from_old_jv')
}
const jump_to_srt = () => {
  router.push('/srt_trans')
}

const handle_change_player = (index) => {
  localStorage.setItem('player_type', index)
  // console.log(index);
  window.electron.ipcRenderer.invoke('change_player', index)
}
onMounted(() => {
  const player_type1 = localStorage.getItem('player_type')
  if (player_type1 == null) {
    player_type.value = 0
    handle_change_player(0)
  } else {
    player_type.value = parseInt(player_type1)
    handle_change_player(parseInt(player_type1))
  }
})

</script>

<style lang="less" scoped>
.main {
  padding: 30px;
}

.title {
  border-left: 6px solid #d4a827;
  padding-left: 10px;
  font-size: 22px;
  font-weight: 800;
  margin-top: 20px;
  margin-bottom: 10px;
}

.content {
  margin-left: 20px;
  font-size: 16px;
  font-weight: 600;
}

.el-button {
  font-size: 16px;
  font-weight: 600;
}

.content p {
  margin-top: 5px;
}

.status .el-button {
  width: 10px;
  height: 10px;
}
</style>
