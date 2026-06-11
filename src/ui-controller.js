/**
 * UIController —— UI 事件绑定、对话框、彩蛋
 * 管理所有用户交互，把事件绑定从 HTML 移到 JS
 */
import { Config } from './config.js';

export class UIController {
  /** @type {Object} DOM 引用 */
  #els = {};

  /**
   * @param {Object} elements - DOM 元素集合
   */
  constructor(elements) {
    this.#els = elements;
  }

  /** 绑定所有事件 */
  bindAll() {
    this.#bindSendButton();
    this.#bindYibianButton();
    this.#bindDialogButtons();
    this.#bindAddonUpload();
    this.#bindFileUpload();
    this.#bindEasterEggs();
    this.#bindNetworkEvents();
  }

  /** 发送按钮 */
  #bindSendButton() {
    this.#els.sendBtn.addEventListener('click', () => {
      // 触发主类的 send 流程 —— 通过事件回调
      this.#els.sendBtn.dispatchEvent(new CustomEvent('gsend', { bubbles: true }));
    });
  }

  /** "被欺负了" 一键填充 */
  #bindYibianButton() {
    this.#els.yibianBtn.addEventListener('click', () => {
      this.#els.roleInput.value = '博丽灵梦';
      this.#els.textInput.value = '有妖怪正在发动异变！快去退治！';
      Qmsg.info('将"有妖怪"替换成欺负你的妖怪！');
    });
  }

  /** 对话框开关 */
  #bindDialogButtons() {
    // Addon 对话框
    document.querySelector('[data-dialog="mods"]')?.addEventListener('click', () => {
      this.#els.modsDialog.style.display = 'block';
    });
    // 礼物盒
    document.querySelector('[data-dialog="gifts"]')?.addEventListener('click', () => {
      this.#els.giftsDialog.style.display = 'block';
    });
    // 宣传页
    document.querySelector('[data-dialog="ads"]')?.addEventListener('click', () => {
      this.#els.adsDialog.style.display = 'block';
    });
  }

  /** Addon 上传 */
  #bindAddonUpload() {
    this.#els.uploadAddonBtn?.addEventListener('click', () => {
      this.#els.addonFileInput.click();
    });
    this.#els.addonFileInput?.addEventListener('change', function () {
      const sign = document.getElementById('ufv');
      if (sign) sign.textContent = this.value || '未选择文件';
    });
  }

  /** 本地 Addon 文件加载 */
  #bindFileUpload() {
    this.#els.upmBtn?.addEventListener('click', () => {
      this.#els.upmBtn.dispatchEvent(new CustomEvent('gloadfile', { bubbles: true }));
    });
  }

  /** 灵梦 / 小伞 彩蛋 */
  #bindEasterEggs() {
    if (Config.get('ui.features.kogasaEasterEgg')) {
      this.#els.kogasaImg?.addEventListener('click', async () => {
        await this.#updateCounter('kogasa.gensokyo.mail', this.#els.kogasaCount);
        Qmsg.info('咱好恨呀~');
      });
    }
    if (Config.get('ui.features.reimuEasterEgg')) {
      this.#els.reimuImg?.addEventListener('click', async () => {
        await this.#updateCounter('reimu.gensokyo.mail', this.#els.reimuCount);
        Qmsg.info('(赛钱箱)叮！');
      });
    }
  }

  /** 更新彩蛋计数 */
  async #updateCounter(host, target) {
    try {
      const resp = await fetch(`https://finicounter.eu.org/counter?host=${host}`, {
        signal: AbortSignal.timeout(10000)
      });
      const data = await resp.json();
      target.textContent = data.views;
    } catch {
      // 静默失败，彩蛋不影响功能
    }
  }

  /** 在线/离线检测 */
  #bindNetworkEvents() {
    window.addEventListener('offline', () => {
      Qmsg.error('网络连接已断开，部分功能不可用');
      const banner = document.getElementById('offline-banner');
      if (banner) banner.style.display = 'block';
    });
    window.addEventListener('online', () => {
      Qmsg.success('网络已恢复');
      const banner = document.getElementById('offline-banner');
      if (banner) banner.style.display = 'none';
    });
  }
}
