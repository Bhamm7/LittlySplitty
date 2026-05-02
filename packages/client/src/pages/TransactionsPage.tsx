import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteTransactions } from '../hooks/useTransactions.js';
import { useCategories } from '../hooks/useCategories.js';
import { useTags } from '../hooks/useTags.js';
import TransactionMenu from '../components/transactions/TransactionMenu.js';
import TransactionSourceBadge from '../components/transactions/TransactionSourceBadge.js';
import type { TransactionFilters } from '@littysplitty/shared';
import { Search } from 'lucide-react';
import dayjs from 'dayjs';
import UserSelector from '../components/UserSelector.js';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    limit: 50,
    sort_by: 'transaction_date',
    sort_dir: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const transactionScrollRef = useRef<HTMLDivElement | null>(null);

  const {
    data: txData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions(filters);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const transactions = useMemo(
    () => txData?.pages.flatMap((pageData) => pageData.data) ?? [],
    [txData]
  );

  const categoryTabs = [
    { id: undefined, label: 'All' },
    { id: '__ignored', label: 'Ignored' },
    { id: '__transfers', label: 'Transfers' },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
    { id: '__uncategorized', label: 'Uncategorized' },
  ];

  function setCategory(tabId: string | undefined) {
    if (tabId === '__ignored') {
      setFilters({ ...filters, category_id: undefined, is_ignored: true, is_transfer: undefined });
    } else if (tabId === '__transfers') {
      setFilters({ ...filters, category_id: undefined, is_ignored: false, is_transfer: true });
    } else if (tabId === '__uncategorized') {
      setFilters({ ...filters, category_id: 'null', is_ignored: false, is_transfer: undefined });
    } else {
      setFilters({ ...filters, category_id: tabId, is_ignored: tabId ? undefined : false, is_transfer: undefined });
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput || undefined });
  }

  const activeTab = filters.is_ignored
    ? '__ignored'
    : (filters.is_transfer ? '__transfers' : (filters.category_id === 'null' ? '__uncategorized' : filters.category_id));

  useEffect(() => {
    const node = transactionScrollRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;

    if (node.scrollHeight <= node.clientHeight + 120) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, transactions.length]);

  useEffect(() => {
    const node = transactionScrollRef.current;
    if (node) {
      node.scrollTop = 0;
    }
  }, [filters]);

  function handleTransactionScroll(e: React.UIEvent<HTMLDivElement>) {
    const node = e.currentTarget;
    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (remaining < 240 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-gray-200 bg-gray-50/95 px-6 pb-4 pt-6 backdrop-blur">
        <h2 className="mb-6 text-2xl font-bold">Transactions</h2>

        <UserSelector />

        <div className="mb-4 flex gap-1 overflow-x-auto pb-2">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id ?? 'all'}
              onClick={() => setCategory(tab.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64 rounded-lg border py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </form>
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined })}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={filters.tag_id || ''}
            onChange={(e) => setFilters({ ...filters, tag_id: e.target.value || undefined })}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction list */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No transactions found</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div
            ref={transactionScrollRef}
            onScroll={handleTransactionScroll}
            className="h-[72vh] overflow-auto"
          >
            <div className="min-w-[920px]">
              <table className="w-full text-sm">
              <thead>
                  <tr className="sticky top-0 z-10 bg-gray-50 text-left text-gray-500 shadow-[0_1px_0_rgba(229,231,235,1)]">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Tag</th>
                    <th className="w-10 px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className={tx.is_ignored ? 'opacity-40' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {dayjs(tx.transaction_date).format('MMM D, YYYY')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TransactionSourceBadge
                            bank_source_name={tx.bank_source_name}
                            bank_source_parser_key={tx.bank_source_parser_key}
                          />
                          <span className="text-gray-900">{tx.description}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${tx.is_transfer ? 'text-sky-700' : (tx.is_credit ? 'text-green-600' : 'text-gray-900')}`}>
                        {tx.is_credit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {tx.is_transfer ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700">
                            Transfer
                          </span>
                        ) : tx.category_name ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: (tx.category_color || '#9E9E9E') + '20', color: tx.category_color || '#9E9E9E' }}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tx.category_color || '#9E9E9E' }} />
                            {tx.category_name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tx.tag_name ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: (tx.tag_color || '#9E9E9E') + '20', color: tx.tag_color || '#9E9E9E' }}>
                            {tx.tag_name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">--</span>
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
            {isFetchingNextPage ? (
              <div className="px-4 py-4 text-center text-sm text-gray-400">Loading more transactions...</div>
            ) : null}
            {!hasNextPage ? (
              <div className="px-4 py-4 text-center text-sm text-gray-400">End of transactions</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
