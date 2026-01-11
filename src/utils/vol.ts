import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import sizeOf from "image-size";

/**
 * 火山引擎图片生成相关工具函数
 */

export interface ImageGenerationOptions {
  model?: string;
  size?: string;
  watermark?: boolean;
  images?: string[];
  mask?: string;
}

export interface ImageGenerationResult {
  tempUri: string;
  base64?: string;
  mimeType?: string;
  success: boolean;
  error?: string;
}

let ARK_ENDPOINT =
  "https://ark.cn-beijing.volces.com/api/v3/images/generations";
let ARK_MODEL = "doubao-seedream-4-5-251128";
let ARK_API_KEY = "";

/**
 * 图片处理工具函数
 */
export const ImageUtils = {
  /**
   * 判断是否为 Data URI
   */
  isDataUri(s: string): boolean {
    return s.startsWith("data:");
  },

  /**
   * 判断是否为网络 URL
   */
  isRemoteUrl(s: string): boolean {
    return s.startsWith("http://") || s.startsWith("https://");
  },

  /**
   * 将 Buffer 或 Base64 字符串转换为 Data URI
   */
  toDataUri(data: Buffer | ArrayBuffer | string, mimeType: string): string {
    let base64: string;
    if (typeof data === "string") {
      base64 = data;
    } else if (data instanceof Buffer) {
      base64 = data.toString("base64");
    } else {
      base64 = Buffer.from(data as ArrayBuffer).toString("base64");
    }
    return `data:${mimeType};base64,${base64}`;
  },

  /**
   * 解析 Data URI 获取内容
   */
  parseDataUri(dataUri: string): { buffer: Buffer; mimeType: string } {
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || !matches[1] || !matches[2]) {
      throw new Error("Invalid Data URI format");
    }
    return {
      mimeType: matches[1],
      buffer: Buffer.from(matches[2], "base64"),
    };
  },

  /**
   * 获取 Base64 字符串（去除前缀）
   */
  getBase64(input: string): string {
    if (this.isDataUri(input)) {
      const parts = input.split(",");
      return parts[1] || "";
    }
    return input;
  },

  /**
   * 根据文件名获取 MIME 类型
   */
  getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const map: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      bmp: "image/bmp",
      tiff: "image/tiff",
    };
    // 尽可能返回标准 MIME，由于是图片生成，默认为 image/ 格式
    if (map[ext]) return map[ext];
    return ext ? `image/${ext}` : "image/png";
  },

  /**
   * 获取图片的尺寸 (Width x Height)
   */
  async getImageSize(input: string): Promise<string | null> {
    try {
      let buffer: Buffer;
      if (this.isDataUri(input)) {
        buffer = this.parseDataUri(input).buffer;
      } else if (this.isRemoteUrl(input)) {
        const response = await fetch(input);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        // 本地路径
        const absolutePath = path.isAbsolute(input)
          ? input
          : path.resolve(process.cwd(), input);
        if (!fs.existsSync(absolutePath)) return null;
        buffer = fs.readFileSync(absolutePath);
      }

      const dimensions = sizeOf(buffer);
      if (dimensions.width && dimensions.height) {
        return `${dimensions.width}x${dimensions.height}`;
      }
    } catch (e) {
      console.error("[SeeDream] Failed to get image size:", e);
    }
    return null;
  },
};

export function setArkApiKey(
  apiKey: string,
  model?: string,
  endpoint?: string,
) {
  ARK_API_KEY = apiKey;
  if (model) ARK_MODEL = model;
  if (endpoint) ARK_ENDPOINT = endpoint;
}

/**
 * 处理图片，如果是本地路径则转换为 base64
 */
async function processImage(imagePath: string): Promise<string> {
  if (ImageUtils.isRemoteUrl(imagePath) || ImageUtils.isDataUri(imagePath)) {
    console.error(
      `[SeeDream] Using image URL/DataURI: ${imagePath.substring(0, 50)}...`,
    );
    return imagePath;
  }

  try {
    // 尝试读取本地文件
    const absolutePath = path.isAbsolute(imagePath)
      ? imagePath
      : path.resolve(process.cwd(), imagePath);

    if (fs.existsSync(absolutePath)) {
      console.error(`[SeeDream] Reading local image: ${absolutePath}`);
      const bitmap = fs.readFileSync(absolutePath);
      const mimeType = ImageUtils.getMimeType(absolutePath);
      return ImageUtils.toDataUri(bitmap, mimeType);
    } else {
      console.error(`[SeeDream] Local image not found: ${absolutePath}`);
    }
  } catch (error) {
    console.error(`[SeeDream] Error processing image ${imagePath}:`, error);
  }

  return imagePath;
}

