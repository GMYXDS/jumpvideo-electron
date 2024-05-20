/* eslint-disable no-useless-escape */
/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier
import { app, shell, BrowserWindow, ipcMain, dialog, Tray, Menu, globalShortcut, clipboard, Notification, screen, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import os from 'os';
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { potplayer } from './potpalyer-contronl'
import { exec,execSync } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import notifier from 'electron-notifications-win'
import DatabaseHelper from './db'
import { WebSocket } from 'ws'
// import runautoUpdater from './autoUpdater'
// import { autoUpdater } from 'electron-updater'

notifier.config({
  spaceHeight: 20,
  icon: icon,
  autoClose: true,
  duration: 3000
})
// 设置存储
// const exe_path = path.dirname(process.execPath)
const config_positon = path.dirname(app.getPath('userData'))
const NOTE_PATH: any = path.join(config_positon, './jve_settings.json')
const init_setting: any = {
  is_autostart: false,
  is_link_stop: true,
  time_custom: 0,
  wait_pp: 3,
  shortcut_link: 'Alt+X',
  shortcut_img: 'Alt+C',
  shortcut_img_edit: 'Alt+V',
  shortcut_ab: 'Alt+D',
  shortcut_ab_circle: 'Alt+F',
  position_potplayer: '',
  position_snipaste: '',
  custom_link: '',
  custom_img: ''
}
const getSettingsData = () => JSON.parse(fs.readFileSync(NOTE_PATH).toString())
const setSettingsData = (data) => fs.writeFileSync(NOTE_PATH, JSON.stringify(data))
if (!fs.existsSync(NOTE_PATH)) {
  setSettingsData(init_setting)
}
// 配置 sqlite3
const dbHelper = new DatabaseHelper(path.join(config_positon, './jve_data.db'))

let mainWindow: any = null
let floatWindow:any = null;
let tray: any = null
const pack_name = 'electron.app.jumpvideo'
const custom_protocol = 'jve' // 自定义协议名
const ws_arr:any[] = []
let player_type =0 ;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : { icon }),
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (process.argv.indexOf('--openAsHidden') < 0) mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function createFloatWindow() {
  floatWindow = new BrowserWindow({
    width: 92,
    height: 220,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    show:false,
    ...(process.platform === 'linux' ? { icon } : { icon }),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  floatWindow.loadFile(path.join(__dirname, '../float.html'));
  // 监听 `menu` 事件，取消默认行为以阻止右键系统菜单弹出
  floatWindow.hookWindowMessage(278, () => {
    floatWindow.setEnabled(false);
    setTimeout(() => {
      floatWindow.setEnabled(true);
    }, 100);
    return true;
  });
}
// 单例模式-只允许一个应用运行
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  // app.on('second-instance', (event, commandLine, workingDirectory) => {
  //   // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
  //   if (mainWindow) {
  //     if (mainWindow.isMinimized()) mainWindow.restore()
  //     mainWindow.focus()
  //     mainWindow.show()
  //   }
  // })
}else{
  app.whenReady().then(() => {
    electronApp.setAppUserModelId(pack_name)
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
    // IPC test
    ipcMain.on('ping', () => {
      console.log('pong')
    })
    ipcMain.on('window-close', (e,real) => {
      // mainWindow.close()
      if(real){
        real_close()
      }else{
        mainWindow.hide()
      }
    })

    createWindow()
    createFloatWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    // 注册托盘
    register_Tray()
    // 注册快捷键
    register_shortcut()
    // 是否开机启动
    check_need_autostart()
    // 注册协议
    protocol_on()
    // 在ready事件回调中监听自定义协议唤起
    watchProtocol()
    // 自动更新
    // runautoUpdater(mainWindow)
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
    protocol_off()
  })
}
// 真正的关闭
function real_close(){
  if(floatWindow)floatWindow.close()
  mainWindow.close()
}

// 注册托盘
function register_Tray() {
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示',
      type: 'normal',
      click: () => {
        mainWindow.show()
      }
    },
    {
      label: '退出',
      type: 'normal',
      click: () => {
        real_close()
      }
    }
  ])
  tray.setToolTip('JumpVideo-Electron')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', () => {
    mainWindow.show()
  })
}

// 注册快捷键
function register_shortcut() {
  try {
    globalShortcut.unregisterAll()
  } catch (error) {
    return
  }
  if (is.dev) {
    reg_dev_tools()
  }
  // 注册快捷键
  const setting_data = getSettingsData()
  if (setting_data['shortcut_link'] != '') {
    const ret = globalShortcut.register(setting_data['shortcut_link'], () => {
      shortcut_link()
    })
    if (!ret) {
      setting_data['shortcut_link'] = ''
    }
  }
  if (setting_data['shortcut_img'] != '') {
    const ret = globalShortcut.register(setting_data['shortcut_img'], () => {
      shortcut_img()
    })
    if (!ret) {
      setting_data['shortcut_img'] = ''
    }
  }
  if (setting_data['shortcut_img_edit'] != '') {
    const ret = globalShortcut.register(setting_data['shortcut_img_edit'], () => {
      shortcut_img_edit()
    })
    if (!ret) {
      setting_data['shortcut_img_edit'] = ''
    }
  }
  if (setting_data['shortcut_ab'] != '') {
    const ret = globalShortcut.register(setting_data['shortcut_ab'], () => {
      shortcut_ab()
    })
    if (!ret) {
      setting_data['shortcut_ab'] = ''
    }
  }
  if (setting_data['shortcut_ab_circle'] != '') {
    const ret = globalShortcut.register(setting_data['shortcut_ab_circle'], () => {
      shortcut_ab_circle()
    })
    if (!ret) {
      setting_data['shortcut_ab_circle'] = ''
    }
  }
  setSettingsData(setting_data)
  // console.log(globalShortcut.isRegistered('Alt+X'))
}
const reg_dev_tools = () => {
  globalShortcut.register('CmdOrCtrl+Shift+I', () => {
    mainWindow.webContents.openDevTools()
  })
}



