import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions.js';
import { useCategories } from '../hooks/useCategories.js';
import { useTags } from '../hooks/useTags.js';
import TransactionMenu from '../components/transactions/TransactionMenu.js';
import type { TransactionFilters } from '@littysplitty/shared';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import UserSelector from '../components/UserSelector.js';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 50,
    sort_by: 'transaction_date',
    sort_dir: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data: txData, isLoading } = useTransactions(filters);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  const categoryTabs = [
    { id: undefined, label: 'All' },
    { id: '__ignored', label: 'Ignored' },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
    { id: '__uncategorized', label: 'Uncategorized' },
  ];

  function setCategory(tabId: string | undefined) {
    if (tabId === '__ignored') {
      setFilters({ ...filters, category_id: undefined, is_ignored: true, page: 1 });
    } else if (tabId === '__uncategorized') {
      setFilters({ ...filters, category_id: 'null', is_ignored: false, page: 1 });
    } else {
      setFilters({ ...filters, category_id: tabId, is_ignored: tabId ? undefined : false, page: 1 });
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput || undefined, page: 1 });
  }

  const activeTab = filters.is_ignored ? '__ignored' : (filters.category_id === 'null' ? '__uncategorized' : filters.category_id);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Transactions</h2>

      <UserSelector />

      {/* Category filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id ?? 'all'}
            onClick={() => setCategory(tab.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and date filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64"
            />
          </div>
        </form>
        <input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined, page: 1 })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined, page: 1 })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={filters.tag_id || ''}
          onChange={(e) => setFilters({ ...filters, tag_id: e.target.value || undefined, page: 1 })}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Transaction list */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : !txData || txData.data.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No transactions found</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Tag</th>
                  <th className="px-4 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {txData.data.map((tx) => (
                  <tr key={tx.id} className={tx.is_ignored ? 'opacity-40' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {dayjs(tx.transaction_date).format('MMM D, YYYY')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900">{tx.description}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${tx.is_credit ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.is_credit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {tx.category_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: (tx.category_color || '#9E9E9E') + '20', color: tx.category_color || '#9E9E9E' }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.category_color || '#9E9E9E' }} />
                          {tx.category_name}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {tx.tag_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: (tx.tag_color || '#9E9E9E') + '20', color: tx.tag_color || '#9E9E9E' }}>
                          {tx.tag_name}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TransactionMenu transaction={tx} categories={categories} tags={tags} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {txData.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                {txData.total} transactions | Page {txData.page} of {txData.total_pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= txData.total_pages}
                  className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
