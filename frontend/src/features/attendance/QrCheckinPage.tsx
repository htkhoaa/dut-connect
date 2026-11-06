import {useLanguage, tr} from "../../shared/lib/i18n";
import {useState, useEffect} from 'react';
import {useSearchParams, Link} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import {apiClient} from '../../shared/api/client';
import {useAuth} from '../auth/store';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {Icon} from '../../shared/components/Icon';
import {errorMessage} from '../../shared/api/errors';

export function QrCheckinPage() {
    useLanguage();
    const user = useAuth(s => s.user);
    const initialized = useAuth(s => s.initialized);
    const [searchParams] = useSearchParams();
    const rawToken = searchParams.get('token') || '';
    const [token, setToken] = useState(rawToken);
    const [successData, setSuccessData] = useState<{sessionTitle: string; campaignTitle?: string} | null>(null);

    const cleanToken = (input: string) => {
        try {
            if (input.includes('token=')) {
                const url = new URL(input.startsWith('http') ? input : 'https://dummy.com' + (input.startsWith('/') ? input : '/' + input));
                return url.searchParams.get('token') || input.trim();
            }
        } catch {
            // fallback
        }
        return input.trim();
    };

    const checkinMutation = useMutation({
        mutationFn: async (tokenVal: string) => {
            const cleaned = cleanToken(tokenVal);
            return (await apiClient.post(`/attendance-sessions/checkin-qr?token=${encodeURIComponent(cleaned)}`)).data;
        },
        onSuccess: (data: any) => {
            setSuccessData({
                sessionTitle: data.sessionTitle,
                campaignTitle: data.campaignTitle,
            });
        }
    });

    useEffect(() => {
        if (rawToken && user && !successData && !checkinMutation.isPending && !checkinMutation.isError) {
            checkinMutation.mutate(rawToken);
        }
    }, [rawToken, user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = cleanToken(token);
        if (cleaned) {
            checkinMutation.mutate(cleaned);
        }
    };

    return (
        <div className="mx-auto max-w-md py-8 space-y-6">
            <Card>
                <div className="text-center space-y-3">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
                        <Icon name="calendar" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">{tr("Điểm danh bằng QR Code")}</h1>
                    <p className="text-xs text-text-secondary">
                        {tr("Xác nhận sự hiện diện của bạn tại buổi họp hoặc hoạt động tình nguyện.")}
                    </p>
                </div>

                {initialized && !user ? (
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-amber-900">{tr("Cần đăng nhập để điểm danh")}</h2>
                            <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                                {tr("Bạn cần đăng nhập tài khoản sinh viên DUT Connect trên thiết bị này để hệ thống xác nhận điểm danh cho bạn.")}
                            </p>
                        </div>
                        <Link
                            to="/login"
                            state={{from: '/attendance/checkin?token=' + (rawToken || token)}}
                            className="ui-button ui-button-primary w-full text-sm font-semibold"
                        >
                            {tr("Đăng nhập để điểm danh ngay")}
                        </Link>
                    </div>
                ) : successData ? (
                    <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-6 text-center space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
                            <span className="text-xl font-bold">✓</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-success">{tr("Điểm danh thành công!")}</h2>
                            <p className="mt-1 text-sm font-semibold text-text-primary">{successData.sessionTitle}</p>
                            <p className="mt-0.5 text-xs text-text-secondary">{tr("Sự có mặt của bạn đã được ghi nhận vào hệ thống.")}</p>
                        </div>
                        <div className="pt-2">
                            <Link to="/me/history" className="ui-button ui-button-primary w-full text-sm">
                                {tr("Xem lịch sử tham gia")}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="token" className="block text-xs font-semibold text-text-secondary">
                                {tr("Mã điểm danh hoặc liên kết QR")}
                            </label>
                            <input
                                id="token"
                                type="text"
                                placeholder={tr("Nhập mã token điểm danh…")}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full rounded-xl border border-border p-3 text-sm font-mono"
                                required
                            />
                        </div>

                        {checkinMutation.isError && (
                            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs text-danger font-medium">
                                {errorMessage(checkinMutation.error)}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={checkinMutation.isPending || !token.trim()}
                        >
                            {checkinMutation.isPending ? tr("Đang xác nhận…") : tr("Xác nhận điểm danh")}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
}
