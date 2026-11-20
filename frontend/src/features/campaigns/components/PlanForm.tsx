import { PlanReview } from './PlanReview';
import type { PendingPlanImage } from './planTypes';
import { defaults, payload } from '../planValues';
import { vietnameseBanks } from '../banks';
import { PlanImages } from './PlanImages';
import { useLanguage, tr, renderText } from '../../../shared/lib/i18n';
import { catalogLabel } from '../../../shared/lib/catalogLabels';
import { useEffect, useState, useRef } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planSchema } from './planSchema';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/store';
import type { Content, FormValues } from '../types';
import { useCategoryCatalog, useOrganizationOptions, useEditCampaign } from '../hooks';
import { useSaveProposal } from '../../proposals/hooks';
import { modes, organizers } from '../presentation';
import { apiClient } from '../../../shared/api/client';
import { apiError, errorMessage } from '../../../shared/api/errors';
import { FormField } from '../../../shared/components/FormField';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { Textarea } from '../../../shared/components/Textarea';
import { Button } from '../../../shared/components/Button';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';

const DRAFT_STORAGE_KEY = 'dut_connect_proposal_draft';

export function PlanForm({
    kind = 'proposal',
    id,
    content,
    version: initialVersion,
    categoryName,
    organizationName,
    modeLocked = false,
}: {
    kind?: 'proposal' | 'campaign';
    id?: string;
    content?: Content;
    version?: number;
    categoryName?: string;
    organizationName?: string;
    modeLocked?: boolean;
}) {
    useLanguage();
    const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
    const [step, setStep] = useState(0);
    const stepHeading = useRef<HTMLHeadingElement>(null);
    const wizard = kind === 'proposal' && !id && !content && desktop;
    const stepLabels = [
        'Nội dung đề xuất',
        'Thời gian và nguồn lực',
        'Hình ảnh',
        'Kiểm tra và gửi',
    ];
    useEffect(() => {
        const media = window.matchMedia('(min-width: 1024px)');
        const update = () => setDesktop(media.matches);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        if (wizard) stepHeading.current?.focus();
    }, [step, wizard]);
    const qc = useQueryClient();
    const userId = useAuth((s) => s.user?.id);
    const draftStorageKey = DRAFT_STORAGE_KEY + ':' + userId;
    const [savedId, setSavedId] = useState(id);
    const categories = useCategoryCatalog();
    const organizations = useOrganizationOptions('proposal');
    const proposal = useSaveProposal(kind === 'proposal' ? savedId : undefined);
    const campaign = useEditCampaign(id || '');
    const form = useForm<FormValues>({ defaultValues: defaults(content) });
    const [version, setVersion] = useState(initialVersion);
    const [draftRestored, setDraftRestored] = useState(false);
    const [draftMessage, setDraftMessage] = useState<string | null>(null);
    const [savingDraft, setSavingDraft] = useState(false);
    const [pendingImages, setPendingImages] = useState<PendingPlanImage[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const mutation = kind === 'proposal' ? proposal : campaign;
    const mode = form.watch('contributionMode');
    const organizer = form.watch('organizerType');
    const selectedBank = form.watch('donationBankName');

    // Fetch existing gallery images for proposal or campaign if id exists
    const galleryQuery = useQuery({
        queryKey: [kind === 'campaign' ? 'campaign-gallery' : 'proposal-gallery', id],
        queryFn: async () => {
            if (!id) return [];
            const endpoint =
                kind === 'campaign' ? `/campaigns/${id}/gallery` : `/proposals/${id}/gallery`;
            return (
                await apiClient.get<Array<{ id: string; caption: string; imageUrl: string }>>(
                    endpoint,
                )
            ).data;
        },
        enabled: !!id,
    });

    const deleteImageMutation = useMutation({
        mutationFn: async (imageId: string) => {
            await apiClient.delete(`/campaigns/gallery/${imageId}`);
        },
        onSuccess: () => {
            void qc.invalidateQueries({
                queryKey: [kind === 'campaign' ? 'campaign-gallery' : 'proposal-gallery', id],
            });
        },
    });

    const uploadPendingFiles = async (targetId: string) => {
        if (pendingImages.length === 0) return;
        setUploadingImages(true);
        try {
            const endpoint =
                kind === 'campaign'
                    ? `/campaigns/${targetId}/gallery`
                    : `/proposals/${targetId}/gallery`;
            for (const img of pendingImages) {
                const formData = new FormData();
                formData.append('file', img.file);
                if (img.caption) formData.append('caption', img.caption);
                await apiClient.post(endpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                URL.revokeObjectURL(img.previewUrl);
                setPendingImages((current) => current.filter((item) => item.id !== img.id));
            }
            void qc.invalidateQueries({
                queryKey: [kind === 'campaign' ? 'campaign-gallery' : 'proposal-gallery', targetId],
            });
            void qc.invalidateQueries({ queryKey: ['campaign-gallery', targetId] });
        } catch (e) {
            form.setError('root', { message: errorMessage(e) });
            throw e;
        } finally {
            setUploadingImages(false);
        }
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const newItems: PendingPlanImage[] = [];
        for (const f of files) {
            if (!['image/png', 'image/jpeg'].includes(f.type)) {
                form.setError('root', { message: tr('Chọn ảnh PNG hoặc JPEG không quá 5 MB.') });
                continue;
            }
            if (f.size > 5 * 1024 * 1024) {
                form.setError('root', { message: tr('Chọn ảnh PNG hoặc JPEG không quá 5 MB.') });
                continue;
            }
            newItems.push({
                id: 'pend-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                file: f,
                previewUrl: URL.createObjectURL(f),
                caption: '',
            });
        }
        setPendingImages((prev) => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Restore draft from localStorage for new proposals
    useEffect(() => {
        if (kind === 'proposal' && !id && !content) {
            try {
                const saved = localStorage.getItem(draftStorageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed === 'object') {
                        form.reset(parsed);
                        setDraftRestored(true);
                    }
                }
            } catch {
                // ignore corrupted data
            }
        }
    }, [kind, id, content, form, draftStorageKey]);

    useEffect(() => {
        if (content && !form.formState.isDirty) {
            form.reset(defaults(content));
            setVersion(initialVersion);
        }
    }, [content, initialVersion, form]);

    const handleSaveDraft = async () => {
        const input = form.getValues();
        let storedLocally = false;
        try {
            localStorage.setItem(draftStorageKey, JSON.stringify(input));
            storedLocally = true;
        } catch {
            /* Report storage failures below if the server save fails too. */
        }
        form.clearErrors('root');
        setSavingDraft(true);
        setDraftMessage(null);
        try {
            // Attempt to save as draft to backend if possible
            if (kind === 'proposal') {
                const parsedContent = payload(input, content);
                const result = await proposal.mutateAsync({
                    content: parsedContent,
                    version,
                    asDraft: true,
                });
                const targetId = savedId || result.id;
                setSavedId(targetId);
                setVersion(result.version);
                if (pendingImages.length > 0) {
                    await uploadPendingFiles(targetId);
                }
                setVersion(result.version);
                setDraftMessage(
                    tr(
                        storedLocally
                            ? 'Đã lưu bản nháp vào hệ thống và trình duyệt.'
                            : 'Đã lưu bản nháp vào hệ thống.',
                    ),
                );
                if (!id) {
                    navigate('/proposals/' + result.id);
                }
            } else {
                setDraftMessage(tr('Đã lưu bản nháp vào trình duyệt.'));
            }
        } catch (error) {
            setDraftMessage(
                storedLocally
                    ? tr(
                          'Đã lưu nội dung bản nháp trong trình duyệt. Ảnh chưa tải lên cần được chọn lại khi mở lại trang.',
                      )
                    : null,
            );
            form.setError('root', {
                message: storedLocally
                    ? tr('Chưa lưu được bản nháp lên hệ thống.')
                    : errorMessage(error),
            });
        } finally {
            setSavingDraft(false);
        }
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(draftStorageKey);
        form.reset(defaults());
        setDraftRestored(false);
        setDraftMessage(null);
    };

    const submit = form.handleSubmit(async (input) => {
        const parsed = planSchema.safeParse(input);
        if (!parsed.success) {
            if (wizard) {
                const field = parsed.error.issues[0]?.path[0];
                setStep(
                    [
                        'organizerType',
                        'organizationId',
                        'categoryId',
                        'title',
                        'summary',
                        'description',
                        'expectedImpact',
                    ].includes(String(field))
                        ? 0
                        : 1,
                );
            }
            for (const issue of parsed.error.issues) {
                form.setError(issue.path[0] as FieldPath<FormValues>, { message: issue.message });
            }
            return;
        }
        try {
            const result = await mutation.mutateAsync({
                content: payload(parsed.data, content),
                version,
                asDraft: false,
            });
            const targetId = savedId || result.id;
            setSavedId(targetId);
            setVersion(result.version);
            if (pendingImages.length > 0) {
                await uploadPendingFiles(targetId);
            }
            localStorage.removeItem(draftStorageKey);
            setDraftRestored(false);
            form.reset(defaults(result.content));
            setVersion(result.version);
            if (!id) navigate('/proposals/' + result.id);
        } catch (error) {
            form.setError('root', { message: errorMessage(error) });
            for (const field of apiError(error)?.fieldErrors || []) {
                const name = field.field.replace(/^content\./, '') as keyof FormValues;
                if (name in input) form.setError(name, { message: field.message });
            }
        }
    });

    if (categories.isPending || organizations.isPending)
        return <LoadingState message={tr('Đang tải thông tin đề xuất…')} />;
    if (categories.isError || organizations.isError) {
        return (
            <ErrorState
                message={errorMessage(categories.error || organizations.error)}
                onRetry={() => {
                    void categories.refetch();
                    void organizations.refetch();
                }}
            />
        );
    }

    function input(name: keyof FormValues, label: string, type = 'text', max?: number) {
        return (
            <FormField
                id={'plan-' + name}
                label={label}
                error={form.formState.errors[name]?.message}
            >
                <Input
                    id={'plan-' + name}
                    type={type}
                    step={type === 'datetime-local' ? '60' : undefined}
                    maxLength={max}
                    {...form.register(name)}
                />
            </FormField>
        );
    }

    function area(name: keyof FormValues, label: string, max: number) {
        return (
            <FormField
                id={'plan-' + name}
                label={label}
                error={form.formState.errors[name]?.message}
            >
                <Textarea id={'plan-' + name} rows={4} maxLength={max} {...form.register(name)} />
            </FormField>
        );
    }

    function nextStep() {
        const groups: (keyof FormValues)[][] = [
            [
                'organizerType',
                'organizationId',
                'categoryId',
                'title',
                'summary',
                'description',
                'expectedImpact',
            ],
            [
                'contributionMode',
                'startDate',
                'endDate',
                'applicationDeadline',
                'fundraisingDeadline',
                'targetVolunteerCount',
                'targetTechnicalCount',
                'targetLogisticsCount',
                'volunteerRequirements',
                'fundraisingGoal',
                'donationBankName',
                'donationAccountNumber',
                'donationAccountHolder',
            ],
            [],
        ];
        const result = planSchema.safeParse(form.getValues());
        const issues = result.success
            ? []
            : result.error.issues.filter((issue) =>
                  groups[step]?.includes(issue.path[0] as keyof FormValues),
              );
        form.clearErrors();
        for (const issue of issues)
            form.setError(issue.path[0] as keyof FormValues, { message: tr(issue.message) });
        if (issues.length) {
            form.setFocus(issues[0].path[0] as keyof FormValues);
            return;
        }
        setStep(Math.min(step + 1, 3));
    }
    const values = form.watch();
    const busy = mutation.isPending || savingDraft || uploadingImages;
    return (
        <form
            noValidate
            onSubmit={(event) => {
                if (wizard && step < 3) {
                    event.preventDefault();
                    nextStep();
                } else void submit(event);
            }}
            className="space-y-6"
        >
            {wizard && (
                <div className="space-y-4 rounded-2xl border border-border bg-surface-muted p-4">
                    <nav aria-label={tr('Các bước tạo đề xuất')}>
                        <ol className="grid grid-cols-4 gap-2">
                            {stepLabels.map((label, i) => (
                                <li key={label}>
                                    <button
                                        type="button"
                                        disabled={i > step || busy}
                                        onClick={() => setStep(i)}
                                        aria-current={step === i ? 'step' : undefined}
                                        className={`w-full rounded-xl border p-3 text-left text-sm disabled:cursor-default ${step === i ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-text-secondary'}`}
                                    >
                                        <span className="mb-1 block text-xs">{i + 1} / 4</span>
                                        {tr(label)}
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </nav>
                    <h2 ref={stepHeading} tabIndex={-1} className="text-lg font-bold outline-none">
                        {tr(stepLabels[step])}
                    </h2>
                    <p className="text-sm text-text-secondary">
                        {tr(
                            'Dữ liệu được giữ khi chuyển bước. Bạn chỉ gửi đề xuất sau khi kiểm tra ở bước cuối.',
                        )}
                    </p>
                </div>
            )}

            {draftRestored && (
                <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    <div className="flex items-center gap-2">
                        <span>📝</span>
                        <span>{tr('Đã khôi phục dữ liệu từ bản nháp bạn đã nhập trước đó.')}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                        {tr('Xóa bản nháp')}
                    </button>
                </div>
            )}

            {draftMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {draftMessage}
                </div>
            )}

            <fieldset disabled={mutation.isPending || savingDraft} className="space-y-5">
                <div hidden={wizard && step !== 0} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            id="plan-organizerType"
                            label={tr('Đơn vị tổ chức *')}
                            error={form.formState.errors.organizerType?.message}
                        >
                            <Select
                                id="plan-organizerType"
                                disabled={kind === 'campaign'}
                                {...form.register('organizerType')}
                            >
                                {renderText(
                                    Object.entries(organizers).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {renderText(label)}
                                        </option>
                                    )),
                                )}
                            </Select>
                        </FormField>
                        <FormField
                            id="plan-categoryId"
                            label={tr('Danh mục *')}
                            error={form.formState.errors.categoryId?.message}
                        >
                            <Select id="plan-categoryId" {...form.register('categoryId')}>
                                <option value="">{tr('Chọn danh mục')}</option>
                                {renderText(
                                    categories.data.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {renderText(catalogLabel(c.name))}
                                        </option>
                                    )),
                                )}
                                {renderText(
                                    content &&
                                        !categories.data.some(
                                            (c) => c.id === content.categoryId,
                                        ) && (
                                            <option value={content.categoryId}>
                                                {renderText(categoryName)} {tr('(ngừng sử dụng)')}
                                            </option>
                                        ),
                                )}
                            </Select>
                        </FormField>
                    </div>

                    {renderText(
                        organizer === 'ORGANIZATION' && (
                            <div className="space-y-2">
                                <FormField
                                    id="plan-organizationId"
                                    label={tr(
                                        'Tổ chức đã xác minh (cần quyền sở hữu hoặc quản lý) *',
                                    )}
                                    error={form.formState.errors.organizationId?.message}
                                >
                                    <Select
                                        id="plan-organizationId"
                                        disabled={kind === 'campaign'}
                                        {...form.register('organizationId')}
                                    >
                                        <option value="">{tr('Chọn tổ chức')}</option>
                                        {renderText(
                                            organizations.data.map((o) => (
                                                <option
                                                    key={o.id}
                                                    value={o.id}
                                                    disabled={!o.canRepresent}
                                                >
                                                    {o.name}
                                                    {!o.canRepresent
                                                        ? ` — ${tr('Chưa có quyền đại diện')}`
                                                        : ''}
                                                </option>
                                            )),
                                        )}
                                        {renderText(
                                            content?.organizationId &&
                                                !organizations.data.some(
                                                    (o) => o.id === content.organizationId,
                                                ) && (
                                                    <option value={content.organizationId}>
                                                        {renderText(
                                                            organizationName ||
                                                                tr('Tổ chức hiện tại'),
                                                        )}
                                                    </option>
                                                ),
                                        )}
                                    </Select>
                                </FormField>
                                {kind !== 'campaign' && (
                                    <p role="status" className="text-sm text-text-secondary">
                                        {organizations.data.length === 0
                                            ? tr(
                                                  'Chưa có tổ chức nào được xác minh trong hệ thống.',
                                              )
                                            : organizations.data.some((o) => o.canRepresent)
                                              ? tr(
                                                    'Chỉ chọn được tổ chức mà bạn là chủ sở hữu hoặc người quản lý.',
                                                )
                                              : tr(
                                                    'Bạn chưa có quyền đại diện tổ chức nào đã xác minh. Hãy nhờ chủ sở hữu thêm bạn làm người quản lý hoặc chọn đơn vị tổ chức là Cá nhân.',
                                                )}
                                    </p>
                                )}
                            </div>
                        ),
                    )}

                    {renderText(input('title', tr('Tiêu đề chiến dịch *'), 'text', 200))}
                    {renderText(area('summary', tr('Tóm tắt ngắn gọn *'), 500))}
                    {renderText(
                        area('description', tr('Mô tả chi tiết kế hoạch thực hiện *'), 20000),
                    )}
                    {renderText(area('expectedImpact', tr('Giá trị hướng đến cộng đồng *'), 10000))}
                </div>
                <div hidden={wizard && step !== 1} className="space-y-5">
                    <FormField
                        id="plan-contributionMode"
                        label={tr('Hình thức đóng góp *')}
                        error={form.formState.errors.contributionMode?.message}
                    >
                        <Select
                            id="plan-contributionMode"
                            disabled={modeLocked}
                            {...form.register('contributionMode')}
                        >
                            {renderText(
                                Object.entries(modes).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {renderText(label)}
                                    </option>
                                )),
                            )}
                        </Select>
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {renderText(input('startDate', tr('Ngày bắt đầu *'), 'date'))}
                        {renderText(input('endDate', tr('Ngày kết thúc *'), 'date'))}
                    </div>

                    {renderText(
                        mode !== 'DONATION_ONLY' && (
                            <div className="space-y-4 rounded-2xl border border-border bg-surface-muted/50 p-4">
                                <h3 className="text-base font-bold text-text-primary">
                                    {tr('Chỉ tiêu tình nguyện viên')}
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {renderText(
                                        input(
                                            'targetVolunteerCount',
                                            tr('Tổng tình nguyện viên *'),
                                        ),
                                    )}
                                    {renderText(
                                        input('targetTechnicalCount', tr('Chỉ tiêu kỹ thuật')),
                                    )}
                                    {renderText(
                                        input('targetLogisticsCount', tr('Chỉ tiêu hậu cần')),
                                    )}
                                </div>
                                {input(
                                    'applicationDeadline',
                                    tr('Hạn đăng ký tình nguyện viên * (giờ địa phương)'),
                                    'datetime-local',
                                )}
                                {area(
                                    'volunteerRequirements',
                                    tr('Yêu cầu đối với tình nguyện viên *'),
                                    10000,
                                )}
                            </div>
                        ),
                    )}

                    {renderText(
                        mode !== 'VOLUNTEER_ONLY' && (
                            <section
                                aria-labelledby="fundraising-heading"
                                className="min-w-0 space-y-5 rounded-2xl border border-sky-100 bg-sky-50/40 p-4 sm:p-5"
                            >
                                <div className="space-y-1">
                                    <h3
                                        id="fundraising-heading"
                                        className="text-base font-bold text-text-primary"
                                    >
                                        {tr('Kế hoạch gây quỹ tài chính')}
                                    </h3>
                                    <p className="text-sm text-text-secondary">
                                        {tr(
                                            'Xác định mục tiêu, thời hạn và tài khoản nhận giải ngân.',
                                        )}
                                    </p>
                                </div>
                                <div className="grid min-w-0 gap-4 md:grid-cols-2">
                                    <div className="min-w-0 space-y-2">
                                        <FormField
                                            id="plan-fundraisingGoal"
                                            label={tr('Mục tiêu gây quỹ (VND) *')}
                                            error={form.formState.errors.fundraisingGoal?.message}
                                        >
                                            <Input
                                                id="plan-fundraisingGoal"
                                                inputMode="numeric"
                                                placeholder="5000000"
                                                maxLength={19}
                                                {...form.register('fundraisingGoal')}
                                            />
                                        </FormField>
                                        <p className="text-xs leading-relaxed text-text-secondary">
                                            {tr(
                                                'Nhập số tiền nguyên, không có dấu chấm hoặc dấu phẩy. Ví dụ: 5000000 = 5.000.000 VND.',
                                            )}
                                        </p>
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                        <FormField
                                            id="plan-fundraisingDeadline"
                                            label={tr('Hạn gây quỹ *')}
                                            error={
                                                form.formState.errors.fundraisingDeadline?.message
                                            }
                                        >
                                            <Input
                                                id="plan-fundraisingDeadline"
                                                type="datetime-local"
                                                step={60}
                                                className="min-w-0 max-w-full"
                                                {...form.register('fundraisingDeadline')}
                                            />
                                        </FormField>
                                        <p className="text-xs leading-relaxed text-text-secondary">
                                            {tr('Chọn ngày và giờ theo giờ địa phương của bạn.')}
                                        </p>
                                    </div>
                                </div>

                                <div className="min-w-0 space-y-4 rounded-xl border border-border bg-white p-4 sm:p-5">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-text-primary">
                                            {tr('Tài khoản nhận giải ngân')}
                                        </h4>
                                        <p className="text-xs leading-relaxed text-text-secondary">
                                            {tr(
                                                'Thông tin dùng để đối soát và giải ngân, không hiển thị công khai trên trang chiến dịch.',
                                            )}
                                        </p>
                                    </div>
                                    <FormField
                                        id="plan-donationBankName"
                                        label={tr('Ngân hàng *')}
                                        error={form.formState.errors.donationBankName?.message}
                                    >
                                        <Select
                                            id="plan-donationBankName"
                                            {...form.register('donationBankName')}
                                        >
                                            <option value="">
                                                {tr('Chọn ngân hàng nhận giải ngân')}
                                            </option>
                                            {selectedBank &&
                                                !vietnameseBanks.includes(selectedBank) && (
                                                    <option value={selectedBank}>
                                                        {selectedBank}
                                                    </option>
                                                )}
                                            {vietnameseBanks.map((bank) => (
                                                <option key={bank} value={bank}>
                                                    {bank}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormField>
                                    <div className="grid min-w-0 gap-4 md:grid-cols-2">
                                        <FormField
                                            id="plan-donationAccountNumber"
                                            label={tr('Số tài khoản *')}
                                            error={
                                                form.formState.errors.donationAccountNumber?.message
                                            }
                                        >
                                            <Input
                                                id="plan-donationAccountNumber"
                                                type="text"
                                                placeholder={tr('Nhập số tài khoản ngân hàng')}
                                                maxLength={64}
                                                autoComplete="off"
                                                spellCheck={false}
                                                {...form.register('donationAccountNumber')}
                                            />
                                        </FormField>
                                        <FormField
                                            id="plan-donationAccountHolder"
                                            label={tr('Chủ tài khoản *')}
                                            error={
                                                form.formState.errors.donationAccountHolder?.message
                                            }
                                        >
                                            <Input
                                                id="plan-donationAccountHolder"
                                                type="text"
                                                placeholder="NGUYEN VAN A"
                                                maxLength={200}
                                                autoComplete="off"
                                                spellCheck={false}
                                                {...form.register('donationAccountHolder')}
                                            />
                                        </FormField>
                                    </div>
                                    <p className="text-xs leading-relaxed text-text-secondary">
                                        {tr(
                                            'Kiểm tra số tài khoản và nhập tên chủ tài khoản đúng như thông tin tại ngân hàng.',
                                        )}
                                    </p>
                                </div>
                            </section>
                        ),
                    )}
                </div>
                <div hidden={wizard && step !== 2} className="space-y-5">
                    <PlanImages
                        existingImages={galleryQuery.data}
                        pendingImages={pendingImages}
                        setPendingImages={setPendingImages}
                        fileInputRef={fileInputRef}
                        handleFilesSelected={handleFilesSelected}
                        onDeleteImage={(id) => deleteImageMutation.mutate(id)}
                    />
                </div>
                {wizard && step === 3 && (
                    <PlanReview
                        values={values}
                        categories={categories.data}
                        organizations={organizations.data}
                        pendingImages={pendingImages}
                        onEditDetails={() => setStep(0)}
                        onEditResources={() => setStep(1)}
                    />
                )}
            </fieldset>

            {renderText(
                form.formState.errors.root && (
                    <ErrorState
                        message={form.formState.errors.root.message || tr('Chưa thể lưu')}
                    />
                ),
            )}
            {renderText(
                mutation.isSuccess && id && (
                    <p role="status" className="text-success">
                        {tr('Đã lưu thay đổi.')}
                    </p>
                ),
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
                {wizard && step > 0 && (
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setStep(step - 1)}
                    >
                        {tr('Bước trước')}
                    </Button>
                )}
                {wizard && step < 3 && (
                    <Button type="button" disabled={busy} onClick={nextStep}>
                        {tr('Tiếp tục')} →
                    </Button>
                )}
                {(!wizard || step === 3) && (
                    <Button
                        type="submit"
                        disabled={mutation.isPending || savingDraft || uploadingImages}
                    >
                        {renderText(
                            uploadingImages
                                ? tr('Đang tải ảnh lên…')
                                : mutation.isPending
                                  ? tr('Đang lưu…')
                                  : id
                                    ? tr('Lưu thay đổi')
                                    : tr('Gửi đề xuất'),
                        )}
                    </Button>
                )}
                {kind === 'proposal' && (
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={mutation.isPending || savingDraft || uploadingImages}
                        onClick={handleSaveDraft}
                    >
                        {uploadingImages
                            ? tr('Đang tải ảnh…')
                            : savingDraft
                              ? tr('Đang lưu nháp…')
                              : tr('Lưu bản nháp')}
                    </Button>
                )}
                <Link
                    to={kind === 'campaign' ? '/manage/campaigns' : '/proposals'}
                    className={`ui-button ui-button-secondary ${busy ? 'pointer-events-none opacity-50' : ''}`}
                >
                    {tr('Quay lại danh sách')}
                </Link>
            </div>
        </form>
    );
}
