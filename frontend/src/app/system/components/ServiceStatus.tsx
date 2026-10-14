import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import { Button } from '../../../shared/components/Button';
import { useBackendHealth } from '../hooks/useBackendHealth';

export function ServiceStatus() {
    useLanguage();
  const health = useBackendHealth();
  const available = !health.isError && health.data?.status === 'UP';
  const label = health.isPending
    ? tr("Đang kiểm tra kết nối…")
    : available
      ? tr("Kết nối hoạt động")
      : tr("Chưa thể kết nối");

  return (
    <section aria-label={tr("Kết nối hệ thống")} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted p-5">
      <div role="status" aria-live="polite">
        <p className={available ? 'font-medium text-success' : 'font-medium text-text-secondary'}>{renderText(label)}</p>
        {renderText(health.isError && (
          <p className="mt-1 text-sm text-text-secondary">{tr("Không thể kết nối hệ thống. Vui lòng thử lại.")}</p>
        ))}
      </div>
      <Button disabled={health.isFetching} onClick={() => void health.refetch()}>
        {renderText(health.isFetching ? tr("Đang kiểm tra…") : 'Kiểm tra kết nối')}
      </Button>
    </section>
  );
}
