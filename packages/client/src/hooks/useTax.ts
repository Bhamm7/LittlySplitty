import { useQuery } from '@tanstack/react-query';
import { fetchTaxReport } from '../api/tax.js';
import { useUserContext } from '../contexts/UserContext.js';

export function useTaxReport(year: number) {
  const { selectedUserId } = useUserContext();
  return useQuery({
    queryKey: ['tax', year, selectedUserId],
    queryFn: () => fetchTaxReport(year, selectedUserId || undefined),
  });
}
