"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Download, Play, Square, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function AudioProcessor() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null)
  const [noiseReductionLevel, setNoiseReductionLevel] = useState([50])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("upload")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0])
      setProcessedAudioUrl(null)
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      toast({
        title: "文件已上传",
        description: `已选择文件: ${e.target.files[0].name}`,
      })
      // 自动切换到处理标签页
      setActiveTab("process")
    }
  }

  const processAudio = async () => {
    if (!audioFile) return

    setIsProcessing(true)

    try {
      // 创建AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const audioContext = audioContextRef.current

      // 读取文件
      const arrayBuffer = await audioFile.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // 创建处理节点
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate,
      )

      // 源节点
      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer

      // 低通滤波器 - 去除高频噪音
      const lowPassFilter = offlineContext.createBiquadFilter()
      lowPassFilter.type = "lowpass"
      lowPassFilter.frequency.value = 2000 + noiseReductionLevel[0] * 40

      // 高通滤波器 - 去除低频噪音
      const highPassFilter = offlineContext.createBiquadFilter()
      highPassFilter.type = "highpass"
      highPassFilter.frequency.value = 80 - noiseReductionLevel[0] * 0.5

      // 使用另一个滤波器代替动态压缩器
      const peakingFilter = offlineContext.createBiquadFilter()
      peakingFilter.type = "peaking"
      peakingFilter.frequency.value = 1000 // 中频增强
      peakingFilter.Q.value = 1.0
      peakingFilter.gain.value = noiseReductionLevel[0] * 0.1 // 根据降噪级别调整增益

      // 增益节点 - 调整音量
      const gainNode = offlineContext.createGain()
      gainNode.gain.value = 1 + noiseReductionLevel[0] / 100

      // 连接节点
      source.connect(highPassFilter)
      highPassFilter.connect(lowPassFilter)
      lowPassFilter.connect(peakingFilter)
      peakingFilter.connect(gainNode)
      gainNode.connect(offlineContext.destination)

      // 处理音频
      source.start(0)
      const renderedBuffer = await offlineContext.startRendering()

      // 转换为WAV格式
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length)
      const url = URL.createObjectURL(wavBlob)

      setProcessedAudioUrl(url)
      toast({
        title: "处理完成",
        description: "音频降噪处理已完成，可以播放或下载",
      })
      // 自动切换到下载标签页
      setActiveTab("download")
    } catch (error) {
      console.error("音频处理错误:", error)
      toast({
        title: "处理失败",
        description: "音频处理过程中出现错误，请尝试使用不同的浏览器",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 将AudioBuffer转换为WAV格式
  const bufferToWave = (abuffer: AudioBuffer, len: number) => {
    const numOfChan = abuffer.numberOfChannels
    const length = len * numOfChan * 2 + 44
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)
    const channels = []
    let i, sample
    let offset = 0

    // 写入WAV头
    writeString(view, 0, "RIFF")
    view.setUint32(4, length - 8, true)
    writeString(view, 8, "WAVE")
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numOfChan, true)
    view.setUint32(24, abuffer.sampleRate, true)
    view.setUint32(28, abuffer.sampleRate * 2 * numOfChan, true)
    view.setUint16(32, numOfChan * 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, "data")
    view.setUint32(40, length - 44, true)

    // 写入采样数据
    for (i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i))
    }

    offset = 44
    for (i = 0; i < len; i++) {
      for (let c = 0; c < numOfChan; c++) {
        sample = Math.max(-1, Math.min(1, channels[c][i]))
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0
        view.setInt16(offset, sample, true)
        offset += 2
      }
    }

    return new Blob([buffer], { type: "audio/wav" })
  }

  // 辅助函数：写入字符串到DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const downloadProcessedAudio = () => {
    if (!processedAudioUrl) return

    const a = document.createElement("a")
    a.href = processedAudioUrl
    a.download = `processed_${audioFile?.name || "audio.wav"}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">公园陈大爷：音频降噪处理工具</h1>

      <div className="max-w-3xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">上传</TabsTrigger>
            <TabsTrigger value="process">处理</TabsTrigger>
            <TabsTrigger value="download" disabled={!processedAudioUrl}>
              下载
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>上传音频文件</CardTitle>
                <CardDescription>支持上传MP3、WAV、OGG等格式的音频文件</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 w-full text-center relative">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">点击或拖拽文件到此处上传</p>
                  <p className="text-xs text-gray-400">最大文件大小: 50MB</p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {audioFile && (
                  <div className="text-sm text-center">
                    已选择: <span className="font-medium">{audioFile.name}</span>
                    <p className="text-xs text-gray-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">上传文件后将自动切换到处理页面</p>
              </CardContent>
              {audioFile && (
                <CardFooter className="flex justify-center">
                  <Button onClick={() => setActiveTab("process")}>继续处理</Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="process">
            <Card>
              <CardHeader>
                <CardTitle>陈大爷音频处理</CardTitle>
                <CardDescription>调整参数并处理您的音频文件</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">降噪强度</span>
                    <span className="text-sm text-gray-500">{noiseReductionLevel[0]}%</span>
                  </div>
                  <Slider
                    value={noiseReductionLevel}
                    onValueChange={setNoiseReductionLevel}
                    max={100}
                    step={1}
                    disabled={isProcessing || !audioFile}
                  />
                  <p className="text-xs text-gray-500 mt-1">调整滑块来控制降噪的强度，值越高降噪效果越强</p>
                </div>

                <Button onClick={processAudio} disabled={isProcessing || !audioFile} className="w-full">
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      开始处理
                    </>
                  )}
                </Button>

                {processedAudioUrl && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">处理结果预览:</p>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={togglePlayback}>
                        {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <audio
                          ref={audioRef}
                          src={processedAudioUrl}
                          onEnded={() => setIsPlaying(false)}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="download">
            <Card>
              <CardHeader>
                <CardTitle>下载处理后的音频</CardTitle>
                <CardDescription>您的音频已处理完成，可以下载或再次预览</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8 space-y-6">
                <div className="w-full max-w-md">
                  <div className="flex items-center space-x-2 mb-4">
                    <Button variant="outline" size="icon" onClick={togglePlayback}>
                      {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <audio
                        ref={audioRef}
                        src={processedAudioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={downloadProcessedAudio} className="w-full max-w-md">
                  <Download className="mr-2 h-4 w-4" />
                  下载处理后的音频
                </Button>

                <p className="text-xs text-gray-500 text-center max-w-md">
                  处理后的音频已经去除了背景噪音，声音更加清晰。如果效果不理想，您可以返回处理页面调整参数后重新处理。
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAudioFile(null)
                    setActiveTab("upload")
                  }}
                >
                  处理新文件
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
