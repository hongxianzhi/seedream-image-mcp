# SeeDream Image MCP

基于火山引擎 SeeDream 模型的 MCP (Model Context Protocol) 图片生成工具。

## ✨ 特性

- 🎨 使用火山引擎 SeeDream 4.0 模型生成高质量图片
- 🔧 支持自定义尺寸、智能参考图等参数
- 📝 无需编写复杂提示词，AI自动根据需求生成生图提示词
- 🔌 MCP 协议支持，可在 Cursor、Claude Desktop 等客户端中使用

## 🚀 快速开始

### 1. 获取火山引擎 API Key

前往 [火山引擎控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey) 申请 API Key。

### 2. 使用 npx 运行

```bash
npx seedream-image-mcp --ark-key=YOUR_API_KEY
```

### 3. 在 Cursor、Claude Desktop 中配置

编辑 `Cursor MCP配置` 或 `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "seedream-image": {
      "command": "npx",
      "args": ["seedream-image-mcp", "--ark-key=YOUR_API_KEY"]
    }
  }
}
```

## 📖 使用示例

在 Claude Desktop 中，你可以这样使用：

```
帮我生成一张图片：赛博朋克风格的未来城市，霓虹灯闪烁，高清细节，杰作
```

Claude 会自动调用 generate-image 工具完成生成。

## ⚠️ 开源版限制

本开源版本提供基础的图片生成能力，但存在以下限制：

| 功能 | 开源版 | 商业版 |
|------|--------|--------|
| API Key | ❌ 需自己申请和管理 | ✅ 无需申请 |
| 图片存储 | ⚠️ 24小时临时URL | ✅ 永久CDN |
| 图片优化 | ❌ 无优化 | ✅ webp压缩 + 智能缩放 |
| 背景移除 | ❌ | ✅ 一键移除 |
| 预设尺寸 | ⚠️ 需手动输入 | ✅ 8种预设比例 |
| 并发生成 | ❌ 同步等待 | ✅ 异步并发 |
| 技术支持 | ❌ | ✅ 专业支持 |

## 💡 升级到商业版

如果你遇到以下问题，建议试试商业版：

- ❌ 不想申请和管理 API key
- ❌ URL 过期导致图片丢失
- ❌ 需要图片优化减小图片体积（webp、智能缩放）
- ❌ 需要支持生成透明背景图片
- ❌ 需要并发生成多张图片

### 🎁 免费试用

**注册即送 30 张免费额度**，立即体验完整功能！

👉 [访问 https://mcp.pixelark.art](https://mcp.pixelark.art)

---

## 🛠️ 开发

### 安装依赖

```bash
bun install
```

### 本地运行

```bash
bun run src/index.ts --ark-key=YOUR_API_KEY
```

## 📄 许可证

MIT

## 🔗 相关链接

- [商业版官网](https://mcp.pixelark.art)
- [火山引擎 SeeDream](https://www.volcengine.com/docs/ark/doubao-seedream)
- [MCP 协议](https://modelcontextprotocol.io)
