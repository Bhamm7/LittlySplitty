import { useSummary, useRecentImports, useMonthly } from '../hooks/useStats.js';
import { Link } from 'react-router-dom';
import { Upload, ArrowRight, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import UserSelector from '../components/UserSelector.js';

export default function HomePage() {
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: recentImports = [] } = useRecentImports(5);
  const { data: monthly = [] } = useMonthly();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Link to="/import" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Upload className="w-4 h-4" /> Import Statement
        </Link>
      </div>

      <UserSelector />

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="text-gray-400 text-center py-12">Loading...</div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-50 rounded-lg"><TrendingDown className="w-5 h-5 text-red-500" /></div>
                <span className="text-sm text-gray-500">Total Spent</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${summary.total_spent.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">{summary.transaction_count} transactions</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-5 h-5 text-green-500" /></div>
                <span className="text-sm text-gray-500">Total Credits</span>
              </div>
              <p className="text-2xl font-bold text-green-600">${summary.total_credits.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg"><DollarSign className="w-5 h-5 text-blue-500" /></div>
                <span className="text-sm text-gray-500">Net Spending</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${summary.net.toFixed(2)}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Category Donut */}
            {summary.by_category.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold mb-4">Spending by Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={summary.by_category}
                      dataKey="total"
                      nameKey="category_name"
                      cx="50%" cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                    >
                      {summary.by_category.map((entry, i) => (
                        <Cell key={i} fill={entry.category_color || '#9E9E9E'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {summary.by_category.map((cat) => (
                    <div key={cat.category_id} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.category_color || '#9E9E9E' }} />
                      {cat.category_name || 'Uncategorized'}: ${cat.total.toFixed(0)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly bar chart */}
            {monthly.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold mb-4">Monthly Spending</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="total_spent" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-8">
          <p className="text-gray-500 mb-4">No transaction data yet. Import a bank statement to get started.</p>
          <Link to="/import" className="text-blue-600 hover:text-blue-700 font-medium">Go to Import</Link>
        </div>
      )}

      {/* Recent Imports */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold">Recent Imports</h3>
          <Link to="/import" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Import <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentImports.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">No imports yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentImports.map((imp) => (
              <div key={imp.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{imp.original_filename}</p>
                  <p className="text-xs text-gray-500">{imp.bank_source_name} | {imp.transaction_count} transactions</p>
                </div>
                <span className="text-xs text-gray-400">{dayjs(imp.created_at).format('MMM D, YYYY')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
