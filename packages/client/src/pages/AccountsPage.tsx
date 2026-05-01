import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Landmark, RefreshCw, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import {
  usePlaidItems,
  useCreateLinkToken,
  useExchangePublicToken,
  useSyncPlaidItem,
  useDeletePlaidItem,
} from '../hooks/usePlaid.js';
import type { PlaidSyncResult } from '@littysplitty/shared';
import UserSelector from '../components/UserSelector.js';
import { useUserContext } from '../contexts/UserContext.js';

dayjs.extend(relativeTime);

export default function AccountsPage() {
  const { selectedUserId } = useUserContext();
  const { data: items = [], isLoading } = usePlaidItems();
  const createLinkToken = useCreateLinkToken();
  const exchangeToken = useExchangePublicToken();
  const syncItem = useSyncPlaidItem();
  const deleteItem = useDeletePlaidItem();

  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ id: string; result: PlaidSyncResult } | null>(null);
  const [plaidError, setPlaidError] = useState<string | null>(null);

  const onPlaidSuccess = useCallback(
    (publicToken: string) => {
      setLinkToken(null);
      setPlaidError(null);
      if (!selectedUserId) return;
      exchangeToken.mutate({ publicToken, userId: selectedUserId });
    },
    [exchangeToken, selectedUserId]
  );

  const onPlaidExit = useCallback((err: any) => {
    setLinkToken(null);
    if (err) {
      // Show a helpful error — common ones explained below
      const msg = err.error_message || err.display_message || err.error_code || 'Plaid Link closed with an error.';
      setPlaidError(`Plaid: ${msg}`);
    }
  }, []);

  async function handleConnect() {
    if (!selectedUserId) {
      setPlaidError('Please select a user before connecting an account.');
      return;
    }
    setPlaidError(null);
    const result = await createLinkToken.mutateAsync(selectedUserId);
    setLinkToken(result.link_token);
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    setSyncResult(null);
    try {
      const result = await syncItem.mutateAsync(id);
      setSyncResult({ id, result });
    } catch (e: any) {
      setPlaidError(`Sync failed: ${e?.response?.data?.error || e?.message || 'Unknown error'}`);
    } finally {
      setSyncingId(null);
    }
  }

  function handleDelete(id: string, name: string) {
    if (confirm(`Disconnect "${name}"? Existing transactions will be kept.`)) {
      deleteItem.mutate(id);
      if (syncResult?.id === id) setSyncResult(null);
    }
  }

  return (
    <div>
      <UserSelector />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Connected Accounts</h2>
        <button
          onClick={handleConnect}
          disabled={createLinkToken.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {createLinkToken.isPending ? 'Loading...' : 'Connect Account'}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Connect your bank accounts via Plaid to automatically sync transactions. Each sync pulls up to 24 months of history. Duplicates are automatically ignored.
      </p>

      {plaidError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p>{plaidError}</p>
            {plaidError.includes('OAUTH') || plaidError.includes('oauth') ? (
              <p className="mt-1 text-red-600">
                This bank uses OAuth (a redirect-based login). You need to add <code className="bg-red-100 px-1 rounded">http://localhost:5173/accounts</code> as an allowed redirect URI in your{' '}
                <a href="https://dashboard.plaid.com/developers/api" target="_blank" rel="noreferrer" className="underline">Plaid dashboard</a>.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {exchangeToken.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-700">
          Connecting account...
        </div>
      )}

      {exchangeToken.isError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to connect account. Please try again.
        </div>
      )}

      {/* Plaid Link — rendered only when we have a token */}
      {linkToken && (
        <PlaidLinkLauncher
          token={linkToken}
          onSuccess={onPlaidSuccess}
          onExit={onPlaidExit}
        />
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No accounts connected</p>
          <p className="text-gray-400 text-sm">Click "Connect Account" to link your bank via Plaid.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.institution_name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.last_synced_at
                      ? `Last synced ${dayjs(item.last_synced_at).fromNow()}`
                      : 'Never synced'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {syncResult?.id === item.id && (
                  <div className="flex items-center gap-1.5 text-sm text-green-600 mr-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      +{syncResult.result.added} added
                      {syncResult.result.modified > 0 && `, ${syncResult.result.modified} updated`}
                      {syncResult.result.removed > 0 && `, ${syncResult.result.removed} removed`}
                      {syncResult.result.rules_applied > 0 && `, ${syncResult.result.rules_applied} rules applied`}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => handleSync(item.id)}
                  disabled={syncingId === item.id}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingId === item.id ? 'animate-spin' : ''}`} />
                  {syncingId === item.id ? 'Syncing...' : 'Sync Now'}
                </button>

                <button
                  onClick={() => handleDelete(item.id, item.institution_name)}
                  disabled={deleteItem.isPending}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Disconnect"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Separate component so usePlaidLink only mounts when we have a token
function PlaidLinkLauncher({
  token,
  onSuccess,
  onExit,
}: {
  token: string;
  onSuccess: (publicToken: string) => void;
  onExit: (err: any) => void;
}) {
  const { open, ready } = usePlaidLink({
    token,
    onSuccess: (publicToken) => onSuccess(publicToken),
    onExit: (err) => onExit(err),
  });

  // Open once when ready — useEffect prevents repeated calls on re-renders
  useEffect(() => {
    if (ready) open();
  }, [ready, open]);

  return null;
}
