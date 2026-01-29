'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Position {
  id: string;
  company: string;
  title: string;
  url: string;
  status: string;
  salary: string;
  location: string;
  notes: string;
  appliedDate: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  '관심': 'bg-gray-100 text-gray-800 border-gray-300',
  '지원예정': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '지원완료': 'bg-blue-100 text-blue-800 border-blue-300',
  '서류통과': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  '면접예정': 'bg-purple-100 text-purple-800 border-purple-300',
  '면접완료': 'bg-pink-100 text-pink-800 border-pink-300',
  '최종합격': 'bg-green-100 text-green-800 border-green-300',
  '불합격': 'bg-red-100 text-red-800 border-red-300',
  '포기': 'bg-gray-100 text-gray-500 border-gray-300',
};

const allStatuses = ['관심', '지원예정', '지원완료', '서류통과', '면접예정', '면접완료', '최종합격', '불합격', '포기'];

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>('');

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPositions(data.positions);
    } catch (err) {
      setError('포지션을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setPositions(positions.map(p =>
        p.id === id ? { ...p, status: newStatus } : p
      ));
      setEditingId(null);
    } catch (err) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/positions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setPositions(positions.filter(p => p.id !== id));
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  const filteredPositions = filter === 'all'
    ? positions
    : positions.filter(p => p.status === filter);

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          포지션 목록
        </h2>
        <Link
          href="/positions/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + 포지션 추가
        </Link>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체 ({positions.length})
        </button>
        {allStatuses.map(status => {
          const count = positions.filter(p => p.status === status).length;
          if (count === 0) return null;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-gray-900 text-white'
                  : `${statusColors[status]} hover:opacity-80`
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* 포지션 목록 */}
      <div className="space-y-3">
        {filteredPositions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500">등록된 포지션이 없습니다.</p>
            <Link
              href="/positions/new"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              첫 포지션을 추가해보세요
            </Link>
          </div>
        ) : (
          filteredPositions.map(position => (
            <div
              key={position.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {position.company}
                    </h3>
                    {editingId === position.id ? (
                      <select
                        value={editingStatus}
                        onChange={(e) => setEditingStatus(e.target.value)}
                        onBlur={() => {
                          if (editingStatus !== position.status) {
                            handleStatusChange(position.id, editingStatus);
                          } else {
                            setEditingId(null);
                          }
                        }}
                        className="text-xs px-2 py-1 rounded border"
                        autoFocus
                      >
                        {allStatuses.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(position.id);
                          setEditingStatus(position.status);
                        }}
                        className={`text-xs px-2 py-1 rounded-full border ${statusColors[position.status]}`}
                      >
                        {position.status}
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{position.title}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                    {position.location && (
                      <span>📍 {position.location}</span>
                    )}
                    {position.salary && (
                      <span>💰 {position.salary}</span>
                    )}
                    {position.appliedDate && (
                      <span>📅 {position.appliedDate}</span>
                    )}
                  </div>
                  {position.notes && (
                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {position.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {position.url && (
                    <a
                      href={position.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 p-2"
                      title="공고 보기"
                    >
                      🔗
                    </a>
                  )}
                  <Link
                    href={`/positions/${position.id}/edit`}
                    className="text-gray-500 hover:text-gray-700 p-2"
                    title="수정"
                  >
                    ✏️
                  </Link>
                  <button
                    onClick={() => handleDelete(position.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
