"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, ImageIcon, FolderOpen } from "lucide-react"
import Image from "next/image"

export default function DatasetPage() {
  const [images, setImages] = useState([])
  const [activeTab, setActiveTab] = useState("upload")

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        uploaded: new Date().toISOString(),
      }))
      setImages([...images, ...newImages])
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">数据集管理</h1>

      <Tabs defaultValue="upload" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">上传图像</TabsTrigger>
          <TabsTrigger value="manage">管理数据集</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition-colors">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">上传工业相机图像</h3>
                <p className="text-sm text-muted-foreground mb-4">拖放文件到此处或点击下方按钮选择文件</p>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="mr-2">
                    <FolderOpen className="mr-2 h-4 w-4" /> 选择文件
                  </Button>
                </Label>
                <Button>
                  <Upload className="mr-2 h-4 w-4" /> 开始上传
                </Button>
              </div>
            </CardContent>
          </Card>

          {images.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">已选择的图像 ({images.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.name}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <p className="text-xs truncate mt-1">{image.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">数据集列表</h3>
                {images.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium mb-2">暂无数据</h4>
                    <p className="text-sm text-muted-foreground mb-4">请先上传图像或创建数据集</p>
                    <Button variant="outline" onClick={() => setActiveTab("upload")}>
                      上传图像
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <ImageIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">工业相机图像集</h4>
                            <p className="text-sm text-muted-foreground">{images.length} 张图像</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
