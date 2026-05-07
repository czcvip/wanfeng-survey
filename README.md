# 小件速运 商业模式验证调查

立项前的市场验证调查问卷,4 类受访者(个人/商户/司机/站点运营)对应不同问卷分支。

## 在线访问

通过 GitHub Pages 部署: <https://czcvip.github.io/wanfeng-survey/>

## 架构

```
[浏览器] POST JSON
    ↓
[阿里云 函数计算 FC] (Web 函数, anonymous HTTP 触发器, cn-hangzhou)
    ↓ STS 凭证
[阿里云 表格存储 TableStore] 实例 m026fekm931d / 表 survey_submissions
```

- 前端: 单页 HTML (`index.html`)
- 后端: Node.js 20 Web 函数 (`aliyun-fc/index.js`)
- 数据: 主键 `record_id`,所有原始字段以 JSON 存于 `raw_data` 列

## 目录

| 路径 | 说明 |
|---|---|
| `index.html` | 调查表页面,GitHub Pages 部署入口 |
| `aliyun-fc/index.js` | FC 函数代码(贴入控制台 WebIDE) |
| `aliyun-fc/package.json` | FC 依赖声明(`tablestore`) |

## 部署 FC

1. 阿里云 FC 控制台创建 Web 函数(Node.js 20 自定义运行时)
2. RAM 角色挂 `AliyunOTSFullAccess`
3. 启动命令: `node index.js`,监听端口 9000
4. HTTP 触发器认证方式: 匿名(anonymous),允许 POST + OPTIONS
5. WebIDE 终端执行 `npm install tablestore --save`
6. 把 `aliyun-fc/index.js` 内容贴入,部署
7. 拿到公网 URL 写入 `index.html` 的 `SURVEY_ENDPOINT`

## 看数据

阿里云控制台 → 表格存储 → 实例 `m026fekm931d` → 表 `survey_submissions` → 数据管理。
