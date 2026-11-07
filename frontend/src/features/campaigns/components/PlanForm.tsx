import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {catalogLabel} from '../../../shared/lib/catalogLabels';
import {useEffect, useState, useRef} from 'react';
import {useForm, type FieldPath} from 'react-hook-form';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {z} from 'zod';
import {useNavigate} from 'react-router-dom';
import type {Content, FormValues} from '../types';
import {useCategoryCatalog, useOrganizationOptions, useEditCampaign} from '../hooks';
import {useSaveProposal} from '../../proposals/hooks';
import {modes, organizers} from '../presentation';
import {apiClient} from '../../../shared/api/client';
import {apiError, errorMessage} from '../../../shared/api/errors';
import {FormField} from '../../../shared/components/FormField';
import {Input} from '../../../shared/components/Input';
import {Select} from '../../../shared/components/Select';
import {Textarea} from '../../../shared/components/Textarea';
import {Button} from '../../../shared/components/Button';
import {ErrorState} from '../../../shared/components/ErrorState';
import {LoadingState} from '../../../shared/components/LoadingState';

export interface PendingPlanImage {
    id: string;
    file: File;
    previewUrl: string;
    caption: string;
}

const DRAFT_STORAGE_KEY = 'dut_connect_proposal_draft';

const optionalMoney = z.string().trim().refine(v => !v || /^\d{1,19}$/.test(v), 'Nhập số tiền VND nguyên, tối đa 19 chữ số');
const optionalCount = z.string().trim().refine(v => !v || (/^\d+$/.test(v) && Number(v) <= 2147483647), 'Nhập số nguyên không âm');

const schema = z.object({
    organizerType: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
    organizationId: z.string(),
    categoryId: z.string().min(1, 'Chọn danh mục'),
    title: z.string().trim().min(1, 'Tiêu đề là bắt buộc').max(200),
    summary: z.string().trim().min(1, 'Tóm tắt là bắt buộc').max(500),
    description: z.string().trim().min(1, 'Mô tả chi tiết là bắt buộc').max(20000),
    expectedImpact: z.string().trim().min(1, 'Giá trị hướng đến là bắt buộc').max(10000),
    contributionMode: z.enum(['VOLUNTEER_ONLY', 'DONATION_ONLY', 'HYBRID']),
    startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
    endDate: z.string().min(1, 'Chọn ngày kết thúc'),
    applicationDeadline: z.string(),
    fundraisingDeadline: z.string(),
    targetVolunteerCount: optionalCount,
    targetTechnicalCount: optionalCount,
    targetLogisticsCount: optionalCount,
    volunteerRequirements: z.string().max(10000),
    fundraisingGoal: optionalMoney,
    institutionalFunding: optionalMoney,
    sponsorName: z.string().max(200),
    sponsorFunding: optionalMoney,
    estimatedBudget: optionalMoney,
    donationBankName: z.string().max(120),
    donationAccountNumber: z.string().max(64),
    donationAccountHolder: z.string().max(200)
}).superRefine((v, ctx) => {
    if (!z.uuid().safeParse(v.categoryId).success) {
        ctx.addIssue({code: 'custom', path: ['categoryId'], message: tr("Chọn danh mục hợp lệ")});
    }
    if (v.endDate < v.startDate) {
        ctx.addIssue({code: 'custom', path: ['endDate'], message: tr("Ngày kết thúc không được trước ngày bắt đầu")});
    }
    if (v.organizerType === 'ORGANIZATION' && !z.uuid().safeParse(v.organizationId).success) {
        ctx.addIssue({code: 'custom', path: ['organizationId'], message: tr("Chọn tổ chức đã xác minh")});
    }
    // Volunteer requirements check
    if (v.contributionMode !== 'DONATION_ONLY') {
        if (!v.targetVolunteerCount || Number(v.targetVolunteerCount) < 1) {
            ctx.addIssue({code: 'custom', path: ['targetVolunteerCount'], message: tr("Cần nhập chỉ tiêu ít nhất một tình nguyện viên")});
        }
        if (!v.applicationDeadline || Number.isNaN(new Date(v.applicationDeadline).getTime())) {
            ctx.addIssue({code: 'custom', path: ['applicationDeadline'], message: tr("Hạn đăng ký là bắt buộc")});
        }
        if (!v.volunteerRequirements.trim()) {
            ctx.addIssue({code: 'custom', path: ['volunteerRequirements'], message: tr("Yêu cầu tình nguyện viên là bắt buộc")});
        }
    }
    // Fundraising requirements check
    if (v.contributionMode !== 'VOLUNTEER_ONLY') {
        if (!v.fundraisingGoal || !/^\d+$/.test(v.fundraisingGoal) || BigInt(v.fundraisingGoal) === 0n) {
            ctx.addIssue({code: 'custom', path: ['fundraisingGoal'], message: tr("Mục tiêu gây quỹ phải lớn hơn 0")});
        }
        if (!v.fundraisingDeadline || Number.isNaN(new Date(v.fundraisingDeadline).getTime())) {
            ctx.addIssue({code: 'custom', path: ['fundraisingDeadline'], message: tr("Hạn gây quỹ là bắt buộc")});
        }
        for (const name of ['donationBankName', 'donationAccountNumber', 'donationAccountHolder'] as const) {
            if (!v[name].trim()) {
                ctx.addIssue({code: 'custom', path: [name], message: tr("Thông tin tài khoản nhận ủng hộ là bắt buộc")});
            }
        }
    }
    for (const name of ['applicationDeadline', 'fundraisingDeadline'] as const) {
        if (v[name] && Number.isNaN(new Date(v[name]).getTime())) {
            ctx.addIssue({code: 'custom', path: [name], message: tr("Nhập ngày và giờ hợp lệ")});
        }
    }
});

