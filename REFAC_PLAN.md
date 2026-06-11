# REFAC_PLAN.md —— 幻想乡邮箱重构计划

## 为什么要重构

这个项目是咱一时兴起写的，app.js 一个文件撸到底，写着写着就变成了一坨（悲）。不过既然有车万人喜欢用，那就好好整一整吧！

主要目标：
- 代码从"能跑就行"升级到"像个人写的"
- 用 Tailwind CSS 让界面好看点
- 面向对象重构，一个类一件事
- 异步操作并行化，加载更快
- 安全问题修一修（eval、XSS 这些）
- 写一份像样的中文 README

---

## 重构原则

1. **零构建工具** — 还是纯 HTML+CSS+JS，Tailwind 走 CDN
2. **灵魂不能丢** — ⑨算式、baka1/baka2、灵梦/小伞彩蛋全部保留
3. **面向对象** — GensokyoMail 做主类，各功能拆成独立类
4. **异步优先** — Promise.all 并行加载数据，不该阻塞的绝不阻塞
5. **向后兼容** — 现有 Addon 照常加载，script API 标记过时但不直接炸

---

## 新的代码架构（面向对象）

```
config.json          ← 用户可编辑的配置文件（不改代码就能调）
GensokyoMail (主类)
├── Config          — 加载 config.json + 合并默认值（单例）
├── Logger          — 日志/控制台输出
├── CharacterDB     — 角色名查询、模糊搜索
├── GiftManager     — 礼物创建/管理/上限
├── AddonLoader     — Addon 加载解析/函数注册表
├── AddonMarket     — 市场浏览/搜索/上传
├── MailSender      — 邮件发送流程（GPT + SMTP）
└── UIController    — UI 事件绑定/对话框/彩蛋
```

每个类职责单一，GensokyoMail 做协调。全部用 ES Module 组织。

### config.json 设计

这是重点——所有可能需要调的东西放这里，改配置不用翻代码：

```json
{
  "api": {
    "openai": {
      "endpoint": "https://api.openai-hk.com/v1/chat/completions",
      "model": "gpt-4o-mini"
    },
    "smtp": {
      "endpoint": "https://api.mu-jie.cc/email",
      "host": "mail.fds.moe",
      "from": "lovekogasa@mc.fds.moe"
    },
    "market": {
      "fetch": "https://api.youmu.ltd/fetch/all",
      "upload": "https://api.youmu.ltd/new/addon"
    }
  },
  "limits": {
    "maxGifts": 20,
    "requestTimeout": 30000
  },
  "ui": {
    "theme": {
      "primary": "#FF4646",
      "primaryLight": "#FF5E5E",
      "primaryDark": "#E53E3E"
    },
    "features": {
      "kogasaEasterEgg": true,
      "reimuEasterEgg": true,
      "holidayDetection": true
    }
  },
  "addons": {
    "enableScriptAPI": false,
    "enableHTMLInjection": false
  }
}
```

启动时 `Config` 类会：
1. 加载 `./config.json`
2. 跟内置默认值 deep merge（用户配置覆盖默认）
3. 把结果挂到 `Config.current` 上，全站只读

这样 fork 项目的车万人只需要改一个 json 文件就能换 API、调主题色、开关功能。

### 类的设计要点

- **Config**: 单例，`static async load()` 加载 config.json + 合并默认值，之后 `Config.get(key)` 读取
- **CharacterDB**: 接收 name.json 数据，构建 `Set` 做 O(1) 查重，`Map<别名, 中文名>` 做模糊匹配
- **GiftManager**: 静态工厂方法 `createElement()` 生成礼物 DOM，从 Config 读 maxGifts
- **AddonLoader**: 解析 JSON，维护函数注册表，根据 config 决定 script/html API 是否启用
- **MailSender**: `async send(mail, role, text, extras)` 串联 AI 调用和 SMTP 投递，API 地址从 Config 读
- **UIController**: 绑定事件、对话框管理、彩蛋计数，彩蛋开关从 Config 读

---

## 异步性能优化

现有问题是所有数据串行 fetch：name.json → gifts.json → c.json → 市场数据，一个一个来。

改成并行：

```js
// main() 初始化
const [nmap, gifts, cs, markDatas, sites] = await Promise.all([
  fetch('./data/name.json').then(r => r.json()),
  fetch('./data/gifts.json').then(r => r.json()),
  fetch('./data/c.json').then(r => r.json()),
  fetch('https://api.youmu.ltd/fetch/all').then(r => r.json()),
  fetch('./data/friends.json').then(r => r.json())
]);
// 所有数据同时加载，谁先回来谁先处理
CharacterDB.init(nmap);
GiftManager.render(gifts);
// ...
```

另外：
- 邮件发送的 GPT 调用和礼物列表构建之间用 `Promise.all` 并行
- 彩蛋计数更新用 `async` 但不阻塞主流程
- 页面渲染分成两阶段：关键路径先渲染（表单+按钮），非关键路径后渲染（市场+友链）

---

## Phase 1: 安全 + Tailwind + 类架构搭建

### 1.1 搭建目录结构

