import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useForm, type FieldPath} from 'react-hook-form';
import {useEffect, useState} from 'react';
import {dutPhotography} from '../../shared/lib/dutPhotography';
import {z} from 'zod';
import {Navigate, useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from './store';
import {useLogin, useVerifyLoginLink} from './hooks';
import type {RegisterValues} from './types';
import {apiError, errorMessage} from '../../shared/api/errors';
import {FormField} from '../../shared/components/FormField';
import {Icon} from '../../shared/components/Icon';
import {Button} from '../../shared/components/Button';
import {Input} from '../../shared/components/Input';
import {LoadingState} from '../../shared/components/LoadingState';
import {useToast} from '../../shared/components/ToastProvider';
import {apiClient} from '../../shared/api/client';

const loginSchema = z.object({studentId: z.string().trim().min(1).max(32), password: z.string().min(1).max(72)});
const adminLoginSchema = z.object({email: z.string().trim().email(), password: z.string().min(1).max(72)});
function isPaymentReturn(path?: string): boolean {
    if (!path?.startsWith('/payment/result?')) return false;
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin && url.pathname === '/payment/result' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url.searchParams.get('donationId') || '');
}
const microsoftOAuthEnabled = import.meta.env.VITE_MICROSOFT_OAUTH_ENABLED === 'true';

