<!-- eslint-disable prettier/prettier -->
<template>
  <div class="setting">
    <div class="title">基本功能</div>
    <div class="content">
      <p><el-checkbox v-model="is_autostart" label="开机自启动" size="large" /></p>
      <p><el-checkbox v-model="is_link_stop" label="获取链接后是否自动暂停" size="large" /></p>
      <p>
        <el-tooltip class="box-item" effect="dark" content="例如视频获取到1:02<br/>当设置为-1时候<br/>粘贴链接的时间就会变成1:01"
          placement="bottom" raw-content>
          获取时间后的微调（秒s）
        </el-tooltip>
        <el-input-number v-model="time_custom" :step="1" />
      </p>
      <p>
        <el-tooltip class="box-item" effect="dark" content="当没有打开potplayer时候，从笔记里面点击链接，<br/>启动potplayer会有一个耗时，在potplayer没有完全启动之前，软件无法完成跳转操作<br/>此设置是将跳转延时多少秒后执行，默认3s" placement="bottom" raw-content>
          等待potplayer首次启动的时间（秒s）
        </el-tooltip>
        <el-input-number v-model="wait_pp" :step="1" />
      </p>
    </div>
    <div class="title">快捷键</div>
    <div class="content">
      <p class="hotkey_set">获取链接<Quick_hotkey :init_shortcut="shortcut_link" target_key="shortcut_link" @notice_hotkey="handle_hotkey_update">
        </Quick_hotkey>
      </p>
      <p class="hotkey_set">获取截图<Quick_hotkey :init_shortcut="shortcut_img" target_key="shortcut_img" @notice_hotkey="handle_hotkey_update">
        </Quick_hotkey>
      </p>
      <p class="hotkey_set">截图编辑<Quick_hotkey :init_shortcut="shortcut_img_edit" target_key="shortcut_img_edit" @notice_hotkey="handle_hotkey_update">
        </Quick_hotkey>
      </p>
      <p class="hotkey_set"> &nbsp;AB 片段 <Quick_hotkey :init_shortcut="shortcut_ab" target_key="shortcut_ab"
          @notice_hotkey="handle_hotkey_update"></Quick_hotkey>
      </p>
      <p class="hotkey_set"> &nbsp;AB 循环 <Quick_hotkey :init_shortcut="shortcut_ab_circle" target_key="shortcut_ab_circle"
          @notice_hotkey="handle_hotkey_update"></Quick_hotkey>
      </p>
    </div>
    <div class="title">软件位置</div>
    <div class="content">
      <p>Potplayer位置：<el-input v-model="position_potplayer" style="width: 241px" placeholder="请选择" /><el-button
          type="primary" @click="choose_pp_postion">选择</el-button></p>
      <p>Snipaste位置： &nbsp;<el-input v-model="position_snipaste" style="width: 240px" placeholder="请选择" /><el-button
          type="primary" @click="choose_snipaste_position">选择</el-button></p>
    </div>
    <div class="title">自定义格式</div>
    <div class="content custom_txt">
      <p>跳转链接模板：</p>
      <div class="tips">
        <div class="tips_item">
          <div class="tips_var">{filename}</div> <span>文件名称：test</span>
        </div>
        <div class="tips_item">
          <div class="tips_var">{ext}</div> <span>文件后缀名：mp4</span>
        </div>
        <div class="tips_item">
          <div class="tips_var">{time}</div> <span>时间格式：1:02</span>
        </div>
        <div class="tips_item">
          <div class="tips_var">{link}</div> <span>跳转链接：jve://open/736db083-503e-45c4-9272-2772cec54a8f</span>
        </div>
        <div class="tips_item">
          <div class="tips_var">{srt}</div> <span>字幕文字：仅在使用[转换字幕功能]时有效</span>
        </div>
      </div>
      <p>
        <el-input v-model="custom_link" style="width: 300px" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea"
          placeholder="链接：[{filename} | {time}]({link})" />
      </p>
      <p v-show="false">截图链接模板：</p>
      <div v-show="false" class="tips">
        <div class="tips_item">
          <div class="tips_var">{link}</div> <span>上面完整的链接：略</span>
        </div>
        <div class="tips_item">
          <div class="tips_var">{image}</div> <span>图片截图：略</span>
        </div>
      </div>
      <p v-show="false">
        <el-input v-model="custom_img" style="width: 240px" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea"
          placeholder="链接：{link} 截图：{image}" />
      </p>
    </div>
    <div class="footer"></div>
  </div>

</template>

