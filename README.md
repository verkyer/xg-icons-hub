# xg-icons-hub
又一个图标托管项目~

## 部署（Cloudflare Pages / EdgeOne Pages）
- 默认无需配置：平台在执行 `npm install` 或 `npm ci` 后，会自动触发 `postinstall`，生成 `dist` 目录并发布。
- 若自动识别失败（兜底设置）：
  - 构建命令：`npm ci` 或 `npm run build`
  - 输出目录：`dist`

## 本地开发
- 构建：`npm run build`
- 预览（可选，本地 Node 服务器）：`npm start`

## 说明
- 构建脚本：[build.js](file:///d:/Documents/AI/xg-icons-hub/xg-icons-hub/build.js) 使用 Node.js 内置模块，将图标数据生成为静态 JSON（`/api/icons.json`、`/api/config.json`），以及复制资源至 `dist`。
- 前端通过静态接口加载数据：[static/script.js](file:///d:/Documents/AI/xg-icons-hub/xg-icons-hub/static/script.js#L14-L18)、[static/script.js](file:///d:/Documents/AI/xg-icons-hub/xg-icons-hub/static/script.js#L60-L66)。
