/**
 * BackgroundManager —— 背景管理
 * 随时间切换背景渐变/图片 + 毛玻璃效果
 * 配置在 config.json → background
 */
import { Config } from './config.js';

export class BackgroundManager {
  /** @type {string} 当前时间段 key */
  #currentPeriod = null;

  /** @type {number} 定时器 ID */
  #timer = null;

  /**
   * 启动背景系统
   */
  start() {
    if (!Config.get('background.enabled')) {
      console.log('[Background] 背景系统未启用');
      return;
    }

    // 设置毛玻璃 blur
    const blur = Config.get('background.blur') || '8px';
    document.documentElement.style.setProperty('--glass-blur', blur);

    // 立即应用当前时段的背景
    this.#apply();

    // 每分钟检查一次时段切换
    if (Config.get('background.timeBased')) {
      this.#timer = setInterval(() => this.#apply(), 60000);
      console.log('[Background] 时间背景已启动，当前时段:', this.#currentPeriod);
    }
  }

  /**
   * 停止背景系统
   */
  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  /**
   * 根据当前时间匹配时段并应用背景
   */
  #apply() {
    const periods = Config.get('background.periods') || {};
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour + minute / 60; // 浮点小时，如 17.5 = 17:30

    let matched = null;

    for (const [key, p] of Object.entries(periods)) {
      const start = p.start;
      const end = p.end;

      // 跨午夜时段（如 20→5）
      if (start > end) {
        if (time >= start || time < end) {
          matched = { key, ...p };
          break;
        }
      } else {
        if (time >= start && time < end) {
          matched = { key, ...p };
          break;
        }
      }
    }

    // 没匹配到用第一个时段兜底
    if (!matched) {
      const first = Object.entries(periods)[0];
      if (first) matched = { key: first[0], ...first[1] };
    }

    // 同时段不重复应用
    if (this.#currentPeriod === matched.key) return;
    this.#currentPeriod = matched.key;

    // 夜间模式：night/dawn 时段自动切换暗色主题
    if (matched.key === 'night' || matched.key === 'dawn') {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }

    // 应用背景
    if (matched.image) {
      // 图片优先（为后续预留）
      document.body.style.background = `url(${matched.image}) center/cover no-repeat fixed`;
      document.body.style.backgroundImage = `url(${matched.image})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else if (matched.gradient) {
      document.body.style.background = matched.gradient;
      document.body.style.backgroundAttachment = 'fixed';
    }

    console.log(`[Background] 切换到: ${matched.name} (${matched.key})`);
  }
}
