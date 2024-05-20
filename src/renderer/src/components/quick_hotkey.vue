<template>
  <div class="hotkey">
    <button @click="collect_hotkey">{{ initshortcut }}</button>
    <span v-show="end_tips_show">按回车键结束</span>
  </div>
</template>

<script setup lang="ts">
import { ref,watch } from 'vue';

const props = defineProps({
  init_shortcut: {
    type: String,
    defalut: ''
  },
  target_key: {
    type: String,
    defalut: ''
  },
})
const emit = defineEmits(['notice_hotkey'])

const initshortcut = ref(props.init_shortcut==''?'点击以录制热键':props.init_shortcut)
const end_tips_show = ref(false)
let isRecording = false;
// let recordedShortcut = '';

watch(() => props.init_shortcut, (newValue) => {
  initshortcut.value = newValue;
});

const collect_hotkey = () => {
  if (!isRecording) {
    isRecording = true;
    initshortcut.value = '正在录制，请按下任意键盘'
    // shortcut_txt.value = '按回车键结束';
    end_tips_show.value = true;
    // recordedShortcut = ''; // 重置已记录的快捷键
    // shorcut_s.value = '';
  } else {
    isRecording = false;
    initshortcut.value = '点击以录制热键';
    end_tips_show.value = false;
    // console.log('Recorded Shortcut:', shorcut_s.value);
    emit('notice_hotkey', props?.target_key,'')
  }
}

// 输入框键盘事件处理程序
document.addEventListener('keydown', function (event) {
  if (isRecording) {
    event.preventDefault(); // 防止浏览器默认行为
    let shortcut = '';
    // 按下回车键结束录制
    if (event.key === 'Enter') {
      isRecording = false;
      end_tips_show.value = false;
      // console.log(initshortcut.value)
      if (initshortcut.value == "" || initshortcut.value == "正在录制，请按下任意键盘") initshortcut.value = '点击以录制热键';
      emit('notice_hotkey', props?.target_key,initshortcut.value)
      return;
    }

    // 检查是否按下了 Ctrl 键
    if (event.ctrlKey) {
      shortcut += 'CommandOrControl+';
    }

    // 检查是否按下了 Alt 键
    if (event.altKey) {
      shortcut += 'Alt+';
    }

    // 检查是否按下了 Shift 键
    if (event.shiftKey) {
      shortcut += 'Shift+';
    }

    // 获取按下的键的字符
    shortcut += event.key.toUpperCase();

    // 将快捷键设置为 input 的值
    initshortcut.value = shortcut;
  }
});
</script>

<style lang="less" scoped>
.hotkey button{
  width: 200px;
  text-align: center;
  border: none;
  outline-style: none;
  background-color: #fff;
  color: #000;
  height: 26px;
  box-shadow: 1px 1px 4px 1px rgb(50 50 50 / 4%);
  border-radius: 2px;
}
.hotkey button:hover{
  background: #32323233;
    border-radius: 3px;
}
.hotkey span{
  // position: absolute;
    font-size: 12px;
    top: 0;
    padding: 0 10px;
    border-radius: 13px;
    height: 26px;
    line-height: 26px;
    text-align: center;
    color: #fff;
    background-color: #535353;
    opacity: 1;
    transform: translateX(calc(-100% - 10px));
    transition: all .3s;
}
</style>
