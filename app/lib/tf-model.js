import * as tf from "@tensorflow/tfjs"

// 加载预训练模型
export async function loadModel(modelPath) {
  try {
    const model = await tf.loadGraphModel(modelPath)
    return model
  } catch (error) {
    console.error("加载模型失败:", error)
    throw error
  }
}

// 图像预处理
export function preprocessImage(imageElement, targetSize = [224, 224]) {
  // 将图像转换为tensor
  const tensor = tf.browser.fromPixels(imageElement).resizeNearestNeighbor(targetSize).toFloat().expandDims()

  // 归一化 [0,1]
  return tensor.div(255.0)
}

// 执行对象检测
export async function detectObjects(model, imageElement) {
  // 预处理图像
  const tensor = preprocessImage(imageElement)

  // 执行推理
  const predictions = await model.executeAsync(tensor)

  // 处理结果
  const boxes = predictions[0].arraySync()[0]
  const scores = predictions[1].arraySync()[0]
  const classes = predictions[2].arraySync()[0]

  // 释放tensor内存
  tf.dispose([tensor, ...predictions])

  // 返回检测结果
  return boxes
    .map((box, i) => ({
      box,
      score: scores[i],
      class: classes[i],
    }))
    .filter((item) => item.score > 0.5) // 过滤低置信度结果
}