```
GensokyoMail/
├── index.html
├── config.json              # ← 用户配置文件（新建！）
├── src/
│   ├── main.js              # 入口，GensokyoMail 主类
│   ├── config.js            # Config 类（加载 config.json）
│   ├── logger.js            # Logger 类
│   ├── character-db.js      # CharacterDB 类
│   ├── gift-manager.js      # GiftManager 类
│   ├── addon-loader.js      # AddonLoader 类
│   ├── addon-market.js      # AddonMarket 类
│   ├── mail-sender.js       # MailSender 类
│   └── ui-controller.js     # UIController 类
├── data/                    # JSON 数据文件（搬过来）
├── libs/                    # 第三方库（不动）
├── assets/                  # 图片/音效（搬过来）
├── style.css                # Tailwind 补充样式（精简）
├── pc.css                   # 桌面端样式（精简）
└── ...
```

### 1.2 创建 config.json

- **新建** `config.json` — 所有可配置项集中管理（API 地址、主题色、功能开关、限制参数）
- Config 类启动时 fetch + deep merge 默认值
- 后续所有类从 `Config.get()` 读配置，绝不硬编码

### 1.3 引入 Tailwind CSS

- `index.html` head 加 CDN
- 配置 gensokyo 红色主题：
  ```js
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          gensokyo: {
            light: '#FF5E5E',
            DEFAULT: '#FF4646',
            dark: '#E53E3E'
          }
        }
      }
    }
  }
  ```

### 1.4 移除 eval()

- Nineify.js 的 `eval()` 替换为安全四则运算解析器
- Addon script API 标记弃用，弹出 console.warn

### 1.5 修复 XSS

- 所有 innerHTML 拼接改为 createElement + textContent
- `<btn>` 改为 `<button>` 语义标签

### 1.6 创建 GensokyoMail 主类和所有子类

- 按上面的架构写出所有类骨架
- `main.js` 的 `GensokyoMail` 类负责编排初始化流程
- 旧的 `app.js` 这个阶段还保留，逐步迁移功能

---

## Phase 2: 代码迁移 + 质量修复

### 2.1 功能迁移到各个类

- 把 app.js 里的代码按职责拆进对应类的方法里
- 每迁移一个功能，app.js 就删掉对应部分
- 最后 app.js 清空，只剩对 `new GensokyoMail().init()` 的调用（或直接删掉让 main.js 接管）

### 2.2 修 bug

- `new_character` 逻辑错误：`cs[data.name] = cs[data.character]` → `cs[data.name] = data.character`
- Addon 礼物模板解析：加入 `loadstring()` 调用
- 提取礼物创建公共方法到 GiftManager

### 2.3 异步并行化

- `Promise.all` 并行加载所有初始化数据
- 邮件发送流程异步优化
- 非关键数据（市场、友链）不阻塞关键路径

### 2.4 错误处理加强

- 所有 fetch 加 AbortController 超时
- 分类提示：网络错误/超时/API 错误
- finicounter 加 catch

---

## Phase 3: UI 美化 + 功能增强

### 3.1 Tailwind 重写 UI

- 导航栏、卡片、按钮、输入框全部 Tailwind 化
- 对话框 backdrop-blur 保留自定义 CSS（Tailwind 不支持的）
- 删除 27 个 `<br>`，用 Tailwind spacing 替代
- 移动端优先，pc.css 保留关键的桌面端覆盖

### 3.2 角色设定扩展

- c.json 从 3 个扩展到 30+ 个，覆盖各作主要角色
- 每个角色一小段性格+口癖描述

### 3.3 礼物 AI hint 分离

- gifts.json 加 `ai_hint` 字段
- description 只给用户看，ai_hint 拼到 GPT prompt

### 3.4 小功能

- 加载状态："⑨ 正在连接幻想乡..."
- 离线检测提示条
- favicon 压缩到 ≤4KB

---

## Phase 4: 收尾 + 文档

### 4.1 项目规范化

- `.gitignore`
- `LICENSE` (MIT)
- `package.json`
- 删除或注释 libs/npm.js
- `REFAC_PLAN.md` 提交到仓库

### 4.2 写 README.md

用中文写一份详细的 README，包含：
- 项目介绍（带东方梗，不要太正经）
- 功能列表
- 快速开始（fork 后怎么部署）
- 目录结构说明
- Addon 开发指南
- 如何替换 API Key（baka 文件的 ⑨ 编码说明）
- 截图/gif
- 致谢（MTR、友人链接等）
- FAQ

文风要点：像车万同人作者写的，不是 AI 生成的。有梗、有颜文字、有自嘲，但信息密度要高。

### 4.3 全局验证

- 浏览器无报错
- 移动端/桌面端正常
- 整条邮件发送链路走通
- Addon 加载正常
- 彩蛋计数正常

---

## 执行顺序

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4
(架子)     (搬代码)    (美化)      (文档)
```

Phase 1 搭好架构，Phase 2 是最大的工作量（搬代码+修bug+异步优化），Phase 3 和 4 是 polish。

---

## 涉及文件

**修改:**
- `app.js` → 逐步清空，逻辑迁移到 src/
- `index.html` → Tailwind 化 + 新结构
- `style.css` → 精简为 Tailwind 补充
- `pc.css` → 精简
- `libs/Nineify.js` → 去 eval
- `c.json` → 扩展角色
- `gifts.json` → 加 ai_hint
- `README.md` → 重写

**新建:**
- `config.json` — 用户配置文件（API、主题、开关）
- `src/` 下 8 个类文件
- `data/` 目录（搬 JSON 文件）
- `assets/` 目录（搬图片音效）
- `.gitignore`、`LICENSE`、`package.json`

**不动:**
- `baka1.txt` / `baka2.txt` — ⑨ 彩蛋保留
- `libs/message.min.js` / `festival.min.js` / `template.js` / `finicounter.js`
- `CNAME`、`doc.md`
- `sounds/`、`Test/`