/**
 * 使用火山引擎生成图片并存储到 OSS
 * @param prompt 图片描述提示词
 * @param options 可选配置项
 * @returns 生成结果包含存储的 URI
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {},
): Promise<ImageGenerationResult> {
  let {
    model = ARK_MODEL,
    watermark = false,
    images = [],
    mask,
    size,
  } = options;

  try {
    // 构建请求参数
    const requestBody: any = {
      model,
      prompt,
      response_format: "b64_json",
      watermark,
    };

    // 如果没有显式指定尺寸，但在进行编辑（有参考图或蒙版），尝试获取原图尺寸
    if (!size && (images.length > 0 || mask)) {
      const sourceImage = mask || images[0];
      if (sourceImage) {
        console.error(
          "[SeeDream] Attempting to auto-detect original image size...",
        );
        const detectedSize = await ImageUtils.getImageSize(sourceImage);
        if (detectedSize) {
          console.error(`[SeeDream] Auto-detected size: ${detectedSize}`);
          // 检查尺寸是否满足 API 最小要求 (约 1024x1024 = 1,048,576 像素)
          // 官方限制是总像素不小于 921,600
          const dimensions = detectedSize.split("x").map(Number);
          const w = dimensions[0];
          const h = dimensions[1];

          if (w && h && w * h < 921600) {
            console.error(
              `[SeeDream] Detected size ${detectedSize} is too small (${w * h} px). Upscaling to 1024x1024...`,
            );
            size = "1024x1024";
          } else {
            size = detectedSize;
          }
        }
      }
    }

    if (size) {
      requestBody.size = size;
    }

    // 智能组图（仅在无参考图时默认开启）
    if (!images.length && !mask) {
      requestBody.sequential_image_generation = "auto";
      requestBody.sequential_image_generation_options = {
        max_images: 4,
      };
    }

    // 处理参考图
    if (images && images.length > 0) {
      const processedImages = await Promise.all(
        images.map((img) => processImage(img)),
      );
      requestBody.image = processedImages;
    }

    // 处理蒙版（用于图片编辑/局部重绘）
    if (mask) {
      requestBody.mask = await processImage(mask);
    }

    console.error("[SeeDream] Sending request to ARK API...");
    // 打印请求体（隐藏 base64 以免日志过大）
    const logBody = JSON.parse(JSON.stringify(requestBody));
    if (logBody.image) {
      logBody.image = logBody.image.map((img: string) =>
        ImageUtils.isRemoteUrl(img)
          ? img
          : `${img.substring(0, 30)}... (base64 trunced)`,
      );
    }
    if (logBody.mask) {
      logBody.mask = ImageUtils.isRemoteUrl(logBody.mask)
        ? logBody.mask
        : `${logBody.mask.substring(0, 30)}... (base64 trunced)`;
    }
    console.error(
      "[SeeDream] Request Body Preview:",
      JSON.stringify(logBody, null, 2),
    );

    // 调用火山引擎 API 生成图片
    const response = await fetch(ARK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[SeeDream] API Error Response (${response.status}):`,
        errorText,
      );
      try {
        const error = JSON.parse(errorText) as {
          error: { code: string; message: string };
        };
        return {
          tempUri: "",
          success: false,
          error: `API Error: ${error.error.message || error.error.code}`,
        };
      } catch (e) {
        return {
          tempUri: "",
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }
    }

    const result = (await response.json()) as {
      data: { url?: string; b64_json?: string }[];
    };
    const b64Data = result.data?.[0]?.b64_json;
    const imageUrl = result.data?.[0]?.url || "";

    if (b64Data) {
      console.error(
        `[SeeDream] Image generated successfully (Base64 received)`,
      );
      const mimeType = "image/png";
      return {
        tempUri: imageUrl || ImageUtils.toDataUri(b64Data, mimeType),
        base64: b64Data,
        mimeType,
        success: true,
      };
    }

    if (!imageUrl) {
      return {
        tempUri: "",
        success: false,
        error: "No image data returned from API",
      };
    }

    console.error(`[SeeDream] Image generated (URL): ${imageUrl}`);

    // 如果 API 只返回了 URL，则尝试转换
    try {
      console.error("[SeeDream] Fetching image for base64 conversion...");
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok)
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);

      const buffer = await imageResponse.arrayBuffer();
      const mimeType = imageResponse.headers.get("content-type") || "image/png";

      console.error(
        `[SeeDream] Successfully converted to base64 (${mimeType})`,
      );

      return {
        tempUri: imageUrl,
        base64: Buffer.from(buffer).toString("base64"),
        mimeType,
        success: true,
      };
    } catch (fetchError) {
      console.error(
        "[SeeDream] Base64 conversion failed, falling back to URL only:",
        fetchError,
      );
      return {
        tempUri: imageUrl,
        success: true,
      };
    }
  } catch (error) {
    return {
      tempUri: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
