# AI解决方案进展＋需求收集

八月第二周项目汇报网页，集中展示晚星陪伴机器人、复诊机器人、Copilot 系统、物理治疗管理系统与周年庆 UI 的需求满足情况、数据验证、现存问题和下一步方案。

## 本地运行

```bash
npm ci
npm run dev
```

## 构建

- Sites：`npm run build`
- Netlify：`npm run build:netlify`

Netlify 已通过根目录的 `netlify.toml` 固定使用 Node.js 22 和 Next.js 构建。

## 数据说明

新增需求功能在原 Sites 部署中使用 Cloudflare D1。Netlify 部署可完整呈现项目汇报与可视化页面；若需在 Netlify 长期保存新增需求，请再接入 Netlify 支持的持久化数据库。
