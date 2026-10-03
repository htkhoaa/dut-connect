import { apiClient } from '../../../shared/api/client';

export interface BackendHealth {
  status: 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';
}

export async function getBackendHealth(): Promise<BackendHealth> {
  // Actuator is infrastructure and is outside the versioned business API.
  const response = await apiClient.get<BackendHealth>('/api/actuator/health/readiness', {
    baseURL: '',
  });
  return response.data;
}
