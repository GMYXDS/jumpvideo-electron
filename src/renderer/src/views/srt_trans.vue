<template>
  <div class="srt">
    <div class="title">srt字幕转换配置</div>
    <p>
      选择链接视频文件位置：<el-input v-model="p_video" style="width: 241px" placeholder="请选择" />
      <el-button type="primary" @click="choose_video_position">选择</el-button>
    </p>
    <p>
      选择srt字幕文件位置：&nbsp;&nbsp; <el-input v-model="p_srt" style="width: 240px" placeholder="请选择" />
      <el-button type="primary" @click="choose_srt_position">选择</el-button>
    </p>
    <p>
      选择链接生成模式：
      <el-radio-group v-model="p_type">
        <el-radio :value="0">链接</el-radio>
        <el-radio :value="1">AB片段</el-radio>
        <el-radio :value="2">AB循环</el-radio>
      </el-radio-group>
    </p>
    <div style="margin-top: 10px; padding-left: 5px;">
      是否将字幕文本写入链接：
      <el-checkbox v-model="p_text_check" label="" size="large" />
      <div class="egg">例如：[ test.mp4 | 00:00:54](jv://open/28d...) --&gt; [ 欢迎大家 | 00:00:54](jv://open/28d...)</div>
    </div>
    <p style="margin-left:200px;">
      <el-button type="primary" @click="run" color="#626aef">开始生成</el-button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'

const p_video = ref('')
const p_srt = ref('')
const p_type = ref(0)
const p_text_check = ref(true)

const choose_video_position = (e) => {
  window.electron.ipcRenderer.invoke('get_video_path').then((path_arr) => {
    if (path_arr.length >= 1) {
      p_video.value = path_arr[0]
    }
  })
}
const choose_srt_position = (e) => {
  window.electron.ipcRenderer.invoke('get_srt_path').then((path_arr) => {
    if (path_arr.length >= 1) {
      p_srt.value = path_arr[0]
    }
  })
}
const run = () => {
  if (p_video.value == '' || p_srt.value == '') {
    ElMessage.error('请补充完相关配置!')
    return;
  }
  window.electron.ipcRenderer
    .invoke('trans_srt', [p_video.value, p_srt.value, p_type.value,p_text_check.value])
    .then((res) => {
      // console.log(res);
      if (res) ElMessageBox.alert('链接处理成功！已复制到剪切板！按Ctrl+V粘贴！', '提示', { confirmButtonText: '确认' });
      else ElMessageBox.alert('srt处理错误，请联系开发者!', '提示', { confirmButtonText: '确认', type: 'warning', })
    })
    .catch((res) => {
      ElMessageBox.alert('srt处理错误，请联系开发者!', '提示', { confirmButtonText: '确认', type: 'warning', })
    })
}
</script>

<style lang="less" scoped>
.srt {
  padding: 30px;
  overflow: auto;
}

.title {
  border-left: 6px solid #d4a827;
  padding-left: 10px;
  font-size: 22px;
  font-weight: 800;
  margin-top: 20px;
  margin-bottom: 20px;
}

.el-button {
  font-size: 16px;
  font-weight: 600;
  height: 28px;
  margin-left: 10px;
}

p {
  margin-top: 10px;
  padding-left: 5px;
}

.egg {
  font-size: 14px;
  color: grey;
}
</style>