//
ipcMain.handle('change_player', (e,index) => {
  player_type = parseInt(index)
})
// 对话框
ipcMain.handle('get_file_path', (e) => {
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
        title: '选择一个文件',
        defaultPath: '.',
        buttonLabel: '选择',
        filters: [
          { name: '可执行文件', extensions: ['exe'] },
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile']
      })
      .then((result) => {
        resolve(result.filePaths)
      })
      .catch((e) => {
        reject(e)
      })
  })
})
ipcMain.handle('get_video_path', (e) => {
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
        title: '选择一个视频文件文件',
        defaultPath: '.',
        buttonLabel: '选择',
        filters: [
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile']
      })
      .then((result) => {
        resolve(result.filePaths)
      })
      .catch((e) => {
        reject(e)
      })
  })
})
ipcMain.handle('get_srt_path', (e) => {
  return new Promise((resolve, reject) => {
    dialog
      .showOpenDialog({
        title: '选择一个srt字幕文件',
        defaultPath: '.',
        buttonLabel: '选择',
        filters: [
          { name: 'srt字幕文件', extensions: ['srt'] },
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile']
      })
      .then((result) => {
        resolve(result.filePaths)
      })
      .catch((e) => {
        reject(e)
      })
  })
})
// 快速pp位置
ipcMain.handle('check_pp_postion', (e) => {
  const pp = 'C:\\Program Files\\DAUM\\PotPlayer\\PotPlayerMini64.exe'
  const pp2 = 'D:\\Program Files\\DAUM\\PotPlayer\\PotPlayerMini64.exe'
  if (fs.existsSync(pp)) {
    return pp
  }
  if (fs.existsSync(pp2)) {
    return pp2
  }
  return ''
})
// 配置保存
ipcMain.handle('save_settings', (e, data) => {
  // console.log(data)
  setSettingsData(data)
})
ipcMain.handle('get_settings', (e) => {
  return getSettingsData()
})
// exe操作
ipcMain.handle('open_potplayer', (e, video_path = '') => {
  const exePath = getSettingsData()['position_potplayer']
  if (exePath == '') return
  return new Promise((resolve, reject) => {
    exec(`"${exePath}" "${video_path}"`, (err, stdout, stderr) => {
      resolve('ok')
    })
  })
})
function open_potplayer_new(exePath, video_path, time_str) {
  const cmd = `"${exePath}" "${video_path}" /seek=${time_str} /new`
  // console.log(cmd)
  exec(cmd)
}
function open_potplayer_current(exePath, video_path, time_str) {
  const cmd = `"${exePath}" "${video_path}" /seek=${time_str} /current`
  // console.log(cmd)
  exec(cmd)
}
ipcMain.handle('open_snipaste_file', (e, png_path) => {
  open_snipaste_file(png_path)
})
function open_snipaste_file(png_path){
  const exePath = getSettingsData()['position_snipaste']
  if (exePath == '') {
    real_notice("没有设置snipasted位置！")
    return;
  }
  return new Promise((resolve, reject) => {
    exec(`"${exePath}" paste --files "${png_path}"`, (err, stdout, stderr) => {
      resolve('ok')
    })
  })
}
ipcMain.handle('open_snipaste_clip', (e) => {
  open_snipaste_clip()
})
function open_snipaste_clip() {
  const exePath = getSettingsData()['position_snipaste']
  if (exePath == ''){
    real_notice("没有设置snipasted位置！")
    return -1
  }
  return new Promise((resolve, reject) => {
    exec(`"${exePath}" paste --clipboard`, (err, stdout, stderr) => {
      resolve('ok')
    })
  })
}
ipcMain.handle('open_url', (e, url) => {
  shell.openExternal(url)
})

// 快捷键更新
ipcMain.handle('hotkey_update', (e, key, value) => {
  try {
    // console.log(key, value)
    if (value != '') {
      const flag = globalShortcut.isRegistered(value)
      if (flag) {
        // console.log('该快捷键已注册')
        return false
      }
    }
    // 修改配置文件
    const setting_data = getSettingsData()
    setting_data[key] = value
    setSettingsData(setting_data)
    // 重新注册
    register_shortcut()
    return true
  } catch (e) {
    return false
  }
})

// 开机启动更新
ipcMain.handle('autostart_on', (e) => {
  autostart_on()
})
ipcMain.handle('autostart_off', (e) => {
  autostart_off()
})

function autostart_on() {
  // const ex=process.execPath;
  // const cmd = `REG ADD HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${pack_name} /t REG_SZ /d "${ex} --openAsHidden" /f`
  // console.log(cmd);
  // exec(cmd,function(err){
  //   console.log(err);
  // });
  if (app.isPackaged) {
    //应用是否打包
    // 设置开机启动
    app.setLoginItemSettings({
      openAtLogin: true,
      args: ['--openAsHidden']
    })
  }
}
function autostart_off() {
  // exec(`REG DELETE HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v ${pack_name} /f`,function(err){
  //   // console.log(err);
  // });
  // const { openAtLogin } = app.getLoginItemSettings({
  //   args: ["--openAsHidden"],
  // });
  // if(openAtLogin){
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: false
    })
  }
  // }
}
function check_need_autostart() {
  const flag = getSettingsData['is_autostart']
  if (flag) autostart_on()
  else autostart_off()
}

function secondsToTimeString(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const hoursStr = String(hours).padStart(2, '0')
  const minutesStr = String(minutes).padStart(2, '0')
  const secondsStr = String(remainingSeconds).padStart(2, '0')

  return `${hoursStr}:${minutesStr}:${secondsStr}`
}
function getFileNameAndExtension(path) {
  const lastSlashIndex = path.lastIndexOf('\\')
  const fileNameWithExtension = path.substring(lastSlashIndex + 1)
  const lastDotIndex = fileNameWithExtension.lastIndexOf('.')

  let fileName, fileExtension

  if (lastDotIndex === -1 || lastDotIndex < fileNameWithExtension.lastIndexOf('\\')) {
    // 没有扩展名或者最后一个点号在最后一个斜杠之后，说明没有扩展名
    fileName = fileNameWithExtension
    fileExtension = ''
  } else {
    fileName = fileNameWithExtension.substring(0, lastDotIndex)
    fileExtension = fileNameWithExtension.substring(lastDotIndex + 1)
  }
  return { fileName, fileExtension }
}

function send_front_msg(msg) {
  // console.log(msg)
  mainWindow.show()
  mainWindow.webContents.send('message_to_render', msg)
}

