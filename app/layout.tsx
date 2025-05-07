import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Toaster } from "@/components/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "工业产品检测系统",
  description: "基于机器学习的工业相机图像产品缺陷检测平台",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center">
                <Link href="/" className="flex items-center font-bold mr-6">
                  工业产品检测系统
                </Link>
                <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
                  <Link href="/dataset" className="text-sm font-medium transition-colors hover:text-primary">
                    数据集
                  </Link>
                  <Link href="/annotation" className="text-sm font-medium transition-colors hover:text-primary">
                    标注
                  </Link>
                  <Link href="/training" className="text-sm font-medium transition-colors hover:text-primary">
                    训练
                  </Link>
                  <Link href="/detection" className="text-sm font-medium transition-colors hover:text-primary">
                    检测
                  </Link>
                </nav>
                <div className="ml-auto flex items-center space-x-4">
                  <ModeToggle />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
