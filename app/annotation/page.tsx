"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tag, Save, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

// 模拟数据
const mockImages = [
  { id: 1, name: "product_001.jpg", url: "/placeholder.svg?height=600&width=800" },
  { id: 2, name: "product_002.jpg", url: "/placeholder.svg?height=600&width=800" },
  { id: 3, name: "product_003.jpg", url: "/placeholder.svg?height=600&width=800" },
]

const defectTypes = [
  { id: 1, name: "划痕", color: "#ef4444" },
  { id: 2, name: "凹陷", color: "#f97316" },
  { id: 3, name: "污渍", color: "#eab308" },
  { id: 4, name: "缺失", color: "#84cc16" },
  { id: 5, name: "变形", color: "#06b6d4" },
]

export default function AnnotationPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedDefect, setSelectedDefect] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 })

  const currentImage = mockImages[currentImageIndex]

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < mockImages.length - 1 ? prev + 1 : prev))
  }

  const handleCanvasMouseDown = (e) => {
    if (!selectedDefect) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setStartPoint({ x, y })
    setEndPoint({ x, y })
    setIsDrawing(true)
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setEndPoint({ x, y })
  }

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !selectedDefect) return

    const newAnnotation = {
      id: Date.now(),
      defectType: selectedDefect,
      x: Math.min(startPoint.x, endPoint.x),
      y: Math.min(startPoint.y, endPoint.y),
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y),
    }

    setAnnotations([...annotations, newAnnotation])
    setIsDrawing(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">数据标注</h1>

      <Tabs defaultValue="annotation" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="annotation">图像标注</TabsTrigger>
          <TabsTrigger value="review">标注审核</TabsTrigger>
        </TabsList>

        <TabsContent value="annotation" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3">
              <CardContent className="p-6">
                <div className="relative w-full" style={{ height: "600px" }}>
                  <div
                    className="relative w-full h-full border rounded-md overflow-hidden bg-muted"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={() => isDrawing && setIsDrawing(false)}
                  >
                    <Image
                      src={currentImage.url || "/placeholder.svg"}
                      alt={currentImage.name}
                      fill
                      className="object-contain"
                    />

                    {/* 已保存的标注 */}
                    {annotations.map((anno) => (
                      <div
                        key={anno.id}
                        className="absolute border-2 bg-opacity-20"
                        style={{
                          left: `${anno.x}px`,
                          top: `${anno.y}px`,
                          width: `${anno.width}px`,
                          height: `${anno.height}px`,
                          borderColor: anno.defectType.color,
                          backgroundColor: anno.defectType.color,
                        }}
                      >
                        <span
                          className="absolute top-0 left-0 text-xs px-1 text-white"
                          style={{ backgroundColor: anno.defectType.color }}
                        >
                          {anno.defectType.name}
                        </span>
                      </div>
                    ))}

                    {/* 当前正在绘制的标注 */}
                    {isDrawing && selectedDefect && (
                      <div
                        className="absolute border-2 bg-opacity-20"
                        style={{
                          left: `${Math.min(startPoint.x, endPoint.x)}px`,
                          top: `${Math.min(startPoint.y, endPoint.y)}px`,
                          width: `${Math.abs(endPoint.x - startPoint.x)}px`,
                          height: `${Math.abs(endPoint.y - startPoint.y)}px`,
                          borderColor: selectedDefect.color,
                          backgroundColor: selectedDefect.color,
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" onClick={handlePrevImage} disabled={currentImageIndex === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> 上一张
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentImageIndex + 1} / {mockImages.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextImage}
                    disabled={currentImageIndex === mockImages.length - 1}
                  >
                    下一张 <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">标注工具</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">缺陷类型</label>
                      <Select
                        onValueChange={(value) => {
                          const defect = defectTypes.find((d) => d.id.toString() === value)
                          setSelectedDefect(defect)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择缺陷类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {defectTypes.map((defect) => (
                            <SelectItem key={defect.id} value={defect.id.toString()}>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: defect.color }} />
                                {defect.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full" disabled={!selectedDefect}>
                      <Tag className="mr-2 h-4 w-4" /> 开始标注
                    </Button>

                    <Button variant="outline" className="w-full" onClick={() => setAnnotations([])}>
                      清除所有标注
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">标注列表</h3>

                  {annotations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">暂无标注数据</p>
                  ) : (
                    <div className="space-y-2">
                      {annotations.map((anno, index) => (
                        <div
                          key={anno.id}
                          className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted"
                        >
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: anno.defectType.color }}
                            />
                            <span>
                              {anno.defectType.name} #{index + 1}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setAnnotations(annotations.filter((a) => a.id !== anno.id))
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button className="w-full mt-4" disabled={annotations.length === 0}>
                    <Save className="mr-2 h-4 w-4" /> 保存标注
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">标注审核</h3>
              <p className="text-center py-12 text-muted-foreground">暂无已完成的标注数据需要审核</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