// 响应快捷键
function shortcut_link() {
  // console.log('shortcut_link')
  // 获取配置
  const setting = getSettingsData()
  // 判断是web 还是本地
  if(player_type==1){
    if(ws_arr.length==0){
      real_notice('未检测到浏览器运行')
      return;
    }
    send_to_all_websocket({
      type:"shortcut_link"
    })
    return;
  }
  // 判断pp是否运行
  const flag = potplayer.getPotplayerHwnd()
  if (flag == -1) {
    real_notice('PotPlayer不在运行或者不是64位！')
    return
  }
  // 获取时间 获取视频位置 获取视频名称
  let seconds = potplayer.getCurrentSecondsTime()
  // console.log(seconds);
  if (seconds <= 0) {
    real_notice('请播放后再获取链接')
    return
  }
  // 获取自定义偏移配置
  if (setting['time_custom'] != 0) seconds += setting['time_custom']
  const time_str = secondsToTimeString(seconds)
  // 从剪切板获取视频路径
  potplayer.getMediaPathToClipboard()
  const source_path = clipboard.readText()
  if (source_path == '') {
    real_notice('视频信息获取失败！clipboard！')
    return
  }
  const { fileName: source_filename, fileExtension: source_ext } = getFileNameAndExtension(source_path)
  // 获取自定义 获取链接后是否暂停播放
  if (setting['is_link_stop']) potplayer.Pause()
  // 生成uuid 存入数据
  const uuid = uuidv4()
  dbHelper.insertInfo(
    uuid,
    JSON.stringify({
      video_path: source_path,
      type: 'potplayer', // web
      target_time: seconds,
      target_time1: 0,
      target_time_str: time_str,
      target_time_str1: '',
      play_type: 'link', // link | ab | ab_circle
      source_filename: source_filename,
      source_ext: source_ext
    })
  )
  // 生成链接 写入剪切板
  let final_link = ''
  // 获取自定义的链接配置
  if (setting['custom_link'] != '') {
    final_link = setting['custom_link']
      .replace('{filename}', source_filename)
      .replace('{ext}', source_ext)
      .replace('{time}', time_str)
      .replace('{link}', `${custom_protocol}://open/${uuid}`)
  } else {
    final_link = `链接: [${source_filename}|${time_str}](${custom_protocol}://open/${uuid})`
  }
  // console.log(final_link);
  clipboard.writeText(final_link)
  real_notice('链接生成成功！按Ctrl+V粘贴！')
}
function shortcut_img() {
  // console.log('shortcut_img')
  // 获取配置
  const setting = getSettingsData()
  // 判断是web 还是本地
  if(player_type==1){
    if(ws_arr.length==0){
      real_notice('未检测到浏览器运行')
      return;
    }
    send_to_all_websocket({
      type:"shortcut_img"
    })
    return;
  }
  // 判断pp是否运行
  const flag = potplayer.getPotplayerHwnd()
  if (flag == -1) {
    real_notice('PotPlayer不在运行或者不是64位！')
    return
  }
  // 获取时间 获取视频位置 获取视频名称
  const seconds = potplayer.getCurrentSecondsTime()
  // console.log(seconds);
  if (seconds <= 0) {
    real_notice('请播放后再获取链接')
    return
  }
  // 获取自定义 获取链接后是否暂停播放
  if (setting['is_link_stop']) potplayer.Pause()
  // 从剪切板获取图片
  potplayer.saveImageToClipboard()
  const native_img = clipboard.readImage()
  clipboard.writeImage(native_img)
  real_notice('截图获取成功！按Ctrl+V粘贴！')
}
function shortcut_img_edit() {
  // console.log('shortcut_img_edit')
  // 判断是web 还是本地
  if(player_type==1){
    if(ws_arr.length==0){
      real_notice('未检测到浏览器运行')
      return;
    }
    send_to_all_websocket({
      type:"shortcut_img_edit"
    })
    return;
  }
  // 获取配置
  const setting = getSettingsData()
  const exePath = setting['position_snipaste']
  if (exePath == '') {
    real_notice('请先设置Snipaste的位置')
    return
  }
  // 判断是web 还是本地 todo
  // 判断pp是否运行
  const flag = potplayer.getPotplayerHwnd()
  if (flag == -1) {
    real_notice('PotPlayer不在运行或者不是64位！')
    return
  }
  // 获取时间 获取视频位置 获取视频名称
  const seconds = potplayer.getCurrentSecondsTime()
  if (seconds <= 0) {
    real_notice('请播放后再获取链接!')
    return
  }
  // 获取自定义 获取链接后是否暂停播放
  if (setting['is_link_stop']) potplayer.Pause()
  // 从剪切板获取图片
  potplayer.saveImageToClipboard()
  const native_img = clipboard.readImage()
  clipboard.writeImage(native_img)
  open_snipaste_clip()
}
let ab_flag = false
let first_info: any = ''
function shortcut_ab() {
  // console.log('shortcut_ab')
  // 判断是web 还是本地
  if(player_type==1){
    if(ws_arr.length==0){
      real_notice('未检测到浏览器运行')
      return;
    }
    send_to_all_websocket({
      type:"shortcut_ab"
    })
    return;
  }
  // 获取配置
  const setting = getSettingsData()
  // 判断是web 还是本地 todo
  // 判断pp是否运行
  const flag = potplayer.getPotplayerHwnd()
  if (flag == -1) {
    real_notice('PotPlayer不在运行或者不是64位！')
    return
  }
  // 获取时间 获取视频位置 获取视频名称
  let seconds = potplayer.getCurrentSecondsTime()
  // console.log(seconds);
  if (seconds <= 0) {
    real_notice('请播放后再获取链接！')
    return
  }
  // 获取自定义偏移配置
  if (setting['time_custom'] != 0) seconds += setting['time_custom']
  const time_str = secondsToTimeString(seconds)

  if (ab_flag == false) {
    //按下a
    // 从剪切板获取视频路径
    potplayer.getMediaPathToClipboard()
    const source_path = clipboard.readText()
    if (source_path == '') {
      real_notice('视频信息获取失败！clipboard！')
      return
    }
    const { fileName: source_filename, fileExtension: source_ext } =
      getFileNameAndExtension(source_path)

    first_info = {
      video_path: source_path,
      target_time: seconds,
      target_time_str: time_str,
      source_filename: source_filename,
      source_ext: source_ext
    }
    ab_flag = true
    real_notice('ab片段[起点]获取成功！再按一次生成链接！')
  } else {
    //按下b
    // 获取自定义 获取链接后是否暂停播放
    if (setting['is_link_stop']) potplayer.Pause()
    // 检查A信息是否有问题
    if (first_info == '') {
      first_info = ''
      ab_flag = false
      real_notice('ab片段信息错误，请重新开始')
      return
    }
    // 生成uuid 存入数据
    const uuid = uuidv4()
    let ab_info = {
      video_path: first_info['video_path'],
      type: 'potplayer', // web
      target_time: seconds,
      target_time1: seconds,
      target_time_str: time_str,
      target_time_str1: time_str,
      play_type: 'ab', // link | ab | ab_circle
      source_filename: first_info['source_filename'],
      source_ext: first_info['source_ext']
    }
    if (first_info['target_time'] < seconds) {
      //b大于a 正常的
      ab_info['target_time'] = first_info['target_time']
      ab_info['target_time_str'] = first_info['target_time_str']
    } else {
      //a大于b 调换
      ab_info['target_time1'] = first_info['target_time']
      ab_info['target_time_str1'] = first_info['target_time_str']
    }
    dbHelper.insertInfo(uuid, JSON.stringify(ab_info))
    // 生成链接 写入剪切板
    let final_link = ''
    // 获取自定义的链接配置
    if (setting['custom_link'] != '') {
      final_link = setting['custom_link']
        .replace('{filename}', ab_info['source_filename'])
        .replace('{ext}', ab_info['source_ext'])
        .replace('{time}', `${ab_info['target_time_str']}-${ab_info['target_time_str1']}`)
        .replace('{link}', `${custom_protocol}://open/${uuid}`)
    } else {
      final_link = `链接: [${ab_info['source_filename']}|${ab_info['target_time_str']}-${ab_info['target_time_str1']}](${custom_protocol}://open/${uuid})`
    }
    // console.log(final_link);
    clipboard.writeText(final_link)
    real_notice('ab片段链接生成成功！按Ctrl+V粘贴！')
    first_info = ''
    ab_flag = false
  }
}
function shortcut_ab_circle() {
  // console.log('shortcut_ab_circle')
  // 判断是web 还是本地
  if(player_type==1){
    if(ws_arr.length==0){
      real_notice('未检测到浏览器运行')
      return;
    }
    send_to_all_websocket({
      type:"shortcut_ab_circle"
    })
    return;
  }
  // 获取配置
  const setting = getSettingsData()
  // 判断是web 还是本地 todo
  // 判断pp是否运行
  const flag = potplayer.getPotplayerHwnd()
  if (flag == -1) {
    real_notice('PotPlayer不在运行或者不是64位！')
    return
  }
  // 获取时间 获取视频位置 获取视频名称
  let seconds = potplayer.getCurrentSecondsTime()
  // console.log(seconds);
  if (seconds <= 0) {
    real_notice('请播放后再获取链接')
    return
  }
  // 获取自定义偏移配置
  if (setting['time_custom'] != 0) seconds += setting['time_custom']
  const time_str = secondsToTimeString(seconds)

  if (ab_flag == false) {
    //按下a
    // 从剪切板获取视频路径
    potplayer.getMediaPathToClipboard()
    const source_path = clipboard.readText()
    if (source_path == '') {
      real_notice('视频信息获取失败！clipboard！')
      return
    }
    const { fileName: source_filename, fileExtension: source_ext } =
      getFileNameAndExtension(source_path)

    first_info = {
      video_path: source_path,
      target_time: seconds,
      target_time_str: time_str,
      source_filename: source_filename,
      source_ext: source_ext
    }
    ab_flag = true
    real_notice('ab片段[起点]获取成功！再按一次生成链接！')
  } else {
    //按下b
    // 获取自定义 获取链接后是否暂停播放
    if (setting['is_link_stop']) potplayer.Pause()
    // 检查A信息是否有问题
    if (first_info == '') {
      first_info = ''
      ab_flag = false
      real_notice('ab循环信息错误，请重新开始！')
      return
    }
    // 生成uuid 存入数据
    const uuid = uuidv4()
    let ab_info = {
      video_path: first_info['video_path'],
      type: 'potplayer', // web
      target_time: seconds,
      target_time1: seconds,
      target_time_str: time_str,
      target_time_str1: time_str,
      play_type: 'ab_circle', // link | ab | ab_circle
      source_filename: first_info['source_filename'],
      source_ext: first_info['source_ext']
    }
    if (first_info['target_time'] < seconds) {
      //b大于a 正常的
      ab_info['target_time'] = first_info['target_time']
      ab_info['target_time_str'] = first_info['target_time_str']
    } else {
      //a大于b 调换
      ab_info['target_time1'] = first_info['target_time']
      ab_info['target_time_str1'] = first_info['target_time_str']
    }
    dbHelper.insertInfo(uuid, JSON.stringify(ab_info))
    // 生成链接 写入剪切板
    let final_link = ''
    // 获取自定义的链接配置
    if (setting['custom_link'] != '') {
      final_link = setting['custom_link']
        .replace('{filename}', ab_info['source_filename'])
        .replace('{ext}', ab_info['source_ext'])
        .replace('{time}', `${ab_info['target_time_str']}~${ab_info['target_time_str1']}`)
        .replace('{link}', `${custom_protocol}://open/${uuid}`)
    } else {
      final_link = `链接: [${ab_info['source_filename']}|${ab_info['target_time_str']}~${ab_info['target_time_str1']}](${custom_protocol}://open/${uuid})`
    }
    // console.log(final_link);
    clipboard.writeText(final_link)
    real_notice('ab循环链接生成成功！按Ctrl+V粘贴！')
    first_info = ''
    ab_flag = false
  }
}
// 测试db
ipcMain.handle('test_db', (e, msg) => {
  const uuid = uuidv4()
  dbHelper.insertInfo(uuid, 'Some detail')
  // console.log('Record inserted successfully.');
  real_notice(`Record inserted successfully.${uuid}`)
})
// 测试all
ipcMain.handle('test_all', (e, index) => {
  const final_link = 'jump://1234/1234'
  if (index == 0) {
    // protocol_off()
    const link = 'jve://open/6f045eed-8c67-4c09-9917-7e7e56787264'
    // const link = 'jve://open/0c1d10fb-b1cf-4ae9-8dc1-7c26536ac38d'
    // const link = 'jve://open/a349b198-79fd-4761-88f0-bff767cfa46b'
    handle_link_jump(link)
  } else if (index == 1) {
    const link = 'jve://open/0c1d10fb-b1cf-4ae9-8dc1-7c26536ac38d'
    handle_link_jump(link)

    // const img_url = 'https://doc.houdunren.com/assets/xj.BkzzMsXj.jpg'
    // const htmlImage = `<img src="${img_url}" />`
    // const htmlContent = `<div>${htmlImage}<p>${final_link}</p></div>`
    // clipboard.write({ html: htmlContent })
  } else if (index == 2) {
    const link = 'jve://open/a349b198-79fd-4761-88f0-bff767cfa46b'
    handle_link_jump(link)

    // const img_url = 'file://C:\\xj.BkzzMsXj.jpg'
    // const htmlImage = `<img src="${img_url}" />`
    // const htmlContent = `<div>${htmlImage}<p>${final_link}</p></div>`
    // clipboard.write({ html: htmlContent })
  } else if (index == 3) {
    const link = 'jve://open/6f045eed-8c67-4c09-9917-7e7e56787265'
    handle_link_jump(link)

    // const img_url = 'C:\\xj.BkzzMsXj.jpg'
    // const htmlImage = `<img src="${img_url}" />`
    // const htmlContent = `<div>${htmlImage}<p>${final_link}</p></div>`
    // clipboard.write({ html: htmlContent })
  } else if (index == 4) {
    // const img_url =
    //   'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAABH2T/ACBk/wEgZP8AH2T/FhzD/ztPc/9cbF7/qz4J/6s+Cf9ealv/WVBV/xocwP8BH2b/ASBk/wAfZP8BIGT/AR9k/wAgZP8AH2T/AB9k/xAdqP8/Lnz/ZT1P/0YmjP9IJ4v/YkJQ/0AwgP8THLT/AB9k/wEgZP8AH2T/ASBk/wEfZP8AIGT/AB9k/wAfY/8GHnv/TTB4/3BKYf82Qtr/MTvY/2o+Xf9KKn7/CB6E/wEgZP8BIGT/AB9k/wEgZP8BH2T/ACBk/wIfY/8gSoj/W5/R/6be9//X+fv/4f77/+D9+//Q9Pn/kdDy/1md0f8mU5D/AR9j/wAfZP8BIGT/AR9k/wEfZP8yZZ7/ec36/6Hg+//h/fr/1fHy/83n7P/T7vH/1fDy/977+v+I1fz/e8/8/0B4r/8AH2T/ASBk/wEfZP8LLXD/dsj1/3vP/P+Txtz/eYaH/1RaX/9GSU7/SU5S/0xTV/+SoKH/hsvt/3vO/f95zPj/DjFy/wEgZP8BH2T/JFGP/3jJ/P9loOf/N0RO/3iEiP+vwsH/bIKe/3aLof+Zqan/VVhc/0hqhv9srPr/eMr9/yZTkf8BIGT/AR9k/yRPjf970P3/d7zk/7vE0P9NYZD/c6PN/57W+/+b1fv/WIOz/zhMg/+coKr/eMPs/3vQ/v8pWJb/ASBk/wEfZP8TNnf/e9D8/5DX/P+0vND/M0iA/1yMvf9vw/z/b8L8/2eRvf8vRX7/0tjk/4PT/f970P3/G0SE/wEgZP8BH2T/AiBl/16k2v970Pz/veb7/5++2v+Czvf/es/9/3vQ/f+F0fn/r9bv/6Te/P970P3/c8Px/wYjaP8BIGT/AR9k/wgncf8YJ7H/T4bW/3bI9P95zfj/e9D9/3vQ/v970P7/e9D+/3vP/f970P3/etD9/0uIvf8DImb/ASBk/w4yc/9kq97/GRvR/xYbw/8cLb3/Q3HR/2u36/97z/z/e9D9/3rP/P90xfL/dsfz/4PA6v+X1vX/YKbX/wEgZP8IKWz/arbi/x8ryP8bHNf/IiTR/19k0P8mLMj/KDnP/zhZ2f8+Y93/NVDY/yAs0f8bHdL/YY7W/1iczv8BIGT/AR9k/wwucf8WMpb/GxvX/z8/3f+xse//jI3k/2ht1f87QMv/GBvN/xsb1/8bHNf/GxzX/xcnsP8IKWz/ASBk/wEfZP8BH2T/AR9l/wwdmP8cHdX/oqPs/+Dh9/+jo+z/NDXc/xkc0v8PHKL/Ch2N/wodjf8CHmr/AB9k/wEgZP8BH2T/AR9k/wEgZf8BH2T/BR53/w8dov8iKbv/GB++/xIcrv8IHoT/AR9k/wAfZP8BIGT/ASBk/wAfZP8AH2T/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
    // const htmlImage = `<img src="${img_url}" />`
    // const htmlContent = `<div>${htmlImage}<p>${final_link}</p></div>`
    // clipboard.write({ html: htmlContent })
  }
})

