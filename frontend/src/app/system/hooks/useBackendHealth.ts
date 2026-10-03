import { useQuery } from '@tanstack/react-query';
import { getBackendHealth } from '../api/health';

export function useBackendHealth() {
  return useQuery({
    queryKey: ['system', 'backend-health'],
    queryFn: getBackendHealth,
    refetchInterval: 30_000,
  });
}
