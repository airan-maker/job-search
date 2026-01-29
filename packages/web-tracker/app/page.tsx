'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  recentApplications: number;
}

const statusColors: Record<string, string> = {
  '관심': 'bg-gray-100 text-gray-800',
  '지원예정': 'bg-yellow-100 text-yellow-800',
  '지원완료': 'bg-blue-100 text-blue-800',
  '서류통과': 'bg-indigo-100 text-indigo-800',
  '면접예정': 'bg-purple-100 text-purple-800',
  '면접완료': 'bg-pink-100 text-pink-800',
  '최종합격': 'bg-green-100 text-green-800',
  '불합격': 'bg-red-100 text-red-800',
  '포기': 'bg-gray-100 text-gray-500',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('통계를 불러오는데 실패했습니다. Google Sheets 설정을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-gray-500 mt-2">
          .env.local 파일에 Google Sheets API 인증 정보가 설정되어 있는지 확인하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          대시보드
        </h2>
        <Link
          href="/positions/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + 포지션 추가
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">전체 포지션</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {stats?.total || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">최근 7일 지원</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">
            {stats?.recentApplications || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">진행중</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {(stats?.byStatus?.['지원완료'] || 0) +
              (stats?.byStatus?.['서류통과'] || 0) +
              (stats?.byStatus?.['면접예정'] || 0) +
              (stats?.byStatus?.['면접완료'] || 0)}
          </div>
        </div>
      </div>

      {/* 상태별 현황 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          상태별 현황
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
            <div
              key={status}
              className={`rounded-lg p-3 ${statusColors[status] || 'bg-gray-100'}`}
            >
              <div className="text-sm font-medium">{status}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          ))}
        </div>
        {Object.keys(stats?.byStatus || {}).length === 0 && (
          <p className="text-gray-500 text-center py-4">
            아직 등록된 포지션이 없습니다.
          </p>
        )}
      </div>

      {/* 빠른 액션 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          빠른 시작
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/positions"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">포지션 목록</div>
              <div className="text-sm text-gray-500">모든 포지션 확인 및 관리</div>
            </div>
          </Link>
          <Link
            href="/positions/new"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">포지션 추가</div>
              <div className="text-sm text-gray-500">새로운 채용 공고 등록</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