// 通知
ipcMain.handle('test_notice2', (e) => {
  const isAllowed = Notification.isSupported()
  // console.log('notice', isAllowed)
  if (isAllowed) {
    const options = {
      title: '标题',
      body: '正文文本，显示在标题下方',
      silent: true, // 系统默认的通知声音
      icon: icon // 通知图标
    }
    const notification = new Notification(options)
    notification.on('click', () => {})
    notification.on('show', () => {})
    notification.on('close', () => {})
    notification.show()
  }
})
ipcMain.handle('test_notice', (e, msg) => {
  real_notice(msg)
})

function real_notice(msg) {
  notifier.notify({
    title: '提示',
    body: msg
  })
}

// 注册协议
function protocol_on() {
  let isSet = false // 是否注册成功
  app.removeAsDefaultProtocolClient(custom_protocol) // 每次运行都删除自定义协议 然后再重新注册
  // protocol_off()
  // 开发模式下在window运行需要做兼容
  if (process.env.NODE_ENV === 'development' && process.platform === 'win32') {
    // 设置electron.exe 和 app的路径
    isSet = app.setAsDefaultProtocolClient(custom_protocol, process.execPath, [
      path.resolve(process.argv[1])
    ])
  } else {
    isSet = app.setAsDefaultProtocolClient(custom_protocol)
  }
  // console.log('is_protocol_success:', isSet)
}

