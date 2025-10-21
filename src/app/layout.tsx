import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner';
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Learnify App',
  description: 'A modern learning platform with live streaming capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark bg-[#141517]">
        <body className={inter.className} suppressHydrationWarning={true}>
          <Toaster theme="dark" position="bottom-center" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
