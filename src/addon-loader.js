/**
 * AddonLoader —— Addon 加载器
 * 解析 JSON 格式的 Addon，维护函数注册表
 * 兼容旧版 app.js 的 modloader 行为
 */
import { Config } from './config.js';
import { GiftManager } from './gift-manager.js';

export class AddonLoader {
  /** @type {Object} 公共变量表，跨 Addon 共享 */
  #publicValue = {};

  /** @type {HTMLElement} */
  #addonsPanel;

  /** @type {HTMLElement} */
  #giftList;

  /** @type {HTMLElement} */
  #cartContainer;

  /**
   * @param {HTMLElement} addonsPanel - 已激活 Addon 显示区
   * @param {HTMLElement} giftList - 礼物列表容器
   * @param {HTMLElement} cartContainer - 小货车容器
   */
  constructor(addonsPanel, giftList, cartContainer) {
    this.#addonsPanel = addonsPanel;
    this.#giftList = giftList;
    this.#cartContainer = cartContainer;
  }

  /**
   * 加载一个 Addon JSON
   * @param {string|Object} raw - JSON 字符串或已解析对象
   */
  async load(raw) {
    const mod = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (mod.header) {
      this.#renderHeader(mod.header);
    }

    const functions = this.#buildFunctions();
    const self = this;

    // 处理 custom 函数定义（支持模板变量）
    function toFunc(key, object) {
      functions[key] = function (data = {}) {
        for (const k of Object.keys(object)) {
          const resolved = self.#dataify(object[k], data);
          if (Array.isArray(object[k])) {
            for (const item of object[k]) {
              functions[k](self.#dataify({ ...self.#publicValue, ...item }, data));
            }
          } else {
            functions[k]({ ...self.#publicValue, ...resolved });
          }
        }
      };
    }

    for (const key of Object.keys(mod)) {
      if (key === 'header' || key === 'main') continue;
      toFunc(key, mod[key]);
    }

    // 执行 main 入口
    if (mod.main) {
      for (const key of Object.keys(mod.main)) {
        const entry = mod.main[key];
        const items = Array.isArray(entry) ? entry : [entry];
        for (const item of items) {
          const resolved = this.#dataify({ ...this.#publicValue, ...item }, item);
          if (functions[key]) {
            functions[key](resolved);
          }
        }
      }
    }
  }

  /** 获取公共变量表 */
  get publicValue() {
    return this.#publicValue;
  }

  /** 构建内置函数注册表 */
  #buildFunctions() {
    const self = this;
    const cs = window.cs || {};

    return {
      new_gift(data) {
        const icon = GiftManager.createElement(
          { name: data.name, description: data.description, icon: data.icon, ai_hint: data.ai_hint },
          self.#cartContainer,
          self.#publicValue,
          'other'
        );
        self.#giftList.appendChild(icon);
      },

      new_character(data) {
        cs[data.name] = data.character;
      },

      add_character(data) {
        if (cs[data.name]) {
          cs[data.name] += data.character;
        } else {
          cs[data.name] = data.character;
        }
      },

      UI(data) {
        const el = document.createElement(data.type || 'btn');
        if (data.type !== 'input' && data.type !== 'img') {
          el.textContent = data.text || '';
        }
        if (data.id) el.id = data.id;
        for (const evt of data.events || []) {
          el.addEventListener(evt.event, () => {
            functions[evt.func]?.(self.#publicValue);
          });
        }
        const parent = document.getElementById(data.father || 'addon-btns');
        parent?.appendChild(el);
      },

      html(html) {
        if (Config.get('addons.enableHTMLInjection')) {
          document.body.insertAdjacentHTML('beforeend', html);
        } else {
          console.warn('[AddonLoader] html 注入已被 config 禁用');
        }
      },

      log: console.log,

      global(data) {
        if (data.type === 'set') {
          self.#publicValue[data.name] = data.value;
        } else if (data.type === 'remove') {
          delete self.#publicValue[data.name];
        } else if (data.type === 'add') {
          self.#publicValue[data.name] += data.value;
        } else {
          self.#publicValue[data.name] = functions[data.value]?.(self.#publicValue);
        }
      },

      script(data) {
        if (!Config.get('addons.enableScriptAPI')) {
          console.warn('[AddonLoader] script API 已被禁用。Addon 试图执行代码但被拦截。');
          return;
        }
        console.warn('[AddonLoader] script API 已弃用，将在未来版本中移除');
        const fn = new Function('lv', '"use strict"; ' + data.code);
        return fn({
          api: functions,
          global: self.#publicValue
        });
      },

      msg(data) {
        Qmsg[data.type]?.(data.msg);
      },

      sound(data) {
        const audio = new Audio(data.src);
        audio.oncanplaythrough = () => {
          if (data.volume != null) audio.volume = data.volume;
          if (data.loop) audio.loop = data.loop;
          if (data.quick) audio.playbackRate = data.quick;
          audio.play().catch(() => {});
        };
      },

      $() {}
    };

    function functions() {}
    return functions();
  }

  /**
   * 递归解析模板变量 {{key}}
   */
  #dataify(json, data = {}) {
    if (typeof json !== 'object' || json === null) return json;
    const result = Array.isArray(json) ? [] : {};
    for (const key of Object.keys(json)) {
      if (typeof json[key] === 'object' && json[key] !== null) {
        result[key] = this.#dataify(json[key], data);
      } else if (typeof json[key] === 'string') {
        result[key] = window.loadstring?.(json[key], { ...data, ...this.#publicValue }) ?? json[key];
      } else {
        result[key] = json[key];
      }
    }
    return result;
  }

  /** 渲染 Addon Header */
  #renderHeader(header) {
    const div = document.createElement('div');
    div.className = 'addon';

    const img = document.createElement('img');
    img.className = 'icon';
    img.src = header.icon || '';

    const span = document.createElement('span');
    span.className = 'title';
    span.textContent = header.name || '';

    const p = document.createElement('p');
    p.textContent = header.description || '';

    div.appendChild(img);
    div.appendChild(span);
    div.appendChild(p);
    this.#addonsPanel.appendChild(div);
  }
}