function protocol_off() {
  // const flag = app.removeAsDefaultProtocolClient(agreement)
  // const flag2 =  app.setAsDefaultProtocolClient(agreement, process.execPath, [
  //   path.resolve(process.argv[1]),
  // ])
  // console.log(`delete_protocol:${flag}-${flag2}`);
  const cmd = `reg delete "HKEY_CURRENT_USER\\Software\\Classes\\${custom_protocol}" /f`
  exec(cmd, function (err) {
    // console.log(err)
  })
}

// 监听自定义协议唤起
function watchProtocol() {
  // 验证是否为自定义协议的链接
  const AGREEMENT_REGEXP = new RegExp(`^${custom_protocol}://`)
  // mac唤醒应用 会激活open-url事件 在open-url中判断是否为自定义协议打开事件
  // app.on('open-url', (event, url) => {
  // const isProtocol = AGREEMENT_REGEXP.test(url)
  // if (isProtocol) {
  // console.log(`mac自定义协议链接:${url}`);
  // real_notice(url)
  // }
  // })
  // window系统下唤醒应用会激活second-instance事件 它在ready执行之后才能被监听
  app.on('second-instance', (event, commandLine) => {
    // console.log(commandLine)
    // ['C:\\jumpvideo-electron.exe',
    // '--allow-file-access-from-files','jve://open/cd3daa5b-e2c1-4146-8bf0-1f50927c1d7e']
    // commandLine 是一个数组， 唤醒的链接作为数组的一个元素放在这里面
    commandLine.forEach((str) => {
      if (AGREEMENT_REGEXP.test(str)) {
        // console.log(`win自定义协议链接:${str}`);
        handle_link_jump(str)
      }
    })
  })
}

//处理链接跳转
function handle_link_jump(link_str) {
  // real_notice(link_str)
  // console.log(link_str);
  let uuid = link_str.replace(`${custom_protocol}://open/`, '')
  let data = dbHelper.getInfoByUUID(uuid)
  if (data == undefined || data == '') {
    // console.log('data notfound')
    real_notice('链接数据不存在！')
    return
  }
  const json_data = JSON.parse(data['detail'])
  // console.log(json_data);
  const final_type = `${json_data['type']}_${json_data['play_type']}`
  if (final_type == 'potplayer_link') potplayer_link(json_data)
  else if (final_type == 'potplayer_ab') potplayer_ab(json_data)
  else if (final_type == 'potplayer_ab_circle') potplayer_ab_circle(json_data)
  else if (final_type == 'web_link') web_link(json_data)
  else if (final_type == 'web_ab') web_ab(json_data)
  else if (final_type == 'web_ab_circle') web_ab_circle(json_data)
  else real_notice('错误的链接类型！')
}
let interval_spy:any = null;
let total_play = 0;
let open_pp_delay=3000;
function potplayer_link(json_data) {

  potplayer.cancelTheABCycle()
  // 获取配置
  const setting = getSettingsData()
  open_pp_delay = setting['wait_pp']*1000
  // 检测potplayer 是否运行
  const flag = potplayer.getPotplayerHwnd()
  if (flag == -1) {
    //没有运行
    // 检测pot是否设置位置
    if (setting['position_potplayer'] == '') {
      real_notice('请设置potplayer所在位置')
      return
    }
    // 新打开播放器，并跳转到指定位置
    open_potplayer_new( setting['position_potplayer'], json_data['video_path'], json_data['target_time_str'] )
    setTimeout(() => {
      real_notice('打开成功！')
      potplayer.play()
    }, open_pp_delay);
  } else {
    //正在运行
    // 是，检测是不是播放当前的这个视频，,
    potplayer.getMediaPathToClipboard()
    const source_path = clipboard.readText()
    // 是，直接跳转
    // console.log(source_path);
    // console.log(json_data['video_path']);
    if (source_path == json_data['video_path']) {
      potplayer.setCurrentSecondsTime(json_data['target_time'])
      potplayer.play()
      real_notice('跳转成功！')
      // 设置pot在前台
      // potplayer.toggle_top()
      // setTimeout(() => {
      //   potplayer.togole_switch_top()
      // }, 1000);
    } else {
      // 否
      open_potplayer_current( setting['position_potplayer'], json_data['video_path'], json_data['target_time_str'] )
      setTimeout(() => {
        potplayer.play()
        real_notice('跳转成功！')
      }, open_pp_delay);
      // 设置pot在前台
      // potplayer.toggle_top()
      // setTimeout(() => {
      //   potplayer.togole_switch_top()
      // }, 1000);
    }
  }
}
function potplayer_ab(json_data) {
  potplayer.cancelTheABCycle()
  // 获取配置
  const setting = getSettingsData()
  open_pp_delay = setting['wait_pp']*1000
  // 获取片段时常
  const duration = json_data['target_time1'] - json_data['target_time']
  // 检测potplayer 是否运行
  const flag = potplayer.getPotplayerHwnd()
  if (flag == -1) {
    //没有运行
    // 检测pot是否设置位置
    if (setting['position_potplayer'] == '') {
      real_notice('请设置potplayer所在位置')
      return
    }
    // 新打开播放器，并跳转到指定位置
    open_potplayer_new( setting['position_potplayer'], json_data['video_path'], json_data['target_time_str'] )
    // 循环检测播放时间，到达时间后停止
    // 同一时间，只能有一个循环检测进程
    setTimeout(() => {
      potplayer.play()
      start_interval_spy(duration,json_data)
      real_notice('[ab片段]打开成功！')
    }, open_pp_delay);
  } else {
    //正在运行
    // 是，检测是不是播放当前的这个视频，,
    potplayer.getMediaPathToClipboard()
    const source_path = clipboard.readText()
    // 是，直接跳转
    // console.log(source_path);
    // console.log(json_data['video_path']);
    if (source_path == json_data['video_path']) {
      potplayer.setCurrentSecondsTime(json_data['target_time'])
      potplayer.play()
      start_interval_spy(duration,json_data)
      real_notice('[ab片段]跳转成功！')
    } else {
      // 否
      open_potplayer_current( setting['position_potplayer'], json_data['video_path'], json_data['target_time_str'] )
      setTimeout(() => {
        potplayer.play()
        start_interval_spy(duration,json_data)
        real_notice('[ab片段]跳转成功！')
      }, open_pp_delay);
    }
  }
}
function start_interval_spy(duration,json_data){
  if(interval_spy!=null)clearInterval(interval_spy);
  interval_spy = setInterval(()=>{
    // 停止条件判断
    const flag = potplayer.getPotplayerHwnd()
    if (flag == -1) {
      stop_interval_spy()
    }
    if(potplayer.getPlayStatus()!='Running'){
      stop_interval_spy()
    }
    if(total_play>=(duration+1)){
      stop_interval_spy()
    }
    let cur_seconds = potplayer.getCurrentSecondsTime()
    if(cur_seconds>=json_data['target_time1']){
      potplayer.Pause()
      stop_interval_spy()
    }
    total_play+=1;
  },1000)
}
function stop_interval_spy(){
  clearInterval(interval_spy);
  interval_spy=null;
  total_play=0
}
function potplayer_ab_circle(json_data) {
  potplayer.cancelTheABCycle()
  // console.log('potplayer_ab_circle');
  // console.log(json_data);
  // 获取配置
  const setting = getSettingsData()
  open_pp_delay = setting['wait_pp']*1000
  // 检测potplayer 是否运行
  const flag = potplayer.getPotplayerHwnd()
  if (flag == -1) {
    //没有运行
    // 检测pot是否设置位置
    if (setting['position_potplayer'] == '') {
      real_notice('请设置potplayer所在位置')
      return
    }
    // 新打开播放器，并跳转到指定位置
    open_potplayer_new( setting['position_potplayer'], json_data['video_path'], json_data['target_time_str'])
      setTimeout(() => {
        potplayer.setStartPointOfTheABCycle()
        potplayer.setCurrentSecondsTime(json_data['target_time1'])
        potplayer.setEndPointOfTheABCycle()
        potplayer.play()
        real_notice('[ab循环]打开成功！')
      }, open_pp_delay);
  } else {
    //正在运行
    // 是，检测是不是播放当前的这个视频，,
    potplayer.getMediaPathToClipboard()
    const source_path = clipboard.readText()
    // 是，直接跳转
    // console.log(source_path);
    // console.log(json_data['video_path']);
    if (source_path == json_data['video_path']) {
      potplayer.setCurrentSecondsTime(json_data['target_time'])
      potplayer.setStartPointOfTheABCycle()
      potplayer.setCurrentSecondsTime(json_data['target_time1'])
      potplayer.setEndPointOfTheABCycle()
      potplayer.play()
      real_notice('[ab循环]跳转成功！')
    } else {
      // 否
      open_potplayer_current( setting['position_potplayer'], json_data['video_path'], json_data['target_time_str'] )
      setTimeout(() => {
        potplayer.setStartPointOfTheABCycle()
        potplayer.setCurrentSecondsTime(json_data['target_time1'])
        potplayer.setEndPointOfTheABCycle()
        potplayer.play()
        real_notice('[ab循环]跳转成功！')
      }, open_pp_delay);
    }
  }
}
// web跳转
function web_link(json_data){
  // 如果没有一个video，就打开浏览器
  if(ws_arr.length!=0){
    send_to_all_websocket({ type:"jump", data:json_data })
  }else{
    let urlobj = parseUrl(json_data['video_path'])
    urlobj.query['jve'] = json_data['target_time']
    const url = buildUrl(urlobj)
    shell.openExternal(url)
  }
}
function web_ab(json_data){
  // 如果没有一个video，就打开浏览器
  if(ws_arr.length!=0){
    send_to_all_websocket({ type:"jump", data:json_data })
  }else{
    let urlobj = parseUrl(json_data['video_path'])
    urlobj.query['jve'] = json_data['target_time']+'-'+json_data['target_time1']
    const url = buildUrl(urlobj)
    shell.openExternal(url)
  }
}
function web_ab_circle(json_data){
  // 如果没有一个video，就打开浏览器
  if(ws_arr.length!=0){
    send_to_all_websocket({ type:"jump", data:json_data })
  }else{
    let urlobj = parseUrl(json_data['video_path'])
    urlobj.query['jve'] = json_data['target_time']+'~'+json_data['target_time1']
    const url = buildUrl(urlobj)
    shell.openExternal(url)
  }
}

