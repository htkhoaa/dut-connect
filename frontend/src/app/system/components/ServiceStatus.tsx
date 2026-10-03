import { Button } from '../../../shared/components/Button';
import { useBackendHealth } from '../hooks/useBackendHealth';

export function ServiceStatus() {
  const health = useBackendHealth();
  const available = !health.isError && health.data?.status === 'UP';
  const label = health.isPending
    ? 'Đang kiểm tra kết nối…'
    : available
      ? 'Kết nối hoạt động'
      : 'Chưa thể kết nối';

  return (
    <section aria-label="Kết nối hệ thống" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted p-5">
      <div role="status" aria-live="polite">
        <p className={available ? 'font-medium text-success' : 'font-medium text-text-secondary'}>{label}</p>
        {health.isError && (
          <p className="mt-1 text-sm text-text-secondary">Không thể kết nối hệ thống. Vui lòng thử lại.</p>
        )}
      </div>
      <Button disabled={health.isFetching} onClick={() => void health.refetch()}>
        {health.isFetching ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}
      </Button>
    </section>
  );
}
