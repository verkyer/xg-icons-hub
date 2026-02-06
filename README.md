# xg-icons-hub
又一个图标托管项目~ 让你的 Docker 、导航站更 Nice！

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
      # - ICP=粤ICP备12345678号-1           # 备案号，可选
      # - SEO_DESC=站点描述，可选
      # - FAVICON=/static/favicon.ico       # 或 http 链接
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
      # - LOGO_IMG=favicon.ico   # 路径或完整 URL
      # - COPYRIGHT=...          # 可选，HTML 文本
      # - ICP=粤ICP备12345678号-1
      # - SEO_DESC=站点描述
      # - FAVICON=/static/favicon.ico
    restart: unless-stopped
```

## 环境变量（可选）
- `SITE_NAME`：网站标题与浏览器标签标题；留空则使用默认 `XG-icons`
- `LOGO_IMG`：网站 Logo 与 favicon；可填完整 `http` 链接或仓库内路径（例如 `images/website/GitHub.png`）
- `COPYRIGHT`：版权信息 HTML 文本；留空则默认
- `ICP`：备案号文本；若设置，将在页脚版权下方另起一行显示，并以新窗口、`rel="noopener noreferrer nofollow"` 链接到 https://beian.miit.gov.cn/；未设置则不显示
- `SEO_DESC`：页面描述 `<meta name="description">` 文本
- `FAVICON`：浏览器标签图标；支持相对路径或完整 URL

生成与使用流程：安装或构建时，[build.js](./build.js) 会把环境变量写入 `dist/api/config.json`；同时构建与服务端渲染会在输出 HTML 中直接注入标题/Logo/描述/页脚（含 ICP）；前端在运行时由 [static/script.js](./static/script.js) 读取并进一步同步（避免闪烁）。

## 说明
- 构建脚本：[build.js](./build.js) 使用 Node.js 内置模块，将图标数据生成为静态 JSON（`/api/icons.json`、`/api/config.json`），以及复制资源至 `dist`。
- 前端通过静态接口加载数据：[static/script.js](./static/script.js)。
