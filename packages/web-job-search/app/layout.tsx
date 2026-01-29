import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Search Agent - 내 정보는 비공개, 채용 공고는 AI가 찾아준다',
  description: '프라이버시를 지키면서 이직을 준비할 수 있는 AI 에이전트',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Job Search Agent
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  내 정보는 비공개, 채용 공고는 AI가 찾아준다
                </p>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
