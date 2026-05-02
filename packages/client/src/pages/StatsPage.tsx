import { useEffect, useMemo, useRef, useState } from 'react';
import { useSummary, useMonthly } from '../hooks/useStats.js';
import { useInfiniteTransactions } from '../hooks/useTransactions.js';
import { useCategories } from '../hooks/useCategories.js';
import { useTags } from '../hooks/useTags.js';
import TransactionSourceBadge from '../components/transactions/TransactionSourceBadge.js';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import UserSelector from '../components/UserSelector.js';

export default function StatsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagId, setTagId] = useState('');
  const [mode, setMode] = useState<'spending' | 'income'>('spending');
  const [presetRange, setPresetRange] = useState('');
  const [showBreakdowns, setShowBreakdowns] = useState(false);
  const transactionScrollRef = useRef<HTMLDivElement | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: summary, isLoading: summaryLoading } = useSummary({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    categoryId: categoryId || undefined,
    tagId: tagId || undefined,
    mode,
  });
  const { data: availableMonths = [] } = useMonthly({
    categoryId: categoryId || undefined,
    tagId: tagId || undefined,
    mode,
  });
  const {
    data: txData,
    isLoading: transactionsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions({
    limit: 25,
    sort_by: 'transaction_date',
    sort_dir: 'desc',
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    category_id: categoryId || undefined,
    tag_id: tagId || undefined,
    mode,
  });

  const monthOptions = [...availableMonths]
    .sort((a, b) => b.month.localeCompare(a.month))
    .map((entry) => ({
      value: `month:${entry.month}`,
      label: `Month: ${dayjs(`${entry.month}-01`).format('MMMM YYYY')}`,
      dateFrom: `${entry.month}-01`,
      dateTo: dayjs(`${entry.month}-01`).endOf('month').format('YYYY-MM-DD'),
    }));

  const yearOptions = [...new Set(availableMonths.map((entry) => entry.month.slice(0, 4)))]
    .sort((a, b) => b.localeCompare(a))
    .map((year) => ({
      value: `year:${year}`,
      label: `Year: ${year}`,
      dateFrom: `${year}-01-01`,
      dateTo: `${year}-12-31`,
    }));

  const presetOptions = [...monthOptions, ...yearOptions];
  const activeTotal = mode === 'income' ? summary?.total_credits ?? 0 : summary?.total_spent ?? 0;
  const transactions = useMemo(
    () => txData?.pages.flatMap((pageData) => pageData.data) ?? [],
    [txData]
  );

  useEffect(() => {
    const node = transactionScrollRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;

    if (node.scrollHeight <= node.clientHeight + 120) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, transactions.length]);

  function handleTransactionScroll(e: React.UIEvent<HTMLDivElement>) {
    const node = e.currentTarget;
    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (remaining < 240 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }

  function applyPresetRange(value: string) {
    setPresetRange(value);

    if (!value) {
      setDateFrom('');
      setDateTo('');
      return;
    }

    const selected = presetOptions.find((option) => option.value === value);
    if (!selected) return;
    setDateFrom(selected.dateFrom);
    setDateTo(selected.dateTo);
  }

  useEffect(() => {
    if (presetRange && !presetOptions.some((option) => option.value === presetRange)) {
      setPresetRange('');
    }
  }, [presetOptions, presetRange]);

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-gray-200 bg-gray-50/95 px-6 pb-4 pt-6 backdrop-blur">
        <h2 className="mb-6 text-2xl font-bold">Statistics</h2>

        <UserSelector />

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
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
          <button
            onClick={() => setShowBreakdowns((current) => !current)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {showBreakdowns ? 'Hide Graphs' : 'Show Graphs'}
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPresetRange('');
              setDateFrom(e.target.value);
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPresetRange('');
              setDateTo(e.target.value);
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={presetRange}
            onChange={(e) => applyPresetRange(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Custom Range</option>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={tagId} onChange={(e) => setTagId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            <option value="">All Tags</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            onClick={() => {
              setPresetRange('');
              setDateFrom('');
              setDateTo('');
              setCategoryId('');
              setTagId('');
            }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {summaryLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : !summary ? (
        <div className="text-center text-gray-400 py-12">No data available</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">
                {mode === 'income' ? 'Filtered Income' : 'Filtered Expenses'}
              </p>
              <p className={`mt-2 text-4xl font-bold ${mode === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                ${activeTotal.toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Total for every {mode === 'income' ? 'income' : 'expense'} transaction matching the current filters.
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 p-5 text-sm text-gray-500">
              {showBreakdowns
                ? 'Category and tag charts are shown below so the transaction list can stay full width.'
                : 'Graphs are hidden right now to give the transaction list more room. Use the button above to toggle them.'}
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="font-semibold text-gray-900">Transactions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  One continuous scroll for the filtered transactions behind this total.
                </p>
              </div>

              {transactionsLoading ? (
                <div className="px-5 py-12 text-center text-gray-400">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="px-5 py-12 text-center text-gray-400">No transactions match these filters.</div>
              ) : (
                <div
                  ref={transactionScrollRef}
                  onScroll={handleTransactionScroll}
                  className="h-[68vh] overflow-auto xl:h-[calc(100vh-18rem)]"
                >
                  <div className="min-w-[980px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="sticky top-0 z-10 bg-gray-50 text-left text-gray-500 shadow-[0_1px_0_rgba(229,231,235,1)]">
                          <th className="w-[140px] px-5 py-3 font-medium">Date</th>
                          <th className="px-5 py-3 font-medium">Description</th>
                          <th className="w-[220px] px-5 py-3 font-medium">Category</th>
                          <th className="w-[180px] px-5 py-3 font-medium">Tag</th>
                          <th className="w-[150px] px-5 py-3 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                              {dayjs(tx.transaction_date).format('MMM D, YYYY')}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <TransactionSourceBadge
                                  bank_source_name={tx.bank_source_name}
                                  bank_source_parser_key={tx.bank_source_parser_key}
                                />
                                <span className="text-gray-900">{tx.description}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              {tx.category_name ? (
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    backgroundColor: `${tx.category_color || '#9E9E9E'}20`,
                                    color: tx.category_color || '#9E9E9E',
                                  }}
                                >
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: tx.category_color || '#9E9E9E' }}
                                  />
                                  {tx.category_name}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">--</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              {tx.tag_name ? (
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    backgroundColor: `${tx.tag_color || '#9E9E9E'}20`,
                                    color: tx.tag_color || '#9E9E9E',
                                  }}
                                >
                                  {tx.tag_name}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-300">--</span>
                              )}
                            </td>
                            <td className={`px-5 py-3 text-right font-mono font-medium ${tx.is_credit ? 'text-green-600' : 'text-gray-900'}`}>
                              {tx.is_credit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {isFetchingNextPage ? (
                    <div className="px-5 py-4 text-center text-sm text-gray-400">Loading more transactions...</div>
                  ) : null}
                  {!hasNextPage ? (
                    <div className="px-5 py-4 text-center text-sm text-gray-400">End of filtered transactions</div>
                  ) : null}
                </div>
              )}
            </div>

          {showBreakdowns ? (
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              {summary.by_category.length > 0 && (
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="mb-4 font-semibold">{mode === 'income' ? 'Income by Category' : 'Spending by Category'}</h3>
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
                  <div className="mt-2 space-y-1.5">
                    {summary.by_category.map((cat) => (
                      <div key={cat.category_id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.category_color || '#9E9E9E' }} />
                          <span className="text-gray-700">{cat.category_name || 'Uncategorized'}</span>
                        </div>
                        <span className="font-mono text-gray-900">${cat.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {summary.by_tag.length > 0 && (
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="mb-4 font-semibold">By Tag</h3>
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
                  <div className="mt-2 space-y-1.5">
                    {summary.by_tag.map((tag) => (
                      <div key={tag.tag_id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.tag_color || '#9E9E9E' }} />
                          <span className="text-gray-700">{tag.tag_name || 'Untagged'}</span>
                        </div>
                        <span className="font-mono text-gray-900">${tag.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
