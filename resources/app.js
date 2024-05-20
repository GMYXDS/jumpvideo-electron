import NotificationView from './notificationView.js';

// 监听该事件渲染 title和body
window.electron.ipcRenderer.on('notifier.setup', (event, id, options) => {
  new NotificationView(id, options);
});
window.electron.ipcRenderer.on('notifier.beep', (eventType) => {
  const audioElement = new Audio('new_msg_come.wav');
  audioElement.addEventListener("canplaythrough", event => {
    /* 音频可以播放；如果权限允许则播放 */
    audioElement.play();
  });
});