// 悬浮窗
ipcMain.on('open-float-window', () => {
  if (!floatWindow) {
    // createFloatWindow();
  } else {
    // floatWindow.webContents.openDevTools()
    if (floatWindow.isVisible()) {
      floatWindow.hide();
    } else {
      floatWindow.show();
    }
  }
});

ipcMain.on('close-float-window', () => {
  if (floatWindow) {
    // floatWindow.close();
    floatWindow.hide();
    // floatWindow = null;
  }
});

ipcMain.on('toggle-always-on-top', () => {
  if (floatWindow) {
    const isAlwaysOnTop = floatWindow.isAlwaysOnTop();
    floatWindow.setAlwaysOnTop(!isAlwaysOnTop);
  }
});

ipcMain.on('shortcut_link', () => {
  shortcut_link()
});
ipcMain.on('shortcut_img', () => {
  shortcut_img()
});
ipcMain.on('shortcut_img_edit', () => {
  shortcut_img_edit()
});
ipcMain.on('shortcut_ab', () => {
  shortcut_ab()
});
ipcMain.on('shortcut_ab_circle', () => {
  shortcut_ab_circle()
});

// srt字幕转换
ipcMain.handle('trans_srt', (e, arr) => {
  // console.log(arr);
  const video_path = arr[0];
  const srt_path = arr[1];
  const trans_type = arr[2];
  const is_text_check = arr[3];
  const { fileName: source_filename, fileExtension: source_ext } = getFileNameAndExtension(video_path)
  let srt_text = ''
  // 处理srt数据
  const processedData = processFile(srt_path);
  if(!processedData)return false;
  // console.log(processedData[0]);
  // 获取配置
  const setting = getSettingsData()
  // 展示返回前端的arr
  let all_link_arr:any[] = []
  // [ index: '6', time_str1: '00:00:23', time_str2: '00:00:26', time1: 23, time2: 26, text: '并且还可以进行一个截图' ]
  for (let i = 0; i < processedData.length; i++) {
    if(is_text_check) srt_text= processedData[i]['text']
    let play_type = 'link'
    let time_str = ''
    if(trans_type==0){
      play_type = 'link'
      time_str = processedData[i]['time_str1']
    }else if(trans_type==1){
      play_type = 'ab'
      time_str = processedData[i]['time_str1']+'-'+processedData[i]['time_str2']
    }else if(trans_type==2){
      play_type = 'ab_circle'
      time_str = processedData[i]['time_str1']+'~'+processedData[i]['time_str2']
    }else{
      return false;
    }
    const uuid = uuidv4()
    const info = {
      video_path: video_path,
      type: 'potplayer', // web
      target_time: processedData[i]['time1'],
      target_time1: processedData[i]['time2'],
      target_time_str: processedData[i]['time_str1'],
      target_time_str1: processedData[i]['time_str2'],
      play_type: play_type, // link | ab | ab_circle
      source_filename: source_filename,
      source_ext: source_ext
    }
    dbHelper.insertInfo( uuid, JSON.stringify(info) )
    // 生成链接 写入剪切板
    let final_link = ''
    // 获取自定义的链接配置
    if (setting['custom_link'] != '') {
      final_link = setting['custom_link']
        .replace('{filename}', source_filename)
        .replace('{srt}', srt_text)
        .replace('{ext}', source_ext)
        .replace('{time}', time_str)
        .replace('{link}', `${custom_protocol}://open/${uuid}`)
    } else {
      final_link = `链接: [${srt_text}|${time_str}](${custom_protocol}://open/${uuid})`
    }
    all_link_arr.push(final_link)
  }
  // return all_link_arr;
  clipboard.writeText(all_link_arr.join("\n"))
  return true;
})

interface Subtitle {
  index: string;
  time_str1: string;
  time_str2: string;
  time1: number;
  time2: number;
  text: string;
}

function timeToSeconds(time) {
  time = time.split(",")[0]
  const [hours, minutes, seconds] = time.split(':');
  return parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10) ;
}

function processFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const result: Subtitle[] = [];
    for (let i = 0; i < lines.length; i+=3) {
        const tempData: Partial<Subtitle> = {};
        tempData["index"] = lines[i]
        if (lines[i+1].includes('-->')) {
            const [start, end] = lines[i+1].split(' --> ');
            tempData["time_str1"] = start.split(",")[0]
            tempData["time_str2"] = end.split(",")[0]
            const startTimeInSeconds = timeToSeconds(start);
            const endTimeInSeconds = timeToSeconds(end);
            tempData["time1"] = startTimeInSeconds
            tempData["time2"] = endTimeInSeconds
        } else {
            return false
        }
        tempData["text"] = lines[i+2]
        result.push(tempData as Subtitle);
    }
    return result;
  } catch (error) {
    return false
  }
}

