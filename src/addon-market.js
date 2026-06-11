/**
 * AddonMarket —— Addon 市场浏览/搜索/上传
 */
import { Config } from './config.js';
import { AddonLoader } from './addon-loader.js';

export class AddonMarket {
  /** @type {Array} */
  #markDatas = [];

  /** @type {HTMLElement} */
  #markContainer;

  /** @type {HTMLElement} */
  #searchInput;

  /** @type {AddonLoader} */
  #loader;

  /**
   * @param {HTMLElement} markContainer - 市场列表容器
   * @param {HTMLElement} searchInput - 搜索输入框
   * @param {AddonLoader} loader
   */
  constructor(markContainer, searchInput, loader) {
    this.#markContainer = markContainer;
    this.#searchInput = searchInput;
    this.#loader = loader;
  }

  /** 从 API 加载市场数据 */
  async fetch() {
    try {
      const resp = await fetch(Config.get('api.market.fetch'), {
        signal: AbortSignal.timeout(Config.get('limits.requestTimeout'))
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      this.#markDatas = await resp.json();
    } catch (err) {
      console.error('[AddonMarket] 市场数据加载失败:', err.message);
      this.#markDatas = [];
    }
  }

  /** 渲染市场列表 */
  render(search = '') {
    this.#markContainer.textContent = '';

    for (const addon of [...this.#markDatas].reverse()) {
      if (!addon.passed) continue;
      const text = (addon.name || '') + (addon.description || '');
      if (search && !text.includes(search)) continue;

      let header;
      try {
        header = JSON.parse(addon.content).header;
      } catch {
        header = { icon: '', name: addon.name };
      }

      const div = document.createElement('div');
      div.className = 'addon';

      const img = document.createElement('img');
      img.className = 'icon';
      img.src = header.icon || '';

      const span = document.createElement('span');
      span.className = 'title';
      span.textContent = addon.name || '';

      const p = document.createElement('p');
      p.textContent = addon.description || '';

      div.appendChild(img);
      div.appendChild(span);
      div.appendChild(p);

      let loaded = false;
      div.addEventListener('click', async () => {
        if (loaded) {
          Qmsg.error('您已经加载过本 Addon 了');
          return;
        }
        await this.#loader.load(addon.content);
        loaded = true;
        const sound = new Audio('./assets/sounds/Item.mp3');
        sound.play();
        Qmsg.success('Addon 加载成功！');
      });

      this.#markContainer.appendChild(div);
    }
  }

  /** 搜索事件绑定 */
  bindSearch() {
    this.#searchInput.addEventListener('input', () => {
      this.render(this.#searchInput.value);
    });
  }

  /**
   * 上传 Addon
   * @param {HTMLInputElement} fileInput
   */
  async upload(fileInput) {
    const file = fileInput.files?.[0];
    if (!file) {
      Qmsg.error('未选择文件！');
      return;
    }

    let json;
    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
      json = JSON.parse(text);
    } catch (err) {
      Qmsg.error('JSON 语法错误！');
      throw err;
    }

    const resp = await fetch(Config.get('api.market.upload'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'string=' + encodeURIComponent(JSON.stringify(json)),
      signal: AbortSignal.timeout(Config.get('limits.requestTimeout'))
    });
    const result = await resp.json();

    if (result.id === 0) {
      Qmsg.success('上传成功！详见控制台');
      console.log('上传成功 (详见: https://gskm-addon.thmobile.xyz/market.html)');
    } else {
      Qmsg.error('API 请求有误！');
    }
  }
}
