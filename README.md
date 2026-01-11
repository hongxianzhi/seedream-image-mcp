# SeeDream Image MCP

基于火山引擎 SeeDream 模型的 MCP (Model Context Protocol) 图片生成工具。

## ✨ 特性

- 🎨 使用火山引擎 SeeDream 4.0 模型生成高质量图片
- 🔧 支持自定义尺寸、智能参考图等
- 📝 无需编写复杂提示词，AI自动根据需求生成生图提示词
- 🔌 MCP 协议支持，可在 Cursor、Claude Desktop 等客户端中使用

## 📺 演示

<video src="https://github.com/user-attachments/assets/2b82a9d4-7799-4625-a140-2a48845b2e4a" autoplay muted loop playsinline controls width="100%" height="auto"></video>

## 🚀 快速开始

### 1. 获取火山引擎 API Key

前往 [火山引擎->火山方舟控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey) 开通服务并申请 API Key。

### 2. 使用 npx 运行

```bash
npx @hongxianzhi/seedream-image-mcp --ark-key=YOUR_API_KEY [--ark-model=MODEL_NAME] [--ark-endpoint=REQUEST_ENDPOINT]
```

**参数说明：**
- `--ark-key` (必需) - 火山引擎 API Key
- `--ark-model` (可选) - 模型名称，默认 `doubao-seedream-4-5-251128`
- `--ark-endpoint` (可选) - 请求地址，默认 `https://ark.cn-beijing.volces.com/api/v3/images/generations`

### 3. 在 Cursor、Claude Desktop 中配置

编辑 `Cursor MCP配置` 或 `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "seedream-image": {
      "command": "npx",
      "args": ["@hongxianzhi/seedream-image-mcp", "--ark-key=YOUR_API_KEY", "--ark-model=doubao-seedream-4-5-251128", "--ark-endpoint=https://ark.cn-beijing.volces.com/api/v3/images/generations"]
    }
  }
}
```

## 📖 使用示例

在 AI Agent 工具中，你可以这样使用：

```
为这个页面添加合适的图片，避免过于单调
```

AI 会自动调用工具完成生成。

## 📌 注意事项

**图片链接时效性**：本项目使用火山引擎原始 API，生成的图片链接通常在 24 小时后失效。如果你需要长期保存图片，请及时下载到本地。

## 🔄 两种使用方式

你可以根据自己的需求选择：

### 方式一：本地运行 🔧
- 需要自己申请火山引擎 API key
- 图片链接 24 小时后失效，需下载到本地使用。

### 方式二：云端版本 ✨
- ✅ 无需申请 API key，开箱即用
- ✅ 图片支持永久存储在 CDN
- ✅ 支持 webp 压缩、背景移除、快速并发生成多张图片等功能
- ✅ 提供一定的免费额度
- ✅ 量大时价格更优惠

👉 了解云端版本：[https://mcp.pixelark.art](https://mcp.pixelark.art)

---


## 🛠️ 开发

### 安装依赖

```bash
npm install
```

### 编译项目

```bash
npm run build
```

### 全局安装

如需全局安装此包以便在命令行中使用，可执行以下步骤：

```bash
# 1. 正常编译
npm run build

# 2. 拷贝 dist/index.js 到全局 npm 目录
cp dist/index.js "$(npm prefix -g)/lib/node_modules/seedream-image-mcp/dist/index.js"

# 3. 创建符号链接到全局目录
ln -sf "$(npm prefix -g)/lib/node_modules/seedream-image-mcp/dist/index.js" "$(npm prefix -g)/bin/seedream-image-mcp"
```

或者使用 npm link（推荐）：

```bash
npm run build
npm link
```

## 📄 许可证

MIT

## 🔗 相关链接

- [云端版本](https://mcp.pixelark.art)
- [火山引擎 SeeDream](https://www.volcengine.com/docs/ark/doubao-seedream)
- [MCP 协议](https://modelcontextprotocol.io)