// 从markdown2potplayer迁移
ipcMain.handle('from_m2p', (e,md_path) => {
  // 拿到文件循环读取
  // 如果包含jv://协议，替换。插入数据库，并生成新的连接
  // 合并处理完的数组，并到保存到置顶位置，+[trans?]
  try {
    const { fileName: source_filename, fileExtension: source_ext } = getFileNameAndExtension(md_path)
    const fileContent = fs.readFileSync(md_path, 'utf8');
    const lines = fileContent.split('\n');
    if(lines.length<=0)return false;
    let final_arr:any[] = []
    for (let i = 0; i < lines.length; i++) {
      if(lines[i].indexOf("jv://open")!=-1){
        const p_str = handle_from_m2p_line(lines[i])
        if(!p_str)return false;
        final_arr.push(p_str)
      }else{
        final_arr.push(lines[i])
      }
    }
    const target_p = md_path.replace(source_filename,source_filename+'[处理后]')
    fs.writeFileSync(target_p, final_arr.join("\n"), 'utf8');
    return target_p;
  } catch (error) {
    return false;
  }
})

function handle_from_m2p_line(line){
  const row_line  = line
  // 例如： 视频:[3 | 50](jv://open?path=C%3A%5CDesktop%5Ctest.mp4&time=50)<br/>
  // 例如： 视频:[3 | 55-58](jv://open?path=C%3A%5CDesktop%5Ctest.mp4&time=55-58)<br/>
  // 例如： 视频:[3 | 58∞01:01](jv://open?path=C%3A%5CDesktop%5Ctest.mp4&time=58∞01:01)<br/>
  // 视频:[3.mp4 | 02:25](jv://open?path=C:\Users\GM\Desktop\3.mp4&time=02:25)
  // 视频:[3.mp4 | 02:25-02:31](jv://open?path=C:\Users\GM\Desktop\3.mp4&time=02:25-02:31)
  // 视频:[3.mp4 | 02:31∞02:37](jv://open?path=C:\Users\GM\Desktop\3.mp4&time=02:31∞02:37)
  // 视频:[1.基础语法.mp4 | 01:44:51](jv://open?path=C:\Users\GM\Desktop\1.基础语法.mp4&time=01:44:51)
  const result = extractFirstJvContent(line);//输出 'jv://open?path=C%3A%5CDesktop%5Ctest.mp4&time=50'
  if(!result) return line;
  line = result
  // 解析m2p的链接，插入数据库，并生成新的连接
  if(line.indexOf('%3A%5')!=-1)line = decodeURIComponent(line);
  const parms = line.replace("jv://open?path=","").split("&")
  const file_path = parms[0]
  const time_str = parms[1].replace("time=","")
  let time_seconds=0
  let time_seconds1=0
  let play_type = 'link'
  if(time_str.indexOf('-')!=-1){
    time_seconds = timeStringToSeconds(time_str.split('-')[0])
    time_seconds1 =  timeStringToSeconds(time_str.split('-')[1])
    play_type = 'ab'
  }else if(time_str.indexOf('∞')!=-1){
    time_seconds = timeStringToSeconds(time_str.split('∞')[0])
    time_seconds1 =  timeStringToSeconds(time_str.split('∞')[1])
    play_type = 'ab_circle'
  }else{
    time_seconds = timeStringToSeconds(time_str)
    play_type = 'link'
  }
  const uuid = uuidv4()
  const info = {
    video_path: file_path,
    type: 'potplayer', // web
    target_time: time_seconds,
    target_time1: time_seconds1,
    target_time_str: '',
    target_time_str1: '',
    play_type: play_type, // link | ab | ab_circle
    source_filename: '',
    source_ext: ''
  }
  dbHelper.insertInfo( uuid, JSON.stringify(info) )
  const replacement = `${custom_protocol}://open/${uuid}`;
  return replaceFirstJvContent(row_line, replacement);
}

// 从旧jumpvideo迁移
ipcMain.handle('from_old_jv', (e,md_path) => {
  // 拿到文件循环读取
  // 如果包含jv://协议，替换。插入数据库，并生成新的连接
  // 合并处理完的数组，并到保存到置顶位置，+[trans?]
  try {
    const { fileName: source_filename, fileExtension: source_ext } = getFileNameAndExtension(md_path)
    const fileContent = fs.readFileSync(md_path, 'utf8');
    const lines = fileContent.split('\n');
    if(lines.length<=0)return false;
    let final_arr:any[] = []
    for (let i = 0; i < lines.length; i++) {
      if(lines[i].indexOf("jv://jump")!=-1){
        const p_str = handle_from_oldjv_line(lines[i])
        if(!p_str)return false;
        final_arr.push(p_str)
      }else{
        final_arr.push(lines[i])
      }
    }
    const target_p = md_path.replace(source_filename,source_filename+'[处理后]')
    fs.writeFileSync(target_p, final_arr.join("\n"), 'utf8');
    return target_p;
  } catch (error) {
    return false;
  }
})

function handle_from_oldjv_line(line){
  const row_line  = line
  // 例如： [00:00:03.883](jv://jump?url=C:/Users/Administrator/Videos/测试.mp4&time=00:00:03.883)
  // 例如： [00:00:34.142](jv://jump?url=https://www.douyin.com/video/7325430047555325220?modeFrom=&time=00:00:34.142)
  // &time=00:00:14.896 单连接
  // &time=00:00:01.299-00:00:02.266 片段
  // &time=00:00:01.299~00:00:02.266 循环
  const result = extractFirstJvContent(line);//输出 'jv://open?path=C%3A%5CDesktop%5Ctest.mp4&time=50'
  if(!result) return line;
  line = result
  // 解析old_jv的链接，插入数据库，并生成新的连接
  // if(line.indexOf('%3A%5')!=-1)line = decodeURIComponent(line);
  const parms = line.replace("jv://jump?url=","").split("&time=")
  const file_path = parms[0]
  const time_str = parms[1]
  let time_seconds=0
  let time_seconds1=0
  let play_type = 'link'
  if(time_str.indexOf('-')!=-1){
    time_seconds = timeStringToSeconds(time_str.split('-')[0])
    time_seconds1 =  timeStringToSeconds(time_str.split('-')[1])
    play_type = 'ab'
  }else if(time_str.indexOf('~')!=-1){
    time_seconds = timeStringToSeconds(time_str.split('~')[0])
    time_seconds1 =  timeStringToSeconds(time_str.split('~')[1])
    play_type = 'ab_circle'
  }else{
    time_seconds = timeStringToSeconds(time_str)
    play_type = 'link'
  }
  let player_type = 'potplayer'
  if(file_path.startsWith('http')){
    player_type = 'web'
  }
  const uuid = uuidv4()
  const info = {
    video_path: get_pure_url(file_path),
    type: player_type, // web
    target_time: time_seconds,
    target_time1: time_seconds1,
    target_time_str: '',
    target_time_str1: '',
    play_type: play_type, // link | ab | ab_circle
    source_filename: '',
    source_ext: ''
  }
  dbHelper.insertInfo( uuid, JSON.stringify(info) )
  const replacement = `${custom_protocol}://open/${uuid}`;
  return replaceFirstJvContent(row_line, replacement);
}

