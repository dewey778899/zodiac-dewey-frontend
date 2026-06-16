# Zodiac Dewey Frontend

H5 主站与运营后台前端工程。

## 当前包含

- 首页
- 爱情 / 事业 / 财运表单
- 报告展示页
- 报告分享页
- 后台管理页 `admin.html`

## 本地访问

如果你用本地静态服务启动：

- 首页：`http://127.0.0.1:3000/`
- 后台：`http://127.0.0.1:3000/admin.html`

后端默认联调地址：

- `http://127.0.0.1:8080`

## Docker 角色

这个项目的 Docker 角色是：

- 作为静态站点容器运行
- 通过 Nginx 托管 H5 页面
- 反向代理 `/api/*` 到后端容器

所以它是生产环境中的一个常驻服务。

## 镜像建议

建议镜像名：

- `registry.cn-shanghai.aliyuncs.com/dewey_zodiac/zodiac-dewey-frontend`

## 部署职责

前端容器负责：

- 对外提供 H5 页面
- 提供分享页访问
- 提供后台管理页访问

后端容器负责：

- 报告 API
- 支付 API
- 返现 API
- 管理后台 API

## 线上建议域名

- H5：`https://zodiac.njjyin.com`
- API：`https://api.zodiac.njjyin.com`

如果仍想同域部署，也可以让 Nginx 代理：

- `/api/*` -> backend

## 注意

这个项目是 H5 常驻服务，不是小程序构建工程。

小程序请看：

- `D:/codex/zodiac/zodiac-dewey-miniapp`