<script setup>
import { onMounted, ref, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import Quick_hotkey from '../components/quick_hotkey.vue';

const is_autostart = ref(false)
const is_link_stop = ref(false)
const time_custom = ref(0)
const wait_pp = ref(3)
const shortcut_link = ref('')
const shortcut_img = ref('')
const shortcut_img_edit = ref('')
const shortcut_ab = ref('')
const shortcut_ab_circle = ref('')
const position_potplayer = ref('')
const position_snipaste = ref('')
const custom_link = ref('')
const custom_img = ref('')

onMounted(() => {
  window.electron.ipcRenderer.invoke('get_settings').then(data => {
    // console.log(data)
    for (const key in data) {
      // console.log("update?");
      if (key == 'is_autostart') is_autostart.value = data[key]
      else if (key == 'is_link_stop') is_link_stop.value = data[key]
      else if (key == 'time_custom') time_custom.value = data[key]
      else if (key == 'wait_pp') wait_pp.value = data[key]
      else if (key == 'shortcut_link') shortcut_link.value = data[key]
      else if (key == 'shortcut_img') shortcut_img.value = data[key]
      else if (key == 'shortcut_img_edit') shortcut_img_edit.value = data[key]
      else if (key == 'shortcut_ab') shortcut_ab.value = data[key]
      else if (key == 'shortcut_ab_circle') shortcut_ab_circle.value = data[key]
      else if (key == 'position_potplayer') position_potplayer.value = data[key]
      else if (key == 'position_snipaste') position_snipaste.value = data[key]
      else if (key == 'custom_link') custom_link.value = data[key]
      else if (key == 'custom_img') custom_img.value = data[key]
    }
    // console.log(shortcut_link.value);
  })
  watchEffect(() => {
    if(is_autostart.value){
      // 开机启动，打开
      console.log("open autostart");
      window.electron.ipcRenderer.invoke('autostart_on').then(res => {})
    }else{
      // 开机启动，关闭
      console.log("close autostart");
      window.electron.ipcRenderer.invoke('autostart_off').then(res => {})
    }
    save_all_config()
  })
})

function save_all_config(){
  window.electron.ipcRenderer.invoke('save_settings', {
      'is_autostart': is_autostart.value,
      'is_link_stop': is_link_stop.value,
      'time_custom': time_custom.value,
      'wait_pp': wait_pp.value,
      'shortcut_link': shortcut_link.value,
      'shortcut_img': shortcut_img.value,
      'shortcut_img_edit': shortcut_img_edit.value,
      'shortcut_ab': shortcut_ab.value,
      'shortcut_ab_circle': shortcut_ab_circle.value,
      'position_potplayer': position_potplayer.value,
      'position_snipaste': position_snipaste.value,
      'custom_link': custom_link.value,
      'custom_img': custom_img.value
    })
}

const handle_hotkey_update = (key,value) => {
  console.log(key,value)
  if(value=="正在录制，请按下任意键盘" || value=="点击以录制热键")value=""
  // 拿到对应的key 和 value,尝试注册，并返回注册结果
  // 注册成功，就写入配置
  window.electron.ipcRenderer.invoke('hotkey_update',key,value).then(res => {
    console.log(res);
    if(res){
      ElMessage({
        message: '快捷键更新成功！',
        type: 'success',
      })
    }else{
      ElMessage.error('快捷键已被占用，注册失败！')
    }
  })
}

const choose_pp_postion = (e) => {
  // 先判断一下默认位置
  window.electron.ipcRenderer.invoke('check_pp_postion').then(path => {
    if (path != "") {
      // 询问是否设置默认
      ElMessageBox.confirm(
        `检测到Potplayer位置是否立即设置${path}`,
        '提示',
        {
          confirmButtonText: '使用这个位置',
          cancelButtonText: '自己选择',
          type: 'success',
        }
      ).then(() => {
        position_potplayer.value = path
      })
        .catch(() => {
          real_choose_postion()
        })
    } else {
      real_choose_postion()
    }
  })
}
const real_choose_postion = () => {
  window.electron.ipcRenderer.invoke('get_file_path').then(path_arr => {
    if (path_arr.length >= 1) {
      position_potplayer.value = path_arr[0]
    }
  })
}

const choose_snipaste_position = (e) => {
  window.electron.ipcRenderer.invoke('get_file_path').then(path_arr => {
    if (path_arr.length >= 1) {
      position_snipaste.value = path_arr[0]
    }
  })
}

</script>

<style lang="less" scoped>
.content .hotkey_set {
  display: flex;
}

.content .hotkey {
  margin-left: 20px;
}

.setting {
  padding: 30px;
  overflow: auto;
}

.title {
  border-left: 6px solid #d4a827;
  padding-left: 10px;
  font-size: 22px;
  font-weight: 800;
  margin-top: 20px;
  margin-bottom: 10px;
}

.custom_txt p {
  font-weight: 600;
}

.content {
  margin-left: 20px;
  font-size: 18px;
  font-weight: 500;
  font-color: #606266;
  background-color: #f3f3f3;
  padding: 10px
}

.el-button {
  font-size: 16px;
  font-weight: 600;
  height: 28px;
  margin-left: 10px;
}

.content p {
  margin-top: 5px;
}

.status .el-button {
  width: 10px;
  height: 10px;
}

.el-checkbox {
  font-weight: 600;
  height: auto;
}

// ::global(.el-checkbox__label){
//   font-size:16px!important;
// }

.footer {
  height: 80px;
}

.tips {
  font-size: 14px;

  .tips_item {
    display: flex;
    margin-top: 2px;

    .tips_var {
      font-size: 12px;
      background-color: #9dceff;
      border-radius: 10px;
      padding: 1px 3px;
      box-sizing: content-box;
      margin-right: 4px;
    }
  }
}
</style>
