import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Tracker - 지원 현황 관리',
  description: 'Google Sheets 기반 채용 지원 현황 관리 서비스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Job Tracker
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    채용 지원 현황을 한눈에
                  </p>
                </div>
              </div>
              <nav className="flex gap-4">
                <a href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  대시보드
                </a>
                <a href="/positions" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  포지션 목록
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
