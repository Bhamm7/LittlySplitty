import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import UserSelector from '../components/UserSelector.js';
import { useTaxReport } from '../hooks/useTax.js';
import { useTransactions } from '../hooks/useTransactions.js';
import type { TaxReportCategory } from '@littysplitty/shared';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i);

// Sub-component that lazily loads transactions for a single expanded category
function CategoryTransactions({ categoryId, year }: { categoryId: string; year: number }) {
  const dateFrom = `${year}-01-01`;
  const dateTo = `${year}-12-31`;
  const { data, isLoading } = useTransactions({
    category_id: categoryId,
    date_from: dateFrom,
    date_to: dateTo,
    limit: 500,
    sort_by: 'transaction_date',
    sort_dir: 'asc',
    is_ignored: false,
  });

  if (isLoading) return <div className="px-6 py-3 text-sm text-gray-400">Loading...</div>;
  if (!data || data.data.length === 0) return <div className="px-6 py-3 text-sm text-gray-400">No transactions</div>;

  return (
    <div className="border-t border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-400 text-xs">
            <th className="px-6 py-2 font-medium">Date</th>
            <th className="px-6 py-2 font-medium">Description</th>
            <th className="px-6 py-2 font-medium text-right">Amount</th>
            <th className="px-6 py-2 font-medium">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.data.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50">
              <td className="px-6 py-2 text-gray-500 whitespace-nowrap">
                {dayjs(tx.transaction_date).format('MMM D, YYYY')}
              </td>
              <td className="px-6 py-2 text-gray-700">{tx.description}</td>
              <td className={`px-6 py-2 text-right font-mono font-medium ${tx.is_credit ? 'text-green-600' : 'text-gray-900'}`}>
                {tx.is_credit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
              </td>
              <td className="px-6 py-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  tx.is_credit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {tx.is_credit ? 'Income' : 'Expense'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryRow({
  cat,
  year,
  type,
}: {
  cat: TaxReportCategory;
  year: number;
  type: 'income' | 'expense';
}) {
  const [expanded, setExpanded] = useState(false);
  const amount = type === 'income' ? cat.total_income : cat.total_expenses;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-left transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: cat.category_color || '#9E9E9E' }}
        />
        <span className="flex-1 text-sm font-medium text-gray-900">{cat.category_name}</span>
        <span className="text-xs text-gray-400 mr-4">{cat.count} transactions</span>
        <span className={`text-sm font-mono font-semibold ${type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
          ${amount.toFixed(2)}
        </span>
      </button>
      {expanded && <CategoryTransactions categoryId={cat.category_id} year={year} />}
    </div>
  );
}

export default function TaxPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const { data: report, isLoading } = useTaxReport(year);

  function exportCSV() {
    if (!report) return;
    const rows: string[][] = [['Date', 'Description', 'Amount', 'Category', 'Type']];

    // We can't easily export all transactions from just the report (it only has totals).
    // Instead, download a CSV summary by category.
    const allCategories = [
      ...report.income.categories.map((c) => ({
        ...c,
        amount: c.total_income,
        type: 'Income',
      })),
      ...report.expenses.categories.map((c) => ({
        ...c,
        amount: c.total_expenses,
        type: 'Expense',
      })),
    ];

    for (const cat of allCategories) {
      rows.push([
        year.toString(),
        cat.category_name,
        cat.amount.toFixed(2),
        cat.category_name,
        cat.type,
      ]);
    }

    const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasData = report && (report.income.categories.length > 0 || report.expenses.categories.length > 0);

  return (
    <div>
      <UserSelector />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tax Report</h2>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            disabled={!hasData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : !hasData ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No business categories set up yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Mark categories as "Include in Tax Report" on the Categories page, then assign transactions to them using Rules.
          </p>
          <Link to="/categories" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Go to Categories →
          </Link>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-5 h-5 text-green-500" /></div>
                <span className="text-sm text-gray-500">Total Income</span>
              </div>
              <p className="text-2xl font-bold text-green-600">${report.income.total.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-50 rounded-lg"><TrendingDown className="w-5 h-5 text-red-500" /></div>
                <span className="text-sm text-gray-500">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${report.expenses.total.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg"><DollarSign className="w-5 h-5 text-blue-500" /></div>
                <span className="text-sm text-gray-500">Net Profit</span>
              </div>
              <p className={`text-2xl font-bold ${report.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${report.net.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Income section */}
          {report.income.categories.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
              <div className="flex items-center justify-between px-5 py-3 bg-green-50 border-b border-green-100">
                <h3 className="font-semibold text-green-800">Income</h3>
                <span className="font-mono font-bold text-green-700">${report.income.total.toFixed(2)}</span>
              </div>
              {report.income.categories.map((cat) => (
                <CategoryRow key={cat.category_id} cat={cat} year={year} type="income" />
              ))}
            </div>
          )}

          {/* Expenses section */}
          {report.expenses.categories.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
                <h3 className="font-semibold text-red-800">Expenses</h3>
                <span className="font-mono font-bold text-red-700">${report.expenses.total.toFixed(2)}</span>
              </div>
              {report.expenses.categories.map((cat) => (
                <CategoryRow key={cat.category_id} cat={cat} year={year} type="expense" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