function extractFirstJvContent(text) {
  const regex = /\((jv:[^\)]+)\)/;
  const match = text.match(regex);
  if (match) {
    return match[1];
  }
  return null;
}
function replaceFirstJvContent(text, replacement) {
  const regex = /\((jv:[^\)]+)\)/;
  const match = text.match(regex);
  if (match) {
    return text.replace(match[1], replacement);
  }
  return text;
}
function timeStringToSeconds(timeString) {
  const timeParts = timeString.split(':').reverse();

  let seconds = 0;

  if (timeParts.length > 0) {
      seconds += parseInt(timeParts[0], 10);
  }
  if (timeParts.length > 1) {
      seconds += parseInt(timeParts[1], 10) * 60;
  }
  if (timeParts.length > 2) {
      seconds += parseInt(timeParts[2], 10) * 3600;
  }

  return seconds;
}
// 处理自动更新
// ipcMain.handle('checkForUpdates', (e) => {
//   autoUpdater.checkForUpdates()
// })
// ipcMain.handle('downloadUpdate', (e) => {
//   autoUpdater.downloadUpdate()
// })

if (gotTheLock){
// ws-服务器
const WebSocketServer = WebSocket.Server
const wss = new WebSocketServer({ port: 6349 })

wss.on('connection', (ws) => {
  ws_arr.push(ws)
  // console.log(ws_arr.length);
  // console.log('client connected')
  ws.on('message', (message) => {
    // console.log(message)
    const msg = JSON.parse(message.toString())
    // console.log(msg);
    if(msg['type']=='notice'){
      real_notice(msg['data'])
    }else if(msg['type']=='shortcut_link'){
      // 获取信息，插入数据库，生成协议，放到剪切板
      const setting = getSettingsData()
      const info = msg['data']
      if (setting['time_custom'] != 0){
        info['target_time'] += setting['time_custom']
        info['target_time_str'] =secondsToTimeString(info['target_time'])
      }
      const uuid = uuidv4()
      dbHelper.insertInfo(uuid,JSON.stringify(info))
      // 生成链接 写入剪切板
      let final_link = ''
      // 获取自定义的链接配置
      if (setting['custom_link'] != '') {
        final_link = setting['custom_link']
          .replace('{filename}', info['source_filename'])
          .replace('{ext}', info['source_ext'])
          .replace('{time}', info['target_time_str'])
          .replace('{link}', `${custom_protocol}://open/${uuid}`)
      } else {
        final_link = `链接: [${info['source_filename']}|${info['target_time_str']}](${custom_protocol}://open/${uuid})`
      }
      // console.log(final_link);
      clipboard.writeText(final_link)
      real_notice('链接生成成功！按Ctrl+V粘贴！')
    }else if(msg['type']=='shortcut_img'){
      let image_base64 = msg['data']['imgbase64'];
      let base64Data = image_base64.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
      let native_img = nativeImage.createFromDataURL(`data:image/png;base64,${base64Data}`);
      clipboard.writeImage(native_img)
      real_notice('截图获取成功！按Ctrl+V粘贴！')
    }else if(msg['type']=='shortcut_img_edit'){
      const file_path = saveBase64ImageToTemp(msg['data']['imgbase64'])
      open_snipaste_file(file_path)
    }else if(msg['type']=='shortcut_ab'){
      const setting = getSettingsData()
      const info = msg['data']
      if (setting['time_custom'] != 0){
        info['target_time'] += setting['time_custom']
        info['target_time_str'] =secondsToTimeString(info['target_time'])
        info['target_time1'] += setting['time_custom']
        info['target_time_str1'] =secondsToTimeString(info['target_time1'])
      }
      const uuid = uuidv4()
      dbHelper.insertInfo(uuid,JSON.stringify(info))
      // 生成链接 写入剪切板
      let final_link = ''
      // 获取自定义的链接配置
      if (setting['custom_link'] != '') {
        final_link = setting['custom_link']
          .replace('{filename}', info['source_filename'])
          .replace('{ext}', info['source_ext'])
          .replace('{time}', `${info['target_time_str']}-${info['target_time_str1']}`)
          .replace('{link}', `${custom_protocol}://open/${uuid}`)
      } else {
        final_link = `链接: [${info['source_filename']}|${info['target_time_str']}-${info['target_time_str1']}](${custom_protocol}://open/${uuid})`
      }
      // console.log(final_link);
      clipboard.writeText(final_link)
      real_notice('ab片段链接生成成功！按Ctrl+V粘贴！')
    }else if(msg['type']=='shortcut_ab_circle'){
      const setting = getSettingsData()
      const info = msg['data']
      if (setting['time_custom'] != 0){
        info['target_time'] += setting['time_custom']
        info['target_time_str'] =secondsToTimeString(info['target_time'])
        info['target_time1'] += setting['time_custom']
        info['target_time_str1'] =secondsToTimeString(info['target_time1'])
      }
      const uuid = uuidv4()
      dbHelper.insertInfo(uuid,JSON.stringify(info))
      // 生成链接 写入剪切板
      let final_link = ''
      // 获取自定义的链接配置
      if (setting['custom_link'] != '') {
        final_link = setting['custom_link']
          .replace('{filename}', info['source_filename'])
          .replace('{ext}', info['source_ext'])
          .replace('{time}', `${info['target_time_str']}~${info['target_time_str1']}`)
          .replace('{link}', `${custom_protocol}://open/${uuid}`)
      } else {
        final_link = `链接: [${info['source_filename']}|${info['target_time_str']}~${info['target_time_str1']}](${custom_protocol}://open/${uuid})`
      }
      // console.log(final_link);
      clipboard.writeText(final_link)
      real_notice('ab循环链接生成成功！按Ctrl+V粘贴！')
    }
  })
  // 处理连接关闭
  ws.on('close', () => {
    // console.log('Client disconnected');
    removeClient(ws);
  });
  // 处理错误
  ws.on('error', (error) => {
    // console.log('Error occurred:', error);
    removeClient(ws);
  });
})
}
// 从数组中移除无效连接
function removeClient(ws) {
  const index = ws_arr.indexOf(ws);
  if (index !== -1) {
    ws_arr.splice(index, 1);
    // console.log('Client removed');
  }
}

function send_to_all_websocket(msg){
  for (let i = 0; i < ws_arr.length; i++) {
    try {
      if(ws_arr[i])ws_arr[i].send(JSON.stringify(msg))
    } catch (error) { /* empty */ }
  }
}

function saveBase64ImageToTemp(base64Data) {
    const base64Image = base64Data.split(';base64,').pop();
    const tempDir = os.tmpdir();
    const fileName = `image_${Date.now()}.png`;
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });
    return filePath;
}
const black_query = ["csource", "spm_id_from"];
function parseUrl(url) {
  const urlObj = new URL(url);
  const queryParams = {};
  urlObj.searchParams.forEach((value, key) => {
    if (black_query.includes(key)) return;
    queryParams[key] = value;
  });
  return {
    protocol: urlObj.protocol,
    username: urlObj.username,
    password: urlObj.password,
    hostname: urlObj.hostname,
    port: urlObj.port,
    pathname: urlObj.pathname,
    search: urlObj.search,
    query: queryParams,
    hash: urlObj.hash,
  };
}

function buildUrl(parsedUrl) {
  const urlObj = new URL(`${parsedUrl.protocol}//${parsedUrl.hostname}`);
  if (parsedUrl.username) {
    urlObj.username = parsedUrl.username;
  }
  if (parsedUrl.password) {
    urlObj.password = parsedUrl.password;
  }
  if (parsedUrl.port) {
    urlObj.port = parsedUrl.port;
  }
  urlObj.pathname = parsedUrl.pathname;
  Object.keys(parsedUrl.query).forEach((key) => {
    urlObj.searchParams.append(key, parsedUrl.query[key]);
  });
  if (parsedUrl.hash) {
    urlObj.hash = parsedUrl.hash;
  }
  return urlObj.toString();
}
function get_pure_url(url){
  return buildUrl(parseUrl(url))
}
