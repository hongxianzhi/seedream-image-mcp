#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateImage, setArkApiKey } from "./utils/vol.js";

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  let arkKey = "";

  for (const arg of args) {
    if (arg.startsWith("--ark-key=")) {
      arkKey = arg.substring("--ark-key=".length);
    }
  }

  if (!arkKey) {
    console.error("Error: --ark-key is required");
    console.error("Usage: npx seedream-image-mcp --ark-key=YOUR_API_KEY");
    process.exit(1);
  }

  return { arkKey };
}

const { arkKey } = parseArgs();
setArkApiKey(arkKey);

const server = new McpServer({
  name: "seedream-image-mcp",
  version: "1.0.0",
});

// 注册图片生成工具
server.registerTool(
  "generate-image",
  {
    title: "生成图片",
    description:
      "使用火山引擎 SeeDream 模型生成图片。支持文字描述生成、智能参考图等功能",
    inputSchema: {
      prompt: z
        .string()
        .min(1)
        .max(5000)
        .describe(`图片描述提示词

【提示词编写建议】
1. 基础结构：内容主题 → 视觉细节 → 风格氛围 → 技术质量
2. 关键要素：
   - 主体内容：明确要生成什么（场景/物体/氛围）
   - 视觉细节：材质、光影、色彩、构图、景深
   - 风格定调：写实/插画/3D/扁平/抽象等
   - 技术要求：分辨率、构图方式、背景类型
3. 语言规范：使用现代中文，逗号分隔关键词
4. 质量提升：结尾添加"高清细节，杰作"等质量声明

【重要约束】
- 默认添加"画面无文字"；如需文字，明确标注"画面文字内容：XXX"
- 内容必须合法合规`),
      size: z
        .string()
        .optional()
        .describe(
          `图片尺寸，格式为 WIDTHxHEIGHT，默认 1792x1024

常用尺寸参考：
- 21:9 超宽屏: 3024x1296
- 16:9 横屏: 2560x1440, 1792x1024
- 4:3 传统: 2304x1728
- 1:1 方形: 2048x2048
- 3:4 竖屏: 1728x2304
- 9:16 手机: 1440x2560`,
        ),
      watermark: z
        .boolean()
        .optional()
        .describe("是否添加AI生成水印，默认为 false"),
      images: z
        .array(z.string())
        .optional()
        .describe("智能参考图片 URL 列表，支持多张图片作为参考"),
    },
    outputSchema: {
      success: z.boolean(),
      imageUrl: z.string().optional(),
      error: z.string().optional(),
    },
  },
  async ({ prompt, size, watermark, images }) => {
    const result = await generateImage(prompt, {
      size,
      watermark,
      images,
    });

    const output = {
      success: result.success,
      imageUrl: result.tempUri,
      error: result.error,
    };

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: `✅ 图片生成成功！

🖼️  图片URL: ${result.tempUri}

⚠️  重要提示：
此链接为火山引擎临时URL，通常在 24 小时后过期。
如需永久存储，请及时保存图片或考虑使用商业版。

💡 想要更好的体验？
商业版提供：永久CDN + 图片优化 + 背景移除 + 预设尺寸
👉 访问 https://mcp.pixelark.art （注册送30张免费额度）`,
          },
        ],
        structuredContent: output,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `❌ 图片生成失败: ${result.error}

💡 遇到问题？试试商业版：
- 无需自己申请 API key
- 更稳定的服务和技术支持
- 注册即送 30 张免费额度
👉 https://mcp.pixelark.art`,
        },
      ],
      structuredContent: output,
    };
  },
);

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SeeDream Image MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
