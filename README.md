# xg-icons-hub
又一个图标托管项目~

## 部署（Cloudflare Pages / EdgeOne Pages）
Cloudflare Pages：默认即可部署（安装阶段执行 `postinstall` 生成 `dist` 并发布）。
Fork 仓库后，在 Cloudflare Pages 控制台「创建项目 → 连接 GitHub」选择你的 fork 仓库即可开始部署；如需手动设置：
  - 构建命令：`npm ci` 或 `npm run build`（默认即可）
  - 输出目录：`dist`
  - 一键发起：先 Fork 仓库 → 在 Cloudflare Pages 控制台「创建项目 → 连接 GitHub」选择你 Fork 的仓库，直接开始部署。
  - 如需手动设置（可选）：
    - 构建命令：`npm ci` 或 `npm run build`
    - 输出目录：`dist`

### EdgeOne Pages（默认即可）
- 仅需在「构建设置」里填写 输出目录：`dist`
- 其他参数建议：
  - 框架设置：Other（默认即可）
  - 根目录：./（默认即可）
  - 安装命令：`npm ci`（默认即可）
  - 构建命令：留空 或 `npm run build`（默认即可）

## 本地开发
- 构建：`npm run build`
- 预览（可选，本地 Node 服务器）：`npm start`（默认端口 `5000`）

## 环境变量（可选）
- `SITE_NAME`：网站标题与浏览器标签标题；留空则使用默认 `XG-icons`
- `LOGO_IMG`：网站 Logo 与 favicon；可填完整 `http` 链接或仓库内路径（例如 `images/website/GitHub.png`）
- `COPYRIGHT`：版权信息 HTML 文本；留空则默认

生成与使用流程：安装或构建时，[build.js](./build.js) 会把环境变量写入 `dist/api/config.json`；前端在运行时由 [static/script.js](./static/script.js) 读取并应用到页面（标题、Logo、版权）。

## 说明
- 构建脚本：[build.js](./build.js) 使用 Node.js 内置模块，将图标数据生成为静态 JSON（`/api/icons.json`、`/api/config.json`），以及复制资源至 `dist`。
- 前端通过静态接口加载数据：[static/script.js](./static/script.js)。
