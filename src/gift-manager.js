/**
 * GiftManager —— 礼物创建与管理
 * 统一礼物 DOM 工厂，消除 main() 和 modloader 中的重复代码
 */
import { Config } from './config.js';

export class GiftManager {
  /**
   * 创建可点击的礼物图标元素
   * @param {Object} giftData - { name, description, icon, ai_hint? }
   * @param {HTMLElement} cartContainer - "小货车"容器
   * @param {Object} [templateVars] - 模板变量，如 { role: '博丽灵梦' }
   * @param {string} [accumulatorRef] - 累积字符串的引用名（'other'），用于 modloader
   * @returns {HTMLImageElement}
   */
  static createElement(giftData, cartContainer, templateVars, accumulatorRef) {
    const maxGifts = Config.get('limits.maxGifts');
    const icon = new Image();
    icon.className = 'gift';
    icon.src = giftData.icon;

    // 构建附件描述
    let desc = `[附件: {名称: "${giftData.name}", 介绍: "${giftData.description}"`;
    if (giftData.ai_hint) {
      desc += `, 补充设定: "${giftData.ai_hint}"`;
    }
    desc += '}]\n';

    // 模板变量解析
    if (templateVars && typeof templateVars === 'object') {
      desc = window.loadstring?.(desc, templateVars) ?? desc;
    }
    icon.data = desc;

    icon.addEventListener('click', () => {
      Qmsg.info(giftData.name + ' +1');

      const clone = icon.cloneNode(true);
      const addSound = new Audio('./assets/sounds/Item.mp3');
      addSound.play();

      clone.addEventListener('click', () => {
        // 从累积字符串中移除
        if (accumulatorRef && window[accumulatorRef] !== undefined) {
          window[accumulatorRef] = window[accumulatorRef].replace(icon.data, '');
        }
        Qmsg.info(giftData.name + ' -1');
        cartContainer.removeChild(clone);
        const rmSound = new Audio('./assets/sounds/btn.mp3');
        rmSound.play();
      });

      if (cartContainer.children.length >= maxGifts) {
        Qmsg.error(`最多携带${maxGifts}个礼物！`);
      } else {
        cartContainer.appendChild(clone);
        if (accumulatorRef && window[accumulatorRef] !== undefined) {
          window[accumulatorRef] += desc;
        }
      }
    });

    return icon;
  }
}
