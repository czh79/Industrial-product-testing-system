"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { BarChart3, Play, PauseCircle, RotateCcw, Save, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function TrainingPage() {
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingTaskId, setTrainingTaskId] = useState(null)
  const [trainingMetrics, setTrainingMetrics] = useState(null)
  const [remainingTime, setRemainingTime] = useState("计算中...")
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const [totalEpochs, setTotalEpochs] = useState(50)

  // 训练参数
  const [datasetId, setDatasetId] = useState("industrial")
  const [splitRatio, setSplitRatio] = useState([80])
  const [augmentation, setAugmentation] = useState(false)
  const [modelType, setModelType] = useState("faster-rcnn")
  const [batchSize, setBatchSize] = useState("16")
  const [epochs, setEpochs] = useState("50")
  const [learningRate, setLearningRate] = useState("0.001")

  const { toast } = useToast()

  // 轮询训练状态
  useEffect(() => {
    let intervalId

    if (isTraining && trainingTaskId) {
      intervalId = setInterval(async () => {
        try {
          // 在实际应用中，这里应该调用API获取训练状态
          // const response = await fetch(`/api/train/status?taskId=${trainingTaskId}`);
          // const data = await response.json();

          // 模拟训练进度更新
          setTrainingProgress((prev) => {
            if (prev >= 100) {
              clearInterval(intervalId)
              setIsTraining(false)
              return 100
            }
            return prev + 1
          })

          setCurrentEpoch((prev) => {
            const newEpoch = Math.floor((trainingProgress / 100) * totalEpochs)
            return newEpoch > prev ? newEpoch : prev
          })

          // 更新剩余时间
          const remainingPercentage = 100 - trainingProgress
          const estimatedMinutes = Math.ceil(remainingPercentage * 0.5) // 假设每1%进度需要0.5分钟
          setRemainingTime(`${estimatedMinutes}分钟`)

          // 更新训练指标
          if (trainingProgress % 10 === 0) {
            setTrainingMetrics({
              loss: (1 - trainingProgress / 100).toFixed(4),
              accuracy: (0.5 + trainingProgress / 200).toFixed(4),
              precision: (0.6 + trainingProgress / 250).toFixed(4),
              recall: (0.55 + trainingProgress / 220).toFixed(4),
            })
          }
        } catch (error) {
          console.error("获取训练状态失败:", error)
        }
      }, 300)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isTraining, trainingTaskId, trainingProgress, totalEpochs])

  const startTraining = async () => {
    try {
      setIsTraining(true)
      setTrainingProgress(0)
      setCurrentEpoch(0)
      setTotalEpochs(Number.parseInt(epochs))

      // 准备训练参数
      const trainingParams = {
        datasetId,
        modelType,
        batchSize: Number.parseInt(batchSize),
        epochs: Number.parseInt(epochs),
        learningRate: Number.parseFloat(learningRate),
        splitRatio: splitRatio[0] / 100,
        augmentation,
      }

      // 调用训练API
      try {
        const response = await fetch("/api/train", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(trainingParams),
        })

        if (!response.ok) {
          throw new Error("训练请求失败")
        }

        const result = await response.json()

        if (result.success) {
          setTrainingTaskId(result.taskId)
          toast({
            title: "训练任务已提交",
            description: "您可以在训练进度页面查看详情",
          })
        } else {
          throw new Error(result.message || "提交训练任务失败")
        }
      } catch (error) {
        console.error("训练请求失败:", error)
        // 使用模拟训练作为后备
        setTrainingTaskId(`task-${Date.now()}`)
        toast({
          title: "使用模拟训练模式",
          description: "无法连接到训练服务器，使用模拟训练进行演示",
        })
      }
    } catch (error) {
      console.error("启动训练失败:", error)
      setIsTraining(false)
      toast({
        title: "启动训练失败",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const stopTraining = async () => {
    try {
      // 在实际应用中，这里应该调用API停止训练
      // await fetch(`/api/train/stop?taskId=${trainingTaskId}`, { method: 'POST' });

      setIsTraining(false)
      toast({
        title: "训练已停止",
        description: "训练任务已成功停止",
      })
    } catch (error) {
      console.error("停止训练失败:", error)
      toast({
        title: "停止训练失败",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">模型训练</h1>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">训练配置</TabsTrigger>
          <TabsTrigger value="progress">训练进度</TabsTrigger>
          <TabsTrigger value="models">模型管理</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>数据集配置</CardTitle>
                <CardDescription>选择用于训练的数据集和参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dataset">选择数据集</Label>
                  <Select defaultValue={datasetId} onValueChange={setDatasetId}>
                    <SelectTrigger id="dataset">
                      <SelectValue placeholder="选择数据集" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="industrial">工业相机图像集</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="split-ratio">训练/验证数据分割比例</Label>
                  <div className="flex items-center space-x-2">
                    <Slider defaultValue={splitRatio} max={95} min={50} step={5} onValueChange={setSplitRatio} />
                    <span className="w-12 text-center">{splitRatio}%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="augmentation" checked={augmentation} onCheckedChange={setAugmentation} />
                  <Label htmlFor="augmentation">启用数据增强</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>模型配置</CardTitle>
                <CardDescription>选择模型类型和训练参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-type">模型类型</Label>
                  <Select defaultValue={modelType} onValueChange={setModelType}>
                    <SelectTrigger id="model-type">
                      <SelectValue placeholder="选择模型类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faster-rcnn">Faster R-CNN</SelectItem>
                      <SelectItem value="yolo">YOLO v5</SelectItem>
                      <SelectItem value="ssd">SSD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-size">批次大小</Label>
                  <Select defaultValue={batchSize} onValueChange={setBatchSize}>
                    <SelectTrigger id="batch-size">
                      <SelectValue placeholder="选择批次大小" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                      <SelectItem value="64">64</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="epochs">训练轮次</Label>
                  <Input id="epochs" type="number" value={epochs} onChange={(e) => setEpochs(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learning-rate">学习率</Label>
                  <Select defaultValue={learningRate} onValueChange={setLearningRate}>
                    <SelectTrigger id="learning-rate">
                      <SelectValue placeholder="选择学习率" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.01">0.01</SelectItem>
                      <SelectItem value="0.001">0.001</SelectItem>
                      <SelectItem value="0.0001">0.0001</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={startTraining} disabled={isTraining}>
                  <Play className="mr-2 h-4 w-4" /> 开始训练
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>训练进度</CardTitle>
              <CardDescription>查看当前训练任务的进度和指标</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isTraining ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">训练进度</span>
                      <span className="text-sm text-muted-foreground">{trainingProgress}%</span>
                    </div>
                    <Progress value={trainingProgress} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">当前轮次</p>
                            <p className="text-2xl font-bold">
                              {currentEpoch}/{totalEpochs}
                            </p>
                          </div>
                          <RotateCcw className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">预计剩余时间</p>
                            <p className="text-2xl font-bold">{remainingTime}</p>
                          </div>
                          <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">训练指标</h3>
                    <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">损失值</p>
                        <p className="text-muted-foreground">{trainingMetrics?.loss || "0.0000"}</p>
                      </div>
                      <div>
                        <p className="font-medium">准确率</p>
                        <p className="text-muted-foreground">
                          {trainingMetrics
                            ? `${(Number.parseFloat(trainingMetrics.accuracy) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">精确率</p>
                        <p className="text-muted-foreground">
                          {trainingMetrics
                            ? `${(Number.parseFloat(trainingMetrics.precision) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">召回率</p>
                        <p className="text-muted-foreground">
                          {trainingMetrics
                            ? `${(Number.parseFloat(trainingMetrics.recall) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button variant="destructive" className="w-full" onClick={stopTraining}>
                    <PauseCircle className="mr-2 h-4 w-4" /> 停止训练
                  </Button>
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无训练任务</h3>
                  <p className="text-sm text-muted-foreground mb-4">请在训练配置页面设置参数并开始训练</p>
                  <Button variant="outline" onClick={() => document.querySelector('[value="config"]').click()}>
                    前往训练配置
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>模型管理</CardTitle>
              <CardDescription>管理已训练的模型</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Save className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无已保存的模型</h3>
                <p className="text-sm text-muted-foreground mb-4">完成模型训练后，训练好的模型将显示在此处</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
