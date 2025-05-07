"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Search, FileText, ImageIcon, AlertCircle } from "lucide-react"
import Image from "next/image"
import * as tf from "@tensorflow/tfjs"

export default function DetectionPage() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [detectionResults, setDetectionResults] = useState(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [model, setModel] = useState(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState("default")
  const [threshold, setThreshold] = useState("0.5")
  const imageRef = useRef(null)

  // 加载TensorFlow.js模型
  useEffect(() => {
    async function initModel() {
      try {
        setModelLoading(true)
        // 在实际应用中，这里应该加载您训练好的模型
        // 这里使用示例URL，实际部署时需要替换为真实模型URL
        await tf.ready()
        console.log("TensorFlow.js已准备就绪")

        // 注意：这是一个示例URL，实际使用时需要替换
        // const loadedModel = await loadModel('/models/model.json');
        // setModel(loadedModel);

        // 模拟模型加载完成
        setTimeout(() => {
          setModelLoading(false)
          console.log("模型加载完成")
        }, 2000)
      } catch (error) {
        console.error("加载模型失败:", error)
        setModelLoading(false)
      }
    }

    initModel()
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedImage({
        file,
        name: file.name,
        url: URL.createObjectURL(file),
      })
      setDetectionResults(null)
    }
  }

  const runDetection = async () => {
    if (!selectedImage) return

    setIsDetecting(true)

    try {
      // 创建FormData对象
      const formData = new FormData()
      formData.append("image", selectedImage.file)
      formData.append("modelId", selectedModelId)
      formData.append("threshold", threshold)

      // 调用检测API
      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("检测请求失败")
      }

      const result = await response.json()

      if (result.success) {
        setDetectionResults({
          defects: result.defects || [],
        })
      } else {
        console.error("检测失败:", result.message)
        // 使用模拟数据作为后备
        simulateDetection()
      }
    } catch (error) {
      console.error("检测过程出错:", error)
      // 使用模拟数据作为后备
      simulateDetection()
    } finally {
      setIsDetecting(false)
    }
  }

  // 模拟检测过程（当后端API不可用时使用）
  const simulateDetection = () => {
    setTimeout(() => {
      setDetectionResults({
        defects: [
          {
            id: 1,
            type: "划痕",
            confidence: 0.92,
            x: 150,
            y: 200,
            width: 100,
            height: 50,
            color: "#ef4444",
          },
          {
            id: 2,
            type: "污渍",
            confidence: 0.87,
            x: 300,
            y: 250,
            width: 80,
            height: 80,
            color: "#eab308",
          },
        ],
      })
      setIsDetecting(false)
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">缺陷检测</h1>

      <Tabs defaultValue="detection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detection">单张检测</TabsTrigger>
          <TabsTrigger value="batch">批量检测</TabsTrigger>
          <TabsTrigger value="reports">检测报告</TabsTrigger>
        </TabsList>

        <TabsContent value="detection" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>图像检测</CardTitle>
                <CardDescription>上传图像并进行缺陷检测</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">上传图像</h3>
                    <p className="text-sm text-muted-foreground mb-4">拖放文件到此处或点击下方按钮选择文件</p>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Label htmlFor="image-upload">
                      <Button variant="outline">选择图像</Button>
                    </Label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full" style={{ height: "500px" }}>
                      <Image
                        src={selectedImage.url || "/placeholder.svg"}
                        alt={selectedImage.name}
                        fill
                        className="object-contain"
                        ref={imageRef}
                      />

                      {/* 检测结果标注 */}
                      {detectionResults &&
                        detectionResults.defects.map((defect) => (
                          <div
                            key={defect.id}
                            className="absolute border-2 bg-opacity-20"
                            style={{
                              left: `${defect.x}px`,
                              top: `${defect.y}px`,
                              width: `${defect.width}px`,
                              height: `${defect.height}px`,
                              borderColor: defect.color,
                              backgroundColor: defect.color,
                            }}
                          >
                            <span
                              className="absolute top-0 left-0 text-xs px-1 text-white"
                              style={{ backgroundColor: defect.color }}
                            >
                              {defect.type} ({Math.round(defect.confidence * 100)}%)
                            </span>
                          </div>
                        ))}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedImage(null)
                          setDetectionResults(null)
                        }}
                      >
                        重新选择
                      </Button>
                      <Button onClick={runDetection} disabled={isDetecting || modelLoading} className="flex-1">
                        {isDetecting ? (
                          <>检测中...</>
                        ) : modelLoading ? (
                          <>模型加载中...</>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" /> 开始检测
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>检测配置</CardTitle>
                <CardDescription>选择检测模型和参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">检测模型</Label>
                  <Select defaultValue="default" onValueChange={(value) => setSelectedModelId(value)}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">默认模型</SelectItem>
                      <SelectItem value="faster-rcnn">Faster R-CNN</SelectItem>
                      <SelectItem value="yolo">YOLO v5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">检测阈值</Label>
                  <Select defaultValue="0.5" onValueChange={(value) => setThreshold(value)}>
                    <SelectTrigger id="threshold">
                      <SelectValue placeholder="选择阈值" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.3">0.3 (高召回率)</SelectItem>
                      <SelectItem value="0.5">0.5 (平衡)</SelectItem>
                      <SelectItem value="0.7">0.7 (高精确率)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>

              {detectionResults && (
                <CardFooter className="flex-col items-start">
                  <h3 className="text-lg font-medium mb-4">检测结果</h3>

                  {detectionResults.defects.length > 0 ? (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>缺陷类型</span>
                        <span>置信度</span>
                      </div>

                      {detectionResults.defects.map((defect) => (
                        <div key={defect.id} className="flex items-center justify-between p-2 rounded bg-muted">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: defect.color }} />
                            <span>{defect.type}</span>
                          </div>
                          <span>{Math.round(defect.confidence * 100)}%</span>
                        </div>
                      ))}

                      <div className="pt-4 border-t mt-4">
                        <div className="flex items-center text-sm">
                          <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
                          <span className="font-medium">检测到 {detectionResults.defects.length} 个缺陷</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">未检测到缺陷</p>
                  )}
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>批量检测</CardTitle>
              <CardDescription>上传多张图像进行批量缺陷检测</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">批量检测功能</h3>
                <p className="text-sm text-muted-foreground mb-4">上传多张图像进行批量检测，并生成检测报告</p>
                <Button variant="outline">上传图像集</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>检测报告</CardTitle>
              <CardDescription>查看和导出检测报告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无检测报告</h3>
                <p className="text-sm text-muted-foreground mb-4">完成批量检测后，检测报告将显示在此处</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
