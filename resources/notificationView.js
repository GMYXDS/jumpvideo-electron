var matchHtmlRegExp = /["'&<>]/;

function escapeHtml(string) {
  var str = '' + string;
  var match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
}

class NotificationView {
  constructor(id, options) {
    this.element = document.getElementById('notification');
    this.iconEl = document.getElementById('icon');
    this.titleEl = document.getElementById('title');
    this.messageEl = document.getElementById('message');
    this.buttonsEl = document.getElementById('buttons');
    this.closeIconEl = document.getElementById('close-icon');
    this.audioElement = document.getElementById('beep');
    this.id = id;
    this.options = options;
    this.render();
    this.addEventListener();
    this.playAudio();
  }

  addEventListener() {
    this.element.addEventListener(
      'click',
      () => {
        window.electron.ipcRenderer.send('notifier.click', this.id);
      },
      false
    );
    this.closeIconEl.addEventListener(
      'click',
      (e) => {
        // 关闭事件不触发 notifier.click
        e.stopPropagation();
        window.electron.ipcRenderer.send('notifier.close', this.id);
      },
      false
    );
  }

  playAudio() {
    if (!this.options.silent) {
      this.audioElement.play();
      // this.audioElement.addEventListener("canplaythrough", event => {
      //   /* 音频可以播放；如果权限允许则播放 */
      //   this.audioElement.play();
      // });
    }
  }

  render() {
    this.titleEl.innerHTML = this.options.title;
    if (this.options.icon) {
      this.iconEl.src = this.options.icon;
    } else {
      this.element.classList.add('noIcon');
      this.iconEl.parentElement.removeChild(this.iconEl);
    }

    if (this.options.body) {
      this.messageEl.innerHTML = escapeHtml(this.options.body);
    } else {
      const parent = this.messageEl.parentElement;
      parent.classList.add('onlyTitle');
      parent.removeChild(this.messageEl);
    }
  }
}
export default NotificationView;