function localTime(value: string | null | undefined) {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 23);
}

function defaults(content?: Content): FormValues {
    return {
        organizerType: content?.organizerType || 'INDIVIDUAL',
        organizationId: content?.organizationId || '',
        categoryId: content?.categoryId || '',
        title: content?.title || '',
        summary: content?.summary || '',
        description: content?.description || '',
        expectedImpact: content?.expectedImpact || '',
        contributionMode: content?.contributionMode || 'VOLUNTEER_ONLY',
        startDate: content?.startDate || '',
        endDate: content?.endDate || '',
        applicationDeadline: localTime(content?.applicationDeadline),
        fundraisingDeadline: localTime(content?.fundraisingDeadline),
        targetVolunteerCount: content?.targetVolunteerCount?.toString() || '',
        targetTechnicalCount: content?.targetTechnicalCount?.toString() || '',
        targetLogisticsCount: content?.targetLogisticsCount?.toString() || '',
        volunteerRequirements: content?.volunteerRequirements || '',
        fundraisingGoal: content?.fundraisingGoal || '',
        institutionalFunding: '0',
        sponsorName: '',
        sponsorFunding: '0',
        estimatedBudget: '',
        donationBankName: content?.donationBankName || '',
        donationAccountNumber: content?.donationAccountNumber || '',
        donationAccountHolder: content?.donationAccountHolder || ''
    };
}

function instant(value: string, original?: string | null) {
    const date = new Date(value);
    return original && date.getTime() === new Date(original).getTime() ? original : date.toISOString();
}

function payload(v: FormValues, original?: Content): Content {
    const donations = v.contributionMode !== 'VOLUNTEER_ONLY';
    const volunteers = v.contributionMode !== 'DONATION_ONLY';
    return {
        ...v,
        organizerType: v.organizerType as Content['organizerType'],
        contributionMode: v.contributionMode as Content['contributionMode'],
        organizationId: v.organizerType === 'ORGANIZATION' ? v.organizationId : null,
        expectedImpact: v.expectedImpact.trim() || null,
        targetVolunteerCount: volunteers && v.targetVolunteerCount ? Number(v.targetVolunteerCount) : null,
        targetTechnicalCount: volunteers && v.targetTechnicalCount ? Number(v.targetTechnicalCount) : null,
        targetLogisticsCount: volunteers && v.targetLogisticsCount ? Number(v.targetLogisticsCount) : null,
        applicationDeadline: volunteers && v.applicationDeadline ? instant(v.applicationDeadline, original?.applicationDeadline) : null,
        fundraisingDeadline: donations && v.fundraisingDeadline ? instant(v.fundraisingDeadline, original?.fundraisingDeadline) : null,
        fundraisingGoal: donations ? v.fundraisingGoal || null : null,
        volunteerRequirements: volunteers ? v.volunteerRequirements.trim() || null : null,
        institutionalFunding: '0',
        sponsorFunding: '0',
        sponsorName: null,
        estimatedBudget: null,
        donationBankName: donations ? v.donationBankName.trim() || null : null,
        donationAccountNumber: donations ? v.donationAccountNumber.trim() || null : null,
        donationAccountHolder: donations ? v.donationAccountHolder.trim() || null : null
    };
}

