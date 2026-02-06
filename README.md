# xg-icons-hub
又一个图标托管项目~ 让你的 Docker 、导航站更 Nice！
博主提供了自行重置的部分高清图标，可以直接食用，当然亦可私有自行部署。

## 部署

### Cloudflare Pages
- 默认即可部署（安装阶段执行 `postinstall` 生成 `dist` 并发布）。
- 可选参数（如需手动设置）：
  - 构建命令：`npm ci` 或 `npm run build`（默认即可）
  - 输出目录：`dist`

### EdgeOne Pages
- 必须在「构建设置」里将 输出目录 设置为：`dist`
- 其他参数（默认即可）：
  - 框架设置：Other
  - 根目录：./
  - 安装命令：`npm ci`
  - 构建命令：留空 或 `npm run build`

### 快速启动（需 Fork）
- 请先 Fork 本仓库到你的 GitHub 账号，然后：
  - Cloudflare Pages：在控制台「创建项目 → 连接 GitHub」选择你的 fork 仓库，默认即可部署；如需手动参数参考上文。
  - EdgeOne Pages：在控制台构建设置中仅需填写 输出目录：`dist`，其他参数保持默认即可。

## 本地开发
- 构建：`npm run build`
- 预览（可选，本地 Node 服务器）：`npm start`（默认端口 `5000`）

## Docker 部署示例（参考）

示例使用 Compose 将宿主机图标目录挂载到容器 `/app/images`，并将 28080 映射到容器端口 5000：

- Docker Hub 镜像：

```yaml
services:
  xg-icons-hub:
    image: verky/xg-icons-hub:latest
    container_name: xg-icons-hub
    ports:
      - "28080:5000"
    volumes:
      - ./images:/app/images
    environment:
      - SITE_NAME=xg-icons-hub
      # 可选变量（按需打开）：
      # - LOGO_IMG=images/website/GitHub.png
      # - FAVICON=/static/favicon.ico
      # - COPYRIGHT=版权所有 © 2026
      # - ICP=粤ICP备12345678号-1
      # - SEO_DESC=站点描述
    restart: unless-stopped
```

- ghcr 镜像：
```yaml
services:
  xg-icons-hub:
    image: ghcr.io/verkyer/xg-icons-hub:latest
    container_name: xg-icons-hub
    ports:
      - "28080:5000"
    volumes:
      - ./images:/app/images
    environment:
      - SITE_NAME=xg-icons-hub
      # 可选变量（按需打开）：
      # - LOGO_IMG=favicon.ico        # 路径或完整 URL
      # - FAVICON=/static/favicon.ico
      # - COPYRIGHT=HTML 文本
      # - ICP=粤ICP备12345678号-1
      # - SEO_DESC=站点描述
    restart: unless-stopped
```

## 环境变量
`SITE_NAME`、`LOGO_IMG`、`FAVICON`、`COPYRIGHT`、`ICP`、`SEO_DESC` 均为独立变量，互不影响、互不覆盖。可以单独或组合设置。

- `SITE_NAME`：站点名称（浏览器标签标题、页面大标题）
- `LOGO_IMG`：页面内 Logo 图（支持完整 `http(s)` 链接或相对路径，如 `images/website/GitHub.png`）
- `FAVICON`：浏览器标签图标（支持完整链接或相对路径；未设置时默认使用 `/static/favicon.ico`）
- `COPYRIGHT`：页脚版权信息（HTML 文本）
- `ICP`：备案号文本；设置后显示在版权信息下方，未设置则不显示
- `SEO_DESC`：页面 `<meta name="description">` 文本


生成与使用流程：
- 安装或构建时，[build.js](./build.js) 会把环境变量写入 `dist/api/config.json`
- 构建与服务端渲染会在首页 HTML 中直接注入标题/Logo/描述/页脚（含 ICP），避免首次加载闪烁
- 前端运行时由 [static/script.js](./static/script.js) 读取并同步页面状态（与后端注入一致）

## 说明
- 构建脚本：[build.js](./build.js) 使用 Node.js 内置模块，将图标数据生成为静态 JSON（`/api/icons.json`、`/api/config.json`），以及复制资源至 `dist`。
- 前端通过静态接口加载数据：[static/script.js](./static/script.js)。
