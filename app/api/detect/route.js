import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("image")
    const modelId = formData.get("modelId")
    const threshold = formData.get("threshold")

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "未提供图像文件",
        },
        { status: 400 },
      )
    }

    // 保存上传的图像
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${uuidv4()}.jpg`
    const imagePath = join(process.cwd(), "public", "uploads", fileName)
    await writeFile(imagePath, buffer)

    // 调用Python后端进行检测
    const detectResponse = await fetch("http://your-python-backend/api/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imagePath: `/uploads/${fileName}`,
        modelId,
        threshold,
      }),
    })

    const result = await detectResponse.json()

    return NextResponse.json({
      success: true,
      imagePath: `/uploads/${fileName}`,
      defects: result.defects,
    })
  } catch (error) {
    console.error("检测请求失败:", error)
    return NextResponse.json(
      {
        success: false,
        message: "检测失败",
      },
      { status: 500 },
    )
  }
}
