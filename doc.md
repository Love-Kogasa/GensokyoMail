# Addon文档
GensokyoMail的Addon采用Json+TempleString或利用相关开发环境编写(~~在写了~~).  
## Example
基本示例(礼盒addon)  
将其保存为gift.json或gift.gskm并在网页打开以测试
```json
{
  "header": {
    "icon": "Test/g.png",
    "name": "礼盒",
    "description": "增加礼物: 礼盒"
  },
  "main": {
    "new_gift": [{
      "name": "礼盒",
      "icon": "Test/g.png",
      "description": "随机一样礼物！"
    }]
  }
}
```
### 要点解析
* header: Addon基本信息.  
icon?: Addon图标.  
name: Addon名称.  
description: Addon介绍
* main: Addon入口JSON"函数"  
new\_gift: 遍历调用new\_gift函数一次，新增礼盒  

基本示例(自定义"函数"调用)
目前调用参数不支持嵌套对象
```json
{
  "header": {
    "icon": "Test/g.png",
    "name": "礼盒",
    "description": "增加礼物: 礼盒"
  },
  "main": {
    "add": {"name": "礼盒"}
  },
  "add": {
    "new_gift": {
      "name": "{{name}}",
      "icon": "Test/g.png",
      "description": "随机一样礼物！"
    }
  }
}
```

## 函数文档
* new\_gift: 创建一个新礼物
* add\_character: 新增设定(如果有，在旧设定上追加).  
name: 角色名称
character: 设定字符串
* new\_character: 新增设定(如果有，覆盖旧设定)，格式同上
* log: 将字符打印到控制台
* msg: 当Addon被载入时输出的提示消息！ 
type: 类型，可以是info, success, error, warning  
msg: 消息字符串

### BetaApi
* html: 在页面追加Html
* $: 编码内容(未完成)