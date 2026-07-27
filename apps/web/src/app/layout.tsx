import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: '优品商城 - 品质生活从这里开始',
  description: '优品商城，正品保障，极速物流，无忧售后',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] py-10 text-center text-sm text-[var(--color-muted)]">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-4 flex items-center justify-center gap-8 text-xs tracking-wide">
                <span>正品保障</span>
                <span className="h-3 w-px bg-[var(--color-border)]" />
                <span>极速物流</span>
                <span className="h-3 w-px bg-[var(--color-border)]" />
                <span>无忧售后</span>
              </div>
              <p>&copy; 2025 优品商城 版权所有 | 模拟电商平台</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
