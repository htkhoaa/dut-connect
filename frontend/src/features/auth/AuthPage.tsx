import {useForm, type FieldPath} from 'react-hook-form';
import {dutPhotography} from '../../shared/lib/dutPhotography';
import {z} from 'zod';
import {Link, Navigate, useLocation, useNavigate} from 'react-router-dom';
import {useAuth} from './store';
import {useLogin, useRegister} from './hooks';
import type {RegisterValues} from './types';
import {apiError, errorMessage} from '../../shared/api/errors';
import {FormField} from '../../shared/components/FormField';
import {Icon} from '../../shared/components/Icon';
import {Button} from '../../shared/components/Button';
import {Input} from '../../shared/components/Input';
import {LoadingState} from '../../shared/components/LoadingState';

const loginSchema = z.object({email: z.string().trim().pipe(z.email().max(255)), password: z.string().min(1).max(72)});
function isPaymentReturn(path?: string): boolean {
    if (!path?.startsWith('/payment/result?')) return false;
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin && url.pathname === '/payment/result' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url.searchParams.get('donationId') || '');
}
const registerSchema = loginSchema.extend({
    studentId: z.string().trim().min(1).max(32),
    fullName: z.string().trim().min(1).max(150),
    faculty: z.string().trim().min(1).max(150),
    password: z.string().min(8).refine((v) => new TextEncoder().encode(v).length <= 72, 'Mật khẩu tối đa 72 byte UTF-8'),
});

export function AuthPage({registration = false}: { registration?: boolean }) {
    const form = useForm<RegisterValues>();
    const [showPassword, setShowPassword] = useState(false);
    const login = useLogin();
    const register = useRegister();
    const navigate = useNavigate();
    const location = useLocation();
    const {initialized, user} = useAuth();
    const mutation = registration ? register : login;
    if (!initialized) return <LoadingState message="Đang khôi phục phiên đăng nhập…"/>;
    if (initialized && user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/me/profile'} replace/>;
    const submit = form.handleSubmit(async (values) => {
        const validation = (registration ? registerSchema : loginSchema).safeParse(values);
        if (!validation.success) {
            for (const issue of validation.error.issues) form.setError(String(issue.path[0]) as FieldPath<RegisterValues>, {message: issue.message});
            return;
        }
        try {
            if (registration) {
                await register.mutateAsync(values);
                navigate('/login', {state: {registered: true}, replace: true});
            } else {
                const session = await login.mutateAsync(values);
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
                if (['email', 'password', 'studentId', 'fullName', 'faculty'].includes(field.field))
                    form.setError(field.field as FieldPath<RegisterValues>, {message: field.message});
            }
        }
    });
    const fields: { name: keyof RegisterValues; label: string; type: string; autocomplete: string; max: number }[] = [
        ...(registration ? [
            {name: 'studentId' as const, label: 'Mã sinh viên', type: 'text', autocomplete: 'off', max: 32},
            {name: 'fullName' as const, label: 'Họ và tên', type: 'text', autocomplete: 'name', max: 150},
            {name: 'faculty' as const, label: 'Khoa', type: 'text', autocomplete: 'organization', max: 150},
        ] : []),
        {name: 'email', label: 'Email', type: 'email', autocomplete: 'email', max: 255},
        {
            name: 'password',
            label: 'Mật khẩu',
            type: 'password',
            autocomplete: registration ? 'new-password' : 'current-password',
            max: 72
        },
    ];
    return <div className="auth-layout"><div className="auth-art"><img src={registration ? dutPhotography.garden.src : dutPhotography.tower.src} alt=""/><span className="art-label z-10">Ảnh khuôn viên DUT</span><div className="auth-art-copy"><span className="eyebrow mb-4"><Icon name="leaf" size={18}/>DUT CONNECT</span><h2>Một cộng đồng.<br/>Vạn điều tốt đẹp.</h2><p className="text-sm leading-relaxed text-white/85">Mang thời gian, kỹ năng và sự sẻ chia của bạn đến những chiến dịch ý nghĩa.</p></div></div><div className="auth-form">
        <span className="icon-tile mb-5"><Icon name="users" size={25}/></span><h1 className="mb-2 text-3xl font-bold">{registration ? 'Bắt đầu hành trình của bạn' : 'Chào mừng bạn trở lại'}</h1>
        <p className="mb-6 text-sm text-text-secondary">{registration ? 'Tạo tài khoản sinh viên để cùng cộng đồng DUT cống hiến.' : 'Đăng nhập để tiếp tục những điều bạn đang góp sức.'}</p>
        {!registration && (location.state as { registered?: boolean } | null)?.registered &&
            <p role="status" className="mb-4 text-success">Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.</p>}
        <form noValidate onSubmit={submit} className="space-y-4">
            {fields.map((field) => <FormField key={field.name} id={field.name} label={field.label}
                                              error={form.formState.errors[field.name]?.message}>
                <div className="relative"><Input id={field.name} type={field.name === 'password' && showPassword ? 'text' : field.type} autoComplete={field.autocomplete} maxLength={field.max}
                       className={field.name === 'password' ? 'pr-16!' : ''}
                       aria-invalid={!!form.formState.errors[field.name]} aria-describedby={field.name + '-error'}
                       {...form.register(field.name)} />{field.name === 'password' && <button type="button" className="absolute right-3 top-3 text-xs font-medium text-primary" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ẩn' : 'Hiện'}</button>}</div>
            </FormField>)}
            {mutation.isError && <p role="alert" className="text-danger">{errorMessage(mutation.error)}</p>}
            <Button type="submit" disabled={mutation.isPending}
                    className="w-full">{mutation.isPending ? 'Vui lòng đợi…' : registration ? 'Tạo tài khoản' : 'Đăng nhập'}</Button>
        </form>
        <p className="mt-5 text-sm">{registration ? 'Bạn đã có tài khoản?' : 'Bạn mới đến DUT Connect?'}{' '}
            <Link className="text-primary hover:underline"
                  to={registration ? '/login' : '/register'}>{registration ? 'Đăng nhập' : 'Đăng ký'}</Link>
        </p>
        <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-text-secondary">Tài khoản dùng để đăng ký tình nguyện, theo dõi nhiệm vụ và các khoản đóng góp của bạn.</p>
    </div></div>;
}
import {useState} from 'react';
