/**
 * 火山引擎图片生成相关工具函数
 */

export interface ImageGenerationOptions {
  model?: string;
  size?: string;
  watermark?: boolean;
  images?: string[];
}

export interface ImageGenerationResult {
  tempUri: string;
  success: boolean;
  error?: string;
}

let ARK_API_KEY = "";

export function setArkApiKey(apiKey: string) {
  ARK_API_KEY = apiKey;
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
  const {
    model = "doubao-seedream-4-0-250828",
    size = "1792x1024",
    watermark = false,
    images = [],
  } = options;

  try {
    // 调用火山引擎 API 生成图片
    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ARK_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          response_format: "url",
          size,
          watermark,
          // 智能参考
          image: images,
          // 智能组图
          sequential_image_generation: "auto",
          sequential_image_generation_options: {
            max_images: 4,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as {
        error: { code: string; message: string };
      };
      // console.error("Failed to generate image from API", error);
      return {
        tempUri: "",
        success: false,
        error: `Failed to generate image from API: ${error.error.code}`,
      };
    }

    const result = (await response.json()) as { data: { url: string }[] };
    let imageUrl = result.data?.[0]?.url;

    if (!imageUrl) {
      return {
        tempUri: "",
        success: false,
        error: "No image URL returned from API",
      };
    }

    return {
      tempUri: imageUrl,
      success: true,
    };
  } catch (error) {
    return {
      tempUri: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
