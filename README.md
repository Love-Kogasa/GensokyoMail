# ☯ 幻想乡邮箱 Gensokyo Mail

> 外界通往幻想乡的邮箱 awa  
> 给你喜欢的车万角色写信，AI 会帮你把回信寄回来！

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen)](https://love-kogasa.github.io/GensokyoMail)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-red)](https://github.com/Love-Kogasa/GensokyoMail/pulls)

---

## 这是个啥

简单来说：你在这边填邮箱、选角色、写正文，点发送——GPT-4o-mini 会以那个角色的身份写一封回信，然后通过 SMTP 发到你的真实邮箱里。

无需注册、无需登录、开了就能用。

整个项目起源于"如果能给灵梦写信会怎么样"的一时兴起，然后靠运气火了一把（笑）。代码最初写得很放飞自我，app.js 一个文件梭哈了 300+ 行。v2.0 终于抽出时间重构了，把那一坨拆成了像人写的结构。

**⚠️ 目前用的是付费 GPT API，额度有限，且用且珍惜。**

---

## 能干啥

- 📧 **给幻想乡写信** — 支持 150+ 角色，从灵梦到隐岐奈，从红魔乡到虹龙洞
- 🤖 **AI 角色扮演回信** — 每个角色有自己的性格设定，回复风格各不相同
- 🎁 **送礼物** — 炸弹、啤酒、大蒜... 礼物会附加在邮件里，AI 会对礼物做出反应
- 🧩 **Addon 系统** — 社区可以自己写插件扩展功能（新礼物、新角色、新 UI...）
- 📊 **Addon 市场** — 浏览、搜索、一键加载其他人写的 Addon
- 🎭 **彩蛋** — ⑨算式编码、灵梦赛钱箱计数、小伞吓人计数...
- 📱 **响应式** — 手机电脑都能用

---

## 快速开始

### Fork 后部署（GitHub Pages）

1. Fork 这个仓库
2. **重要：替换 API Key！**

   `baka1.txt` 和 `baka2.txt` 是 ⑨算式编码的密钥文件。虽然是彩蛋，但 fork 后请换成你自己的 Key，不然用的还是我的额度（悲）。

   如何生成你自己的 baka 文件：

   ```js
   // 在浏览器控制台执行（加载了 Nineify.js 的页面上）
   stringEncodeTo9("你的 OpenAI API Key")
   // 把输出复制到 baka1.txt（多行）
   
   stringEncodeTo9("你的 SMTP 密码")
   // 把输出复制到 baka2.txt
   ```

   如果你懒得搞 SMTP，可以不改 baka2.txt（邮件发送用的是我朋友的 fds.moe 服务），但 **API Key 一定要换**。

3. 可选：编辑 `config.json` 调整设置（API 地址、主题色、功能开关...）
4. 推到 `main` 分支，GitHub Pages 会自动部署
5. 如果有自己的域名，改 `CNAME` 文件

### 本地跑

直接打开 `index.html` 就行，不需要 `npm install` 也不需要 `npm start`。就是个纯前端页面。

---

## 目录结构（v2.0 重构后）

```
GensokyoMail/
├── index.html              # 主页面（Tailwind CSS 重写）
├── config.json              # 用户配置文件 ★
├── src/                    # 源代码（面向对象重构）
│   ├── main.js             # GensokyoMail 主类，入口
│   ├── config.js           # Config 类，加载 config.json
│   ├── logger.js           # Logger 类，控制台→终端重定向
│   ├── character-db.js     # CharacterDB 类，角色名查询
│   ├── gift-manager.js     # GiftManager 类，礼物工厂
│   ├── addon-loader.js     # AddonLoader 类，插件加载
│   ├── addon-market.js     # AddonMarket 类，市场浏览
│   ├── mail-sender.js      # MailSender 类，邮件发送
│   └── ui-controller.js    # UIController 类，UI 交互
├── data/                   # 数据文件
│   ├── name.json           # 150+ 角色名库（中/日/英）
│   ├── c.json              # 40 个角色的性格设定
│   ├── gifts.json          # 礼物定义（含 AI 提示）
│   └── friends.json        # 友链
├── libs/                   # 第三方库
│   ├── Nineify.js          # ⑨算式编解码（已去 eval）
│   ├── message.min.js/css  # Qmsg 消息提示
│   ├── finicounter.js      # 访问量统计
│   ├── festival.min.js     # 中国节假日检测
│   ├── template.js         # {{变量}} 模板引擎
│   └── npm.js              # Node module 兼容 shim
├── assets/                 # 静态资源
│   ├── images/             # 角色立绘
│   ├── gifts/              # 礼物图标
│   ├── sounds/             # 音效
│   └── misc/               # 赞助码、彩蛋图
├── style.css               # Tailwind 补充样式
├── pc.css                  # 桌面端响应式样式
├── baka1.txt               # ⑨彩蛋：API Key（编码后）
├── baka2.txt               # ⑨彩蛋：SMTP 密码（编码后）
├── CNAME                   # 自定义域名
├── doc.md                  # Addon 开发文档
├── .gitignore
├── LICENSE (MIT)
├── package.json
└── README.md               # 你在看的这个
```

---

## config.json 说明

重构后所有可配置的东西都放 `config.json` 里了，改配置不用翻代码：

| 配置项 | 说明 |
|--------|------|
| `api.openai.endpoint` | GPT API 地址（默认 openai-hk 代理） |
| `api.openai.model` | 用的模型（默认 gpt-4o-mini） |
| `api.smtp.*` | SMTP 邮件服务配置 |
| `api.market.*` | Addon 市场 API |
| `limits.maxGifts` | 一次最多带多少礼物（默认 20） |
| `limits.requestTimeout` | 请求超时毫秒数（默认 30000） |
| `ui.theme.*` | 主题色（默认幻想乡红 #FF4646） |
| `ui.features.*` | 功能开关（彩蛋、节假日检测） |
| `addons.*` | Addon 安全限制 |

启动时会自动加载 `config.json`，如果加载失败就用内置默认值。

---

## Addon 开发速览

Addon 是一个 JSON 文件，结构大概长这样：

```json
{
  "header": {
    "icon": "Test/g.png",
    "name": "我的 Addon",
    "description": "给幻想乡邮箱加点好玩的"
  },
  "main": {
    "new_gift": [{
      "name": "礼盒",
      "icon": "Test/g.png",
      "description": "一个神秘礼盒！"
    }]
  }
}
```

可用的 API 函数看 [doc.md](doc.md)，里面有详细文档。也推荐用社区做的可视化工具：

- [Addon 可视化构建器 by @MTR](https://gskm-addon.thmobile.xyz/)
- [Addon 制作器 by @Love-Kogasa](https://gskmam.thmobile.xyz/)

> ⚠️ `script` API 在 v2.0 中默认关闭（`config.json` → `addons.enableScriptAPI: false`），因为有安全风险。如果你确定要跑别人写的脚本，自己打开。

---

## 关于 ⑨ 算式

`baka1.txt` 和 `baka2.txt` 里面的内容长这样：

```
9-(9+9+9+9)/9+9**(9/9)*((9+9)/9)+9**((9+9)/9)*(9/9)
9-9/9+9**(9/9)*((9+9)/9)+9**((9+9)/9)*(9/9)
...
```

这不是加密——严格来说这是个"以 9 进制为基础、只用数字 9 来表达任意字符"的编码方案。灵感来源：琪露诺的 "⑨" 和 "算数笨蛋" 的设定。

解码函数在 `libs/Nineify.js` 里，纯纯的公开（笑）。所以别把它当安全措施，它就是个**彩蛋**。fork 后记得换 key。

---

## 致谢

| 贡献 | 来自 |
|------|------|
| 市场 API | [MTR](https://youmu.ltd/) |
| 页面图标 | Pixiv 110969269 by 那奈はな |
| Qmsg 组件 | [Qmsg](https://github.com/raindrophost/qmsg) |
| 计数器 | [Finicounter](https://finicounter.eu.org/) |
| 节假日数据 | festival.js |
| 所有 Addon 作者 | 社区的车万人 ❤️ |

---

## FAQ

**Q: 发信要钱吗？**  
A: 不要。但每发一次我就会扣一次 GPT API 费用（用的 gpt-4o-mini，还算便宜）。所以请勿滥用。

**Q: 我能给谁写信？**  
A: `data/name.json` 里有 150+ 个角色，中/日/英文名都行。如果你喜欢的角色不在里面，提 issue 或者自己写 Addon 加。

**Q: 回信靠谱吗？**  
A: AI 生成的嘛，有时候很传神，有时候会 OOC（角色崩坏）。这取决于 GPT 的理解和你写的信的内容。礼物和补充设定会影响回复质量。

**Q: 我没收到回信怎么办？**  
A: 检查一下：
1. 垃圾邮件箱（特别是 QQ 邮箱）
2. 邮箱地址填对了没
3. API 额度是不是用完了（看控制台报错）

**Q: 为什么叫幻想乡邮箱？**  
A: 东方 Project 的世界观里，幻想乡是与外界隔绝的。这个项目就是……幻想乡通网了（不是）。

**Q: 能自部署吗？**  
A: 当然。Fork → 换 baka 文件 → GitHub Pages 开起来 → 搞定。如果不用 GitHub Pages，随便找个静态托管丢上去就行。

**Q: Baka 文件安全吗？**  
A: ⑨算式的解码函数就是公开的 JS 代码，谁都能看。它只是个彩蛋，不是加密。**不要把你的 Key 放在公开仓库里！** 如果真的很在意安全，可以考虑用 Cloudflare Worker 做一层代理（参考仓库里 `cloudflare-worker.js`，可选）。

---

## 已知问题 & TODO

- [ ] favicon.ico 还是 290KB（和 appicon.png 一样大），需要压
- [ ] 礼物系统还在"测试阶段"（懒得改了）
- [ ] Addon 市场审核机制比较松（人手不够）
- [ ] 没有单元测试（纯前端项目，我太懒了）
- [ ] 部分对话框在超小屏幕上可能会溢出

提 issue 或 PR 随时欢迎，虽然我可能会摸鱼很久才回（逃）。

---

<p align="center">
  <img src="assets/misc/k.jpg" width="120" alt="小伞">
  <br>
  <i>咱好恨呀~</i>
</p>