export function AuthPage({admin = false}: { admin?: boolean }) {
    useLanguage();
    const form = useForm<RegisterValues>();
    const [showPassword, setShowPassword] = useState(false);
    const login = useLogin();
    const verifyLink = useVerifyLoginLink();
    const navigate = useNavigate();
    const location = useLocation();
    const {initialized, user} = useAuth();
    const {show} = useToast();
    const startMicrosoftLogin = () => {
        window.location.assign(`${apiClient.defaults.baseURL}/auth/microsoft/authorize`);
    };
    useEffect(() => {
        const token = new URLSearchParams(location.search).get('token');
        if (token) void verifyLink.mutateAsync(token).then(() => navigate('/me/profile', {replace: true}));
    }, []);
    const mutation = login;
    if (!initialized) return <LoadingState message={tr("Đang khôi phục phiên đăng nhập…")}/>;
    if (initialized && user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/me/profile'} replace/>;
    const submit = form.handleSubmit(async (values) => {
        const validation = (admin ? adminLoginSchema : loginSchema).safeParse(values);
        if (!validation.success) {
            for (const issue of validation.error.issues) form.setError(String(issue.path[0]) as FieldPath<RegisterValues>, {message: issue.message});
            return;
        }
        try {
            {
                const session = await login.mutateAsync(values);
                show('Đăng nhập thành công.', 'success');
                const state = location.state as { from?: string } | null;
                const target = (state?.from === '/me/profile' && session.user.role === 'USER') ||
                    ['/me/organizations', '/me/applications', '/me/tasks', '/me/history', '/me/donations', '/organizations/new', '/proposals', '/proposals/new', '/manage/campaigns'].includes(state?.from || '') ||
                    isPaymentReturn(state?.from) ||
                    /^\/(?:donations|dev\/mock-payments)\/[0-9a-f-]{36}$/i.test(state?.from || '') ||
                    /^\/manage\/campaigns\/[0-9a-f-]{36}\/(?:applications|team|meetings|tasks|attendance|completions|finance|ai|reports)$/i.test(state?.from || '') ||
                    /^\/campaigns\/[a-z0-9-]+$/i.test(state?.from || '') ||
                    /^\/me\/campaigns\/[0-9a-f-]{36}\/meetings$/i.test(state?.from || '') ||
                    /^\/tasks\/[0-9a-f-]{36}$/i.test(state?.from || '') ||
                    /^\/(?:proposals|manage\/campaigns)\/[0-9a-f-]{36}$/i.test(state?.from || '') ||
                    (['/admin', '/admin/users', '/admin/organizations', '/admin/proposals', '/admin/categories', '/admin/campaigns', '/admin/expenses'].includes(state?.from || '') && session.user.role === 'ADMIN') ? state?.from : undefined;
                navigate(target || (session.user.role === 'ADMIN' ? '/admin' : '/me/profile'), {replace: true});
            }
        } catch (error) {
            for (const field of apiError(error)?.fieldErrors || []) {
                if (['password', 'studentId', 'email'].includes(field.field))
                    form.setError(field.field as FieldPath<RegisterValues>, {message: field.message});
            }
        }
    });
    const fields: { name: keyof RegisterValues; label: string; type: string; autocomplete: string; max: number }[] = [
        {name: admin ? 'email' : 'studentId', label: admin ? tr("Email quản trị viên") : tr("Mã sinh viên"), type: admin ? 'email' : 'text', autocomplete: 'username', max: 255},
        {name: 'password', label: 'Mật khẩu', type: 'password', autocomplete: 'current-password', max: 72},
    ];
    if (!admin) return <div className="auth-layout"><div className="auth-art"><img src={dutPhotography.tower.src} alt=""/></div><div className="auth-form">
        <span className="icon-tile mb-5"><Icon name="users" size={25}/></span><h1 className="mb-2 text-3xl font-bold">{tr("Đăng nhập DUT Connect")}</h1>
        <p className="mb-6 text-sm text-text-secondary">{tr("Sử dụng tài khoản Microsoft do DUT cấp để tiếp tục.")}</p>
        {new URLSearchParams(location.search).get('oauth_error') && <p role="alert" className="mb-4 text-danger">{tr("Đăng nhập Microsoft thất bại. Vui lòng kiểm tra tài khoản DUT hoặc liên hệ quản trị viên.")}</p>}
        {microsoftOAuthEnabled && <Button type="button" variant="secondary" onClick={startMicrosoftLogin} className="w-full"><span className="grid h-5 w-5 grid-cols-2 gap-0.5" aria-hidden="true"><i className="bg-[#f25022]"/><i className="bg-[#7fba00]"/><i className="bg-[#00a4ef]"/><i className="bg-[#ffb900]"/></span>{tr("Đăng nhập bằng Microsoft DUT")}</Button>}
    </div></div>;
    return <div className="auth-layout"><div className="auth-art"><img src={dutPhotography.tower.src} alt=""/><div className="auth-art-copy"><span className="eyebrow mb-4"><Icon name="leaf" size={18}/>DUT CONNECT</span><h2>{tr("Một cộng đồng.")}<br/>{tr("Vạn điều tốt đẹp.")}</h2><p className="text-sm leading-relaxed text-white/85">{tr("Mang thời gian, kỹ năng và sự sẻ chia của bạn đến những chiến dịch ý nghĩa.")}</p></div></div><div className="auth-form">
        <span className="icon-tile mb-5"><Icon name="shield" size={25}/></span><h1 className="mb-2 text-3xl font-bold">{tr("Đăng nhập quản trị")}</h1>
        <p className="mb-6 text-sm text-text-secondary">{tr("Khu vực này chỉ dành cho quản trị viên.")}</p>
        <form noValidate onSubmit={submit} className="space-y-4">
            {renderText(fields.map((field) => <FormField key={field.name} id={field.name} label={field.label}
                                              error={form.formState.errors[field.name]?.message}>
                {renderText(<div className="relative"><Input id={field.name} type={field.name === 'password' && showPassword ? 'text' : field.type} autoComplete={field.autocomplete} maxLength={field.max}
                       className={field.name === 'password' ? 'pr-16!' : ''}
                       aria-invalid={!!form.formState.errors[field.name]} aria-describedby={field.name + '-error'}
                       {...form.register(field.name)} />{renderText(field.name === 'password' && <button type="button" className="absolute right-3 top-3 text-xs font-medium text-primary" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{renderText(showPassword ? 'Ẩn' : 'Hiện')}</button>)}</div>)}
            </FormField>))}
            {renderText(mutation.isError && <p role="alert" className="text-danger">{renderText(errorMessage(mutation.error))}</p>)}
            <Button type="submit" disabled={mutation.isPending}
                    className="w-full">{renderText(mutation.isPending ? tr("Vui lòng đợi…") : tr("Đăng nhập"))}</Button>
        </form>
        <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-text-secondary">{tr("Tài khoản dùng để đăng ký tình nguyện, theo dõi nhiệm vụ và các khoản đóng góp của bạn.")}</p>
    </div></div>;
}
