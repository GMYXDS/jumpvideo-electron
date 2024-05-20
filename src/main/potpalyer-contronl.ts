import ffi from 'ffi-napi'

function TEXT(text) {
  return Buffer.from(`${text}\0`, 'ucs2')
}
const user32 = new ffi.Library('user32', {
  FindWindowW: ['int32', ['string', 'string']],
  SendMessageW: ['int32', ['int32', 'int32', 'int32', 'int32']],
  PostMessageW: ['bool', ['int32', 'int32', 'int32', 'int32']]
})

class PotplayerControl {
  WM_COMMAND: number
  WM_USER: number
  hwnd: number
  constructor() {
    this.WM_COMMAND = 0x111 // 273
    this.WM_USER = 0x400 // 1024
    this.hwnd = 0
  }

  sendCommand(msg_type, wParam, lParam) {
    const hwnd = this.getPotplayerHwnd()
    return user32.SendMessageW(hwnd, msg_type, wParam, lParam)
  }

  postCommand(msg_type, wParam, lParam) {
    const hwnd = this.getPotplayerHwnd()
    return user32.PostMessageW(hwnd, msg_type, wParam, lParam)
  }

  getOncePotplayerHwnd() {
    if (this.hwnd !== 0) {
      return this.hwnd
    }
    return this.getPotplayerHwnd()
  }

  getPotplayerHwnd() {
    const hwnd = user32.FindWindowW(TEXT('PotPlayer64'), null)
    if (hwnd == 0) {
      // console.log('PotPlayer不在运行或者不是64位！')
      console.log('PotPlayer is not running');
      return -1
    } else {
      this.hwnd = hwnd
      return hwnd
    }
  }

  // 获取视频路径到剪切板
  getMediaPathToClipboard() {
    // this.postCommand(this.WM_COMMAND, 10928, 0)
    this.sendCommand(this.WM_COMMAND, 10928, 0)
  }
  // 获取视频时间字符串到剪切板
  getMediaTimestampToClipboard() {
    // this.postCommand(this.WM_COMMAND, 10924, 0)
    this.sendCommand(this.WM_COMMAND, 10924, 0)
  }
  // 获取视频截图到剪切板
  saveImageToClipboard() {
    this.sendCommand(this.WM_COMMAND, 10223, 0)
  }

  // 获取播放状态
  getPlayStatus() {
    const status = this.sendCommand(this.WM_USER, 20486, 0)
    switch (status) {
      case -1:
        return 'Stopped'
      case 1:
        return 'Paused'
      case 2:
        return 'Running'
    }
    return 'Undefined'
  }
  // 播放或者暂停
  playOrPause() {
    // this.postCommand(this.WM_USER, 20487, 0);//// 0:Toggle, 1:Paused, 2:Running
    this.postCommand(this.WM_COMMAND, 20001, 0)
  }
  // 播放
  play() {
    // this.postCommand(this.WM_USER, 20487, 2);//// 0:Toggle, 1:Paused, 2:Running
    const status = this.getPlayStatus()
    if (status !== 'Running') {
      this.postCommand(this.WM_COMMAND, 20000, 0)
    }
  }
  // 暂停
  Pause() {
    // this.postCommand(this.WM_USER, 20487, 1);//// 0:Toggle, 1:Paused, 2:Running
    const status = this.getPlayStatus()
    if (status === 'Running') {
      this.postCommand(this.WM_COMMAND, 20000, 0)
    }
  }
  // 停止
  stop() {
    this.postCommand(this.WM_COMMAND, 20002, 0)
  }

  // 前一帧
  previousFrame() {
    this.postCommand(this.WM_COMMAND, 10242, 0)
  }
  // 后一帧
  nextFrame() {
    this.postCommand(this.WM_COMMAND, 10241, 0)
  }
  // 快进
  forward() {
    this.postCommand(this.WM_COMMAND, 10060, 0)
  }
  // 快退
  backward() {
    this.postCommand(this.WM_COMMAND, 10059, 0)
  }
  // 加速
  speedUp() {
    this.postCommand(this.WM_COMMAND, 10248, 0)
  }
  // 减速
  speedDown() {
    this.postCommand(this.WM_COMMAND, 10247, 0)
  }
  // 恢复常速
  speedNormal() {
    this.postCommand(this.WM_COMMAND, 10246, 0)
  }

  // 获取播放时间（毫秒）
  getMediaTimeMilliseconds() {
    return this.sendCommand(this.WM_USER, 20484, 0)
  }
  // 设置播放时间（毫秒）//搜索关键帧？
  setMediaTimeMilliseconds(ms) {
    this.sendCommand(this.WM_USER, 20485, ms)
  }
  // 获取当前播放时间（秒）
  getCurrentSecondsTime() {
    return parseInt((this.getMediaTimeMilliseconds() / 1000).toString())
  }
  // 获取视频总时长（秒）
  getTotalTimeSeconds() {
    return parseInt((this.sendCommand(this.WM_USER, 20482, 0) / 1000).toString())
  }
  // 设置播放时间（秒）
  setCurrentSecondsTime(seconds) {
    if (seconds < 0) {
      seconds = 0
    }
    this.setMediaTimeMilliseconds(seconds * 1000)
  }

  // 设置A-B循环起点
  setStartPointOfTheABCycle() {
    this.sendCommand(this.WM_COMMAND, 10249, 0)
  }
  // 设置A-B循环终点
  setEndPointOfTheABCycle() {
    this.sendCommand(this.WM_COMMAND, 10250, 0)
  }
  // 取消循环
  cancelTheABCycle() {
    // 解除区段循环：起点
    this.postCommand(this.WM_COMMAND, 10251, 0)
    // 解除区段循环：终点
    this.postCommand(this.WM_COMMAND, 10252, 0)
  }
  // 切换前端 按钮
  toggle_top_btn(){
    this.postCommand(this.WM_COMMAND, 10337, 0)
  }
  // 切换前端
  togole_switch_top(){
    this.postCommand(this.WM_COMMAND, 10337, 0)
  }
  // 总在前端
  toggle_top(){
    this.postCommand(this.WM_COMMAND, 10038, 0)
  }
  // 播放时前端
  toggle_play_top(){
    this.postCommand(this.WM_COMMAND, 10039, 0)
  }
  // 全屏是前端
  toggle_fullscreen_top(){
    this.postCommand(this.WM_COMMAND, 10968, 0)
  }
}

// 示例
const potplayer = new PotplayerControl()
export { potplayer }
