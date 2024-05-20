<template>
  <div class="from_old_jv">
    <div class="title">从旧版本jumpvideo迁移</div>
    <p>目前已支持大部分旧的链接，迁移错误请反馈!</p>
    <p class="egg">
      例如： [00:00:03.883](jv://jump?url=C:/Users/Administrator/Videos/测试.mp4&time=00:00:03.883)<br/>
      例如： [00:00:03.883](jv://jump?url=C:/Users/Administrator/Videos/测试.mp4&time=00:00:01.299-00:00:02.266)<br/>
      例如： [00:00:03.883](jv://jump?url=C:/Users/Administrator/Videos/测试.mp4&time=00:00:01.299~00:00:02.266)<br/>
      例如： [00:00:34.142](jv://jump?url=https://www.douyin.com/video/7325430047555325220?modeFrom=&time=00:00:34.142)<br/>
    </p>
    <p>
      选择笔记文件（只支持md或txt）：<el-input v-model="p_md" style="width: 241px" placeholder="请选择" />
      <el-button type="primary" @click="choose_md_position">选择</el-button>
    </p>
    <p class="egg danger">
      转换链接会替换所有jv://协议开头的链接，转换前请备份文件！！!
    </p>
    <p style="margin-left:200px;">
      <el-button type="primary" @click="run" color="#626aef">开始转换</el-button>
    </p>

  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'

const p_md = ref('')

const choose_md_position = (e) => {
  window.electron.ipcRenderer.invoke('get_video_path').then((path_arr) => {
    if (path_arr.length >= 1) {
      p_md.value = path_arr[0]
    }
  })
}
const run = () => {
  if (p_md.value == '') {
    ElMessage.error('请补充完相关配置!')
    return;
  }
  window.electron.ipcRenderer
    .invoke('from_old_jv', p_md.value)
    .then((res) => {
      // console.log(res);
      if (res) ElMessageBox.alert('处理成功！替换的文件已保存到同文件夹下'+res, '提示', { confirmButtonText: '确认' });
      else ElMessageBox.alert('转换错误，请联系开发者!', '提示', { confirmButtonText: '确认', type: 'warning', })
    })
    .catch((res) => {
      ElMessageBox.alert('转换错误，请联系开发者!', '提示', { confirmButtonText: '确认', type: 'warning', })
    })
}
</script>
<style lang="less" scoped>
.from_old_jv {
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
.danger{
  color:#ff0044;
}
</style>