export function PlanForm({
    kind = 'proposal',
    id,
    content,
    version: initialVersion,
    categoryName,
    organizationName,
    modeLocked = false
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
    const qc = useQueryClient();
    const categories = useCategoryCatalog();
    const organizations = useOrganizationOptions('mine');
    const proposal = useSaveProposal(kind === 'proposal' ? id : undefined);
    const campaign = useEditCampaign(id || '');
    const form = useForm<FormValues>({defaultValues: defaults(content)});
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

    // Fetch existing gallery images for proposal or campaign if id exists
    const galleryQuery = useQuery({
        queryKey: [kind === 'campaign' ? 'campaign-gallery' : 'proposal-gallery', id],
        queryFn: async () => {
            if (!id) return [];
            const endpoint = kind === 'campaign' ? `/campaigns/${id}/gallery` : `/proposals/${id}/gallery`;
            return (await apiClient.get<Array<{id: string; caption: string; imageUrl: string}>>(endpoint)).data;
        },
        enabled: !!id,
    });

    const deleteImageMutation = useMutation({
        mutationFn: async (imageId: string) => {
            await apiClient.delete(`/campaigns/gallery/${imageId}`);
        },
        onSuccess: () => {
            void qc.invalidateQueries({queryKey: [kind === 'campaign' ? 'campaign-gallery' : 'proposal-gallery', id]});
        }
    });

    const uploadPendingFiles = async (targetId: string) => {
        if (pendingImages.length === 0) return;
        setUploadingImages(true);
        try {
            const endpoint = kind === 'campaign' ? `/campaigns/${targetId}/gallery` : `/proposals/${targetId}/gallery`;
            for (const img of pendingImages) {
                const formData = new FormData();
                formData.append('file', img.file);
                if (img.caption) formData.append('caption', img.caption);
                await apiClient.post(endpoint, formData, {
                    headers: {'Content-Type': 'multipart/form-data'},
                });
            }
            setPendingImages([]);
            void qc.invalidateQueries({queryKey: [kind === 'campaign' ? 'campaign-gallery' : 'proposal-gallery', targetId]});
            void qc.invalidateQueries({queryKey: ['campaign-gallery', targetId]});
        } catch (e) {
            console.error("Failed uploading images:", e);
        } finally {
            setUploadingImages(false);
        }
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const newItems: PendingPlanImage[] = [];
        for (const f of files) {
            if (f.size > 5 * 1024 * 1024) {
                alert(tr(`Ảnh "${f.name}" vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn 5MB.`));
                continue;
            }
            newItems.push({
                id: 'pend-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                file: f,
                previewUrl: URL.createObjectURL(f),
                caption: '',
            });
        }
        setPendingImages(prev => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Restore draft from localStorage for new proposals
    useEffect(() => {
        if (kind === 'proposal' && !id && !content) {
            try {
                const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
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
    }, [kind, id, content, form]);

    useEffect(() => {
        if (content && !form.formState.isDirty) {
            form.reset(defaults(content));
            setVersion(initialVersion);
        }
    }, [content, initialVersion, form]);

    const handleSaveDraft = async () => {
        const input = form.getValues();
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(input));
        } catch {
            // ignore
        }
        setSavingDraft(true);
        setDraftMessage(null);
        try {
            // Attempt to save as draft to backend if possible
            if (kind === 'proposal') {
                const parsedContent = payload(input, content);
                const result = await proposal.mutateAsync({content: parsedContent, version, asDraft: true});
                const targetId = id || result.id;
                if (pendingImages.length > 0) {
                    await uploadPendingFiles(targetId);
                }
                setVersion(result.version);
                setDraftMessage(tr("Đã lưu bản nháp vào hệ thống và trình duyệt."));
                if (!id) {
                    navigate('/proposals/' + result.id);
                }
            } else {
                setDraftMessage(tr("Đã lưu bản nháp vào trình duyệt."));
            }
        } catch {
            // If backend rejects incomplete draft, local draft is safely stored
            setDraftMessage(tr("Đã lưu bản nháp vào trình duyệt. Dữ liệu của bạn được bảo toàn."));
        } finally {
            setSavingDraft(false);
        }
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        form.reset(defaults());
        setDraftRestored(false);
        setDraftMessage(null);
    };

    const submit = form.handleSubmit(async input => {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                form.setError(issue.path[0] as FieldPath<FormValues>, {message: issue.message});
            }
            return;
        }
        try {
            const result = await mutation.mutateAsync({content: payload(parsed.data, content), version, asDraft: false});
            const targetId = id || result.id;
            if (pendingImages.length > 0) {
                await uploadPendingFiles(targetId);
            }
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            setDraftRestored(false);
            form.reset(defaults(result.content));
            setVersion(result.version);
            if (!id) navigate('/proposals/' + result.id);
        } catch (error) {
            form.setError('root', {message: errorMessage(error)});
            for (const field of apiError(error)?.fieldErrors || []) {
                const name = field.field.replace(/^content\./, '') as keyof FormValues;
                if (name in input) form.setError(name, {message: field.message});
            }
        }
    });

    if (categories.isPending || organizations.isPending) return <LoadingState message={tr("Đang tải thông tin đề xuất…")} />;
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
            <FormField id={'plan-' + name} label={label} error={form.formState.errors[name]?.message}>
                <Input
                    id={'plan-' + name}
                    type={type}
                    step={type === 'datetime-local' ? '0.001' : undefined}
                    maxLength={max}
                    {...form.register(name)}
                />
            </FormField>
        );
    }

    function area(name: keyof FormValues, label: string, max: number) {
        return (
            <FormField id={'plan-' + name} label={label} error={form.formState.errors[name]?.message}>
                <Textarea id={'plan-' + name} rows={4} maxLength={max} {...form.register(name)} />
            </FormField>
        );
    }

    return (
        <form noValidate onSubmit={submit} className="space-y-6">
            {draftRestored && (
                <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    <div className="flex items-center gap-2">
                        <span>📝</span>
                        <span>{tr("Đã khôi phục dữ liệu từ bản nháp bạn đã nhập trước đó.")}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                        {tr("Xóa bản nháp")}
                    </button>
                </div>
            )}

            {draftMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {draftMessage}
                </div>
            )}

            <fieldset disabled={mutation.isPending || savingDraft} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="plan-organizerType" label={tr("Đơn vị tổ chức *")} error={form.formState.errors.organizerType?.message}>
                        <Select id="plan-organizerType" disabled={kind === 'campaign'} {...form.register('organizerType')}>
                            {renderText(
                                Object.entries(organizers).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {renderText(label)}
                                    </option>
                                ))
                            )}
                        </Select>
                    </FormField>
                    <FormField id="plan-categoryId" label={tr("Danh mục *")} error={form.formState.errors.categoryId?.message}>
                        <Select id="plan-categoryId" {...form.register('categoryId')}>
                            <option value="">{tr("Chọn danh mục")}</option>
                            {renderText(
                                categories.data.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {renderText(catalogLabel(c.name))}
                                    </option>
                                ))
                            )}
                            {renderText(
                                content && !categories.data.some(c => c.id === content.categoryId) && (
                                    <option value={content.categoryId}>
                                        {renderText(categoryName)} {tr("(ngừng sử dụng)")}
                                    </option>
                                )
                            )}
                        </Select>
                    </FormField>
                </div>

                {renderText(
                    organizer === 'ORGANIZATION' && (
                        <FormField
                            id="plan-organizationId"
                            label={tr("Tổ chức đã xác minh (cần quyền sở hữu hoặc quản lý) *")}
                            error={form.formState.errors.organizationId?.message}
                        >
                            <Select id="plan-organizationId" disabled={kind === 'campaign'} {...form.register('organizationId')}>
                                <option value="">{tr("Chọn tổ chức")}</option>
                                {renderText(
                                    organizations.data.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {renderText(o.name)}
                                        </option>
                                    ))
                                )}
                                {renderText(
                                    content?.organizationId && !organizations.data.some(o => o.id === content.organizationId) && (
                                        <option value={content.organizationId}>
                                            {renderText(organizationName || tr("Tổ chức hiện tại"))}
                                        </option>
                                    )
                                )}
                            </Select>
                        </FormField>
                    )
                )}

                {renderText(input('title', tr("Tiêu đề chiến dịch *"), 'text', 200))}
                {renderText(area('summary', tr("Tóm tắt ngắn gọn *"), 500))}
                {renderText(area('description', tr("Mô tả chi tiết kế hoạch thực hiện *"), 20000))}
                {renderText(area('expectedImpact', tr("Giá trị hướng đến cộng đồng *"), 10000))}

                <FormField id="plan-contributionMode" label={tr("Hình thức đóng góp *")} error={form.formState.errors.contributionMode?.message}>
                    <Select id="plan-contributionMode" disabled={modeLocked} {...form.register('contributionMode')}>
                        {renderText(
                            Object.entries(modes).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {renderText(label)}
                                </option>
                            ))
                        )}
                    </Select>
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                    {renderText(input('startDate', tr("Ngày bắt đầu *"), 'date'))}
                    {renderText(input('endDate', tr("Ngày kết thúc *"), 'date'))}
                </div>

                {renderText(
                    mode !== 'DONATION_ONLY' && (
                        <div className="space-y-4 rounded-2xl border border-border bg-surface-muted/50 p-4">
                            <h3 className="text-base font-bold text-text-primary">{tr("Chỉ tiêu tình nguyện viên")}</h3>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {renderText(input('targetVolunteerCount', tr("Tổng tình nguyện viên *")))}
                                {renderText(input('targetTechnicalCount', tr("Chỉ tiêu kỹ thuật")))}
                                {renderText(input('targetLogisticsCount', tr("Chỉ tiêu hậu cần")))}
                            </div>
                            {input('applicationDeadline', tr("Hạn đăng ký tình nguyện viên * (giờ địa phương)"), 'datetime-local')}
                            {area('volunteerRequirements', tr("Yêu cầu đối với tình nguyện viên *"), 10000)}
                        </div>
                    )
                )}

                {renderText(
                    mode !== 'VOLUNTEER_ONLY' && (
                        <div className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/40 p-4">
                            <h3 className="text-base font-bold text-text-primary">{tr("Kế hoạch gây quỹ tài chính")}</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {input('fundraisingGoal', tr("Mục tiêu gây quỹ (VND) *"))}
                                {input('fundraisingDeadline', tr("Hạn gây quỹ * (giờ địa phương)"), 'datetime-local')}
                            </div>

                            <div className="rounded-xl border border-primary-muted/50 bg-white p-4">
                                <h4 className="text-sm font-bold text-text-primary">{tr("Tài khoản nhận giải ngân")}</h4>
                                <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                                    {tr("Thông tin bảo mật: Chỉ Quản trị viên hệ thống có thể xem trong trang quản trị để đối soát và giải ngân (không hiển thị công khai trên trang chiến dịch).")}
                                </p>
                                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                                    {input('donationBankName', tr("Ngân hàng *"), 'text', 120)}
                                    {input('donationAccountNumber', tr("Số tài khoản *"), 'text', 64)}
                                    {input('donationAccountHolder', tr("Chủ tài khoản *"), 'text', 200)}
                                </div>
                            </div>
                        </div>
                    )
                )}

                {/* Campaign Image Upload Section */}
                <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div>
                            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                                <span>📸</span>
                                <span>{tr("Hình ảnh chiến dịch (Ảnh bìa & Thư viện ảnh)")}</span>
                            </h3>
                            <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                                {tr("Tải lên hình ảnh truyền thông hoặc kế hoạch thực hiện chiến dịch (tối đa 5MB/ảnh, PNG, JPG, WEBP).")}
                            </p>
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleFilesSelected}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                className="text-xs font-semibold px-3 py-2 rounded-xl"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                + {tr("Chọn ảnh tải lên")}
                            </Button>
                        </div>
                    </div>

                    {/* Preview grid */}
                    {((galleryQuery.data && galleryQuery.data.length > 0) || pendingImages.length > 0) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                            {/* Existing images */}
                            {galleryQuery.data?.map(img => (
                                <div key={img.id} className="relative group aspect-4/3 rounded-xl overflow-hidden border border-border bg-surface-muted">
                                    <img src={img.imageUrl} alt={img.caption || ''} className="w-full h-full object-cover" />
                                    {img.caption && (
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[10px] text-white truncate">
                                            {img.caption}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirm(tr("Xóa ảnh này khỏi thư viện?"))) {
                                                deleteImageMutation.mutate(img.id);
                                            }
                                        }}
                                        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-danger text-xs transition-colors"
                                        title={tr("Xóa ảnh")}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {/* Pending newly picked images */}
                            {pendingImages.map(item => (
                                <div key={item.id} className="relative group aspect-4/3 rounded-xl overflow-hidden border-2 border-dashed border-primary/50 bg-primary-light/20 flex flex-col justify-between">
                                    <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <span className="absolute top-1.5 left-1.5 rounded-md bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 shadow-2xs">
                                        {tr("Mới")}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            URL.revokeObjectURL(item.previewUrl);
                                            setPendingImages(prev => prev.filter(p => p.id !== item.id));
                                        }}
                                        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/70 text-white hover:bg-danger text-xs transition-colors"
                                        title={tr("Hủy chọn ảnh")}
                                    >
                                        ✕
                                    </button>
                                    <div className="absolute inset-x-0 bottom-0 bg-white/95 p-1.5 border-t border-border">
                                        <input
                                            type="text"
                                            placeholder={tr("Chú thích ảnh (tùy chọn)…")}
                                            value={item.caption}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPendingImages(prev => prev.map(p => p.id === item.id ? {...p, caption: val} : p));
                                            }}
                                            className="w-full text-[11px] rounded bg-surface-muted px-1.5 py-0.5 border border-border focus:outline-primary"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/80 bg-surface-muted/30 py-6 px-4 text-center cursor-pointer hover:bg-surface-muted/60 transition-colors"
                        >
                            <span className="text-2xl">🖼️</span>
                            <p className="text-xs font-semibold text-text-primary">
                                {tr("Chưa có ảnh nào được chọn")}
                            </p>
                            <p className="text-[11px] text-text-secondary">
                                {tr("Nhấn vào đây để tải ảnh bìa hoặc ảnh hoạt động minh họa cho chiến dịch")}
                            </p>
                        </div>
                    )}
                </div>
            </fieldset>

            {renderText(form.formState.errors.root && <ErrorState message={form.formState.errors.root.message || tr("Chưa thể lưu")} />)}
            {renderText(mutation.isSuccess && id && <p role="status" className="text-success">{tr("Đã lưu thay đổi.")}</p>)}

            <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" disabled={mutation.isPending || savingDraft || uploadingImages}>
                    {renderText(uploadingImages ? tr("Đang tải ảnh lên…") : mutation.isPending ? tr("Đang lưu…") : id ? tr("Lưu thay đổi") : tr("Gửi đề xuất"))}
                </Button>
                {kind === 'proposal' && (
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={mutation.isPending || savingDraft || uploadingImages}
                        onClick={handleSaveDraft}
                    >
                        {uploadingImages ? tr("Đang tải ảnh…") : savingDraft ? tr("Đang lưu nháp…") : tr("Lưu bản nháp")}
                    </Button>
                )}
            </div>
        </form>
    );
}
