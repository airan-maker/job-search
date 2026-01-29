import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Recruiter Agent - 채용의 모든 과정을 AI가 도와드립니다',
  description: 'HR/채용 담당자를 위한 AI 채용 어시스턴트',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👔</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recruiter Agent
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  채용의 모든 과정을 AI가 도와드립니다
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
