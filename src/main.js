/**
 * GensokyoMail —— 幻想乡邮箱主类
 * 编排初始化流程，协调所有子模块
 */
import { Config } from './config.js';
import { Logger } from './logger.js';
import { CharacterDB } from './character-db.js';
import { GiftManager } from './gift-manager.js';
import { AddonLoader } from './addon-loader.js';
import { AddonMarket } from './addon-market.js';
import { MailSender } from './mail-sender.js';
import { UIController } from './ui-controller.js';

export class GensokyoMail {
  constructor() {
    this.logger = null;
    this.characterDB = new CharacterDB();
    this.addonLoader = null;
    this.addonMarket = null;
    this.mailSender = new MailSender();
    this.uiController = null;

    // 全局变量（保持与旧版兼容，Addon 可能引用）
    window.other = '';
    window.cs = {};
  }

  /**
   * 主入口 —— 替代原来的 main()
   * 在 DOMContentLoaded 后调用
   */
  async init() {
    // ① 先加载配置
    await Config.load();

    // ② 获取所有 DOM 引用
    const els = this.#cacheElements();
    if (!els) {
      console.error('找不到关键 DOM 元素，初始化失败');
      return;
    }

    // ③ 初始化 Logger（劫持 console 到终端）
    this.logger = new Logger(els.term);

    // ④ 初始化 AddonLoader
    this.addonLoader = new AddonLoader(els.addonsPanel, els.giftList, els.chance);
    this.addonMarket = new AddonMarket(els.markContainer, els.addonSearch, this.addonLoader);

    // ⑤ 设置 UI 事件
    this.uiController = new UIController(els);
    this.uiController.bindAll();

    // ⑥ 并行加载所有数据
    console.log('⑨ 正在连接幻想乡...');
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    try {
      const [nmap, gifts, csData, markDatas, sites] = await Promise.all([
        fetch('./data/name.json').then(r => r.json()),
        fetch('./data/gifts.json').then(r => r.json()),
        fetch('./data/c.json').then(r => r.json()),
        this.addonMarket.fetch().then(() => null), // AddonMarket 自己存数据
        fetch('./data/friends.json').then(r => r.json()).catch(() => [])
      ]);

      // ⑦ 初始化角色数据库
      this.characterDB.init(nmap);
      window.cs = csData;

      // ⑧ 渲染礼物
      for (const gift of gifts) {
        const icon = GiftManager.createElement(gift, els.chance, null, 'other');
        els.giftList.appendChild(icon);
      }

      // ⑨ 渲染市场
      this.addonMarket.render();
      this.addonMarket.bindSearch();

      // ⑩ 渲染友链
      for (const site of sites) {
        const div = document.createElement('div');
        div.className = 'addon';
        div.style.backgroundColor = '#FFFFFF55';

        if (site.icon) {
          const img = document.createElement('img');
          img.src = site.icon;
          img.className = 'icon';
          div.appendChild(img);
        }

        const h3 = document.createElement('h3');
        h3.className = 'title';
        h3.textContent = site.title || '';
        const p = document.createElement('p');
        p.textContent = site.description || '';

        div.appendChild(h3);
        div.appendChild(p);
        div.addEventListener('click', () => {
          if (/^https?:\/\//.test(site.url)) {
            window.location.href = site.url;
          }
        });

        els.adsContainer.appendChild(div);
      }

      // ⑪ 日期处理
      const today = window.formatDate?.(new Date()).date ?? '';
      if (Config.get('ui.features.holidayDetection') && window.isHoliday?.(today)) {
        this.#todayStr = today + ' , ' + (window.getFestival?.(today) ?? '');
      } else {
        this.#todayStr = today;
      }

      // ⑫ 绑定核心发送事件
      this.#bindSendFlow(els);

      // ⑬ 绑定 Addon 上传
      this.#bindUploadFlow(els);

      console.log('页面渲染完成，欢迎来到幻想乡 ~');
      Qmsg.success('页面渲染完成，欢迎喵 ~');
    } catch (err) {
      console.error('初始化失败:', err);
      Qmsg.error('页面加载失败，请刷新试试 w~');
    } finally {
      if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
  }

  /** 缓存 DOM 元素引用 */
  #cacheElements() {
    const get = (id) => document.getElementById(id);
    return {
      mailInput: get('mail'),
      roleInput: get('thr'),
      textInput: get('text'),
      sendBtn: get('send'),
      yibianBtn: get('yibian'),
      term: get('term'),
      chance: get('chance'),
      giftList: get('glist'),
      addonsPanel: get('addons'),
      markContainer: get('addonMark'),
      addonSearch: get('addonSearch'),
      adsContainer: get('adss'),
      modsDialog: get('mods'),
      giftsDialog: get('gifts'),
      adsDialog: get('ads'),
      kogasaImg: get('kogasa'),
      reimuImg: get('reimu'),
      kogasaCount: get('kc'),
      reimuCount: get('rc'),
      upmBtn: get('upm'),
      fileInput: get('file'),
      addonFileInput: get('umtm'),
      uploadAddonBtn: get('uploadAddonBtn') || document.querySelector('[onclick*="uploadAddon"]'),
      uploadAddonSign: get('ufv'),
    };
  }

