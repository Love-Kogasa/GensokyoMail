/**
 * Config —— 配置管理（单例）
 * 启动时加载 config.json，跟内置默认值 deep merge
 * 全局通过 Config.get('api.openai.model') 读取
 */
export class Config {
  /** @type {Object} */
  static #defaults = {
    api: {
      openai: {
        endpoint: 'https://api.openai-hk.com/v1/chat/completions',
        model: 'gpt-4o-mini'
      },
      smtp: {
        endpoint: 'https://api.mu-jie.cc/email',
        host: 'mail.fds.moe',
        from: 'lovekogasa@mc.fds.moe'
      },
      market: {
        fetch: 'https://api.youmu.ltd/fetch/all',
        upload: 'https://api.youmu.ltd/new/addon'
      }
    },
    limits: {
      maxGifts: 20,
      requestTimeout: 30000
    },
    ui: {
      theme: {
        primary: '#FF4646',
        primaryLight: '#FF5E5E',
        primaryDark: '#E53E3E'
      },
      features: {
        kogasaEasterEgg: true,
        reimuEasterEgg: true,
        holidayDetection: true
      }
    },
    addons: {
      enableScriptAPI: false,
      enableHTMLInjection: false
    },
    background: {
      enabled: true,
      blur: '8px',
      timeBased: true,
      periods: {
        dawn:     { start: 5,  end: 7,  name: '黎明', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', image: '' },
        morning:  { start: 7,  end: 11, name: '早晨', gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', image: '' },
        noon:     { start: 11, end: 14, name: '正午', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', image: '' },
        afternoon:{ start: 14, end: 17, name: '午后', gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', image: '' },
        evening:  { start: 17, end: 20, name: '黄昏', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', image: '' },
        night:    { start: 20, end: 5,  name: '夜晚', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', image: '' }
      }
    }
  };

  /** @type {Object} */
  static #current = null;

  /**
   * 加载配置文件
   * @returns {Promise<Object>}
   */
  static async load() {
    try {
      const resp = await fetch('./config.json', {
        signal: AbortSignal.timeout(5000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const userConfig = await resp.json();
      Config.#current = Config.#deepMerge(Config.#defaults, userConfig);
    } catch (err) {
      console.warn('[Config] 无法加载 config.json，使用默认配置:', err.message);
      Config.#current = Config.#deepMerge({}, Config.#defaults);
    }
    return Config.#current;
  }

  /**
   * 读取配置值，支持点号路径
   * @param {string} path - 如 'api.openai.model'
   * @returns {*}
   */
  static get(path) {
    if (!Config.#current) {
      throw new Error('[Config] 尚未初始化，请先调用 Config.load()');
    }
    return path.split('.').reduce((obj, key) => obj?.[key], Config.#current);
  }

  /**
   * 获取全部配置（只读拷贝）
   */
  static all() {
    return Config.#current;
  }

  /**
   * Deep merge，user 覆盖 defaults
   */
  static #deepMerge(defaults, user) {
    const result = { ...defaults };
    for (const key of Object.keys(user)) {
      if (
        user[key] &&
        typeof user[key] === 'object' &&
        !Array.isArray(user[key]) &&
        typeof defaults[key] === 'object' &&
        !Array.isArray(defaults[key])
      ) {
        result[key] = Config.#deepMerge(defaults[key], user[key]);
      } else {
        result[key] = user[key];
      }
    }
    return result;
  }
}
