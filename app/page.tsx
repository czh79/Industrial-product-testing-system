import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Database, ImageIcon, BarChart3, Search } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">工业产品检测系统</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          基于机器学习的工业相机图像产品缺陷检测平台，支持数据集管理、模型训练和实时检测
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <ImageIcon className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>数据管理</CardTitle>
            <CardDescription>上传和管理工业相机拍摄的产品图像</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">支持批量上传图像，自动分类和标记，方便数据集的构建和管理。</p>
          </CardContent>
          <CardFooter>
            <Link href="/dataset" className="w-full">
              <Button variant="outline" className="w-full">
                进入数据管理 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Database className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>数据标注</CardTitle>
            <CardDescription>为产品图像添加缺陷标注和分类</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              提供直观的标注工具，支持矩形、多边形等多种标注方式，快速构建训练数据集。
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/annotation" className="w-full">
              <Button variant="outline" className="w-full">
                进入数据标注 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>模型训练</CardTitle>
            <CardDescription>训练和管理产品缺陷检测模型</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              基于标注数据集训练深度学习模型，支持多种模型架构，自动调优参数。
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/training" className="w-full">
              <Button variant="outline" className="w-full">
                进入模型训练 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Search className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>缺陷检测</CardTitle>
            <CardDescription>使用训练好的模型进行产品缺陷检测</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              实时检测产品缺陷，可视化展示检测结果，支持批量处理和报告生成。
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/detection" className="w-full">
              <Button variant="outline" className="w-full">
                进入缺陷检测 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