  /** 绑定发送流程 */
  #bindSendFlow(els) {
    const self = this;
    els.sendBtn.addEventListener('click', async () => {
      const mail = els.mailInput.value.trim();
      const role = els.roleInput.value.trim();
      const text = els.textInput.value.trim();

      // 验证邮箱
      if (!mail || !/^[^\@]+\@[^\@\.]+\.[^\@\.]+$/.test(mail)) {
        Qmsg.error('邮箱格式错误 w~');
        console.error('邮箱格式错误！');
        return;
      }

      // 验证角色名
      if (!role || !self.characterDB.exists(role)) {
        Qmsg.error('未在幻想乡查找到该角色 w~');
        console.error('未在幻想乡查找到该角色');
        const suggestions = self.characterDB.search(role);
        for (const s of suggestions) {
          console.error('您在找的是不是: ' + s);
        }
        return;
      }

      // 验证正文
      if (!text) {
        Qmsg.error('没有找到正文 w~');
        console.error('正文不能为空');
        return;
      }

      try {
        await self.mailSender.send(mail, role, text, window.other, self.#todayStr);
      } catch (err) {
        Qmsg.error('发生了意想不到的错误 w~');
        console.error(err);
      }
    });
  }

  /** 绑定 Addon 上传 */
  #bindUploadFlow(els) {
    const self = this;

    // 本地文件加载
    els.upmBtn.addEventListener('click', async () => {
      const file = els.fileInput.files?.[0];
      if (!file) {
        Qmsg.error('未选择文件');
        return;
      }
      try {
        const msg = Qmsg.loading('Addon 加载中');
        const text = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target.result);
          reader.onerror = rej;
          reader.readAsText(file);
        });
        await self.addonLoader.load(text);
        const sound = new Audio('./assets/sounds/Item.mp3');
        sound.play();
        msg.close();
        Qmsg.success('Addon 加载成功！');
      } catch (err) {
        Qmsg.error(err.toString());
        console.error(err);
      }
    });

    // 市场上传
    const uploadBtn = document.querySelector('btn[onclick*="uploadAddon"]') ||
                      document.querySelector('[onclick*="uploadAddon"]');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        self.addonMarket.upload(els.addonFileInput);
      });
    }

    if (els.addonFileInput) {
      els.addonFileInput.addEventListener('change', function () {
        const sign = document.getElementById('ufv');
        if (sign) sign.textContent = this.value || '未选择文件';
      });
    }
  }

  /** 今天的日期字符串 */
  #todayStr = '';
}
