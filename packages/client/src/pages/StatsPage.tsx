import { useState } from 'react';
import { useSummary, useMonthly } from '../hooks/useStats.js';
import { useCategories } from '../hooks/useCategories.js';
import { useTags } from '../hooks/useTags.js';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';
import UserSelector from '../components/UserSelector.js';

export default function StatsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagId, setTagId] = useState('');
  const [mode, setMode] = useState<'spending' | 'income'>('spending');

  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: summary, isLoading: summaryLoading } = useSummary(dateFrom || undefined, dateTo || undefined, mode);
  const { data: monthly = [] } = useMonthly({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    categoryId: categoryId || undefined,
    tagId: tagId || undefined,
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Statistics</h2>

      <UserSelector />

      {/* Mode toggle + Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setMode('spending')}
            className={`px-4 py-2 text-sm font-medium ${
              mode === 'spending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Spending
          </button>
          <button
            onClick={() => setMode('income')}
            className={`px-4 py-2 text-sm font-medium ${
              mode === 'income' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Income
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={tagId} onChange={(e) => setTagId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Tags</option>
          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {summaryLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : !summary ? (
        <div className="text-center text-gray-400 py-12">No data available</div>
      ) : (
        <div className="space-y-6">
          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold">${summary.total_spent.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Total Credits</p>
              <p className="text-xl font-bold text-green-600">${summary.total_credits.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Net</p>
              <p className="text-xl font-bold">${summary.net.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-xl font-bold">{summary.transaction_count}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown donut */}
            {summary.by_category.length > 0 && (
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold mb-4">{mode === 'income' ? 'Income by Category' : 'Spending by Category'}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={summary.by_category} dataKey="total" nameKey="category_name" cx="50%" cy="50%" outerRadius={100} innerRadius={55}>
                      {summary.by_category.map((entry, i) => (
                        <Cell key={i} fill={entry.category_color || '#9E9E9E'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {summary.by_category.map((cat) => (
                    <div key={cat.category_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category_color || '#9E9E9E' }} />
                        <span className="text-gray-700">{cat.category_name || 'Uncategorized'}</span>
                      </div>
                      <span className="font-mono text-gray-900">${cat.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tag breakdown bar chart */}
            {summary.by_tag.length > 0 && (
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold mb-4">By Tag (Person)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={summary.by_tag} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="tag_name" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {summary.by_tag.map((entry, i) => (
                        <Cell key={i} fill={entry.tag_color || '#9E9E9E'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {summary.by_tag.map((tag) => (
                    <div key={tag.tag_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.tag_color || '#9E9E9E' }} />
                        <span className="text-gray-700">{tag.tag_name || 'Untagged'}</span>
                      </div>
                      <span className="font-mono text-gray-900">${tag.total.toFixed(2)} ({tag.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Monthly trend */}
          {monthly.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="total_spent" stroke="#EF4444" strokeWidth={2} name="Spent" />
                  <Line type="monotone" dataKey="total_credits" stroke="#22C55E" strokeWidth={2} name="Credits" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
