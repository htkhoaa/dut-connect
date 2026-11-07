import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useEffect, useState} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {z} from 'zod';
import {Link, useSearchParams} from 'react-router-dom';
import {useCampaigns, useCategoryCatalog, useOrganizationOptions} from './hooks';
import type {CampaignFilters} from './types';
import {campaignStatuses, modes} from './presentation';
import {CampaignCard} from './components/CampaignCard';
import {catalogLabel} from '../../shared/lib/catalogLabels';
import {errorMessage} from '../../shared/api/errors';
import {Input} from '../../shared/components/Input';
import {FilterDropdown} from '../../shared/components/FilterDropdown';
import {Button} from '../../shared/components/Button';
import {Icon} from '../../shared/components/Icon';
import {PageHeader} from '../../shared/components/PageHeader';
import {Pagination} from '../../shared/components/Pagination';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import {ErrorState} from '../../shared/components/ErrorState';
import {useFundraisingProgress} from '../finance/hooks';
import {useDebouncedValue} from '../../shared/hooks/useDebouncedValue';
import {ActivityGallery} from './ActivityGallery';
const initial: CampaignFilters = {page: 0, q: '', status: '', categoryId: '', organizationId: '', contributionMode: '', sort: 'newest'};
export function CampaignListPage({scope = 'public'}: {scope?: 'public' | 'mine' | 'admin'}) {
    useLanguage();
    const [params] = useSearchParams();
    const [filters, setFilters] = useState<CampaignFilters>(() => ({...initial, organizationId: params.get('organizationId') || '', categoryId: params.get('categoryId') || ''}));
    const form = useForm<{q: string}>({defaultValues: {q: ''}});
    const query = useDebouncedValue((useWatch({control: form.control, name: 'q'}) || '').trim());
    useEffect(() => {
        const parsed = z.string().max(200).safeParse(query);
        if (parsed.success) setFilters(f => f.q === parsed.data ? f : {...f, q: parsed.data, page: 0});
    }, [query]);
    const list = useCampaigns(scope, filters);
    const categories = useCategoryCatalog();
    const organizations = useOrganizationOptions('public');
    const progress = useFundraisingProgress((list.data?.items || []).filter(c => c.contributionMode !== 'VOLUNTEER_ONLY').map(c => c.id));
    function change<K extends keyof CampaignFilters>(key: K, value: CampaignFilters[K]) {setFilters(f => ({...f, page: 0, [key]: value}));}
    const categoryOptions = [
        {value: '', label: tr("Tất cả lĩnh vực")},
        ...(categories.data?.map(c => ({value: c.id, label: catalogLabel(c.name)})) || [])
    ];
    const orgOptions = [
        {value: '', label: tr("Tất cả tổ chức")},
        ...(organizations.data?.map(o => ({value: o.id, label: o.name})) || [])
    ];
    const modeOptions = [
        {value: '', label: tr("Tất cả hình thức")},
        ...Object.entries(modes).map(([value, label]) => ({value, label}))
    ];
    const sortOptions = [
        {value: 'newest', label: tr("Mới nhất")},
        {value: 'startDate', label: tr("Ngày bắt đầu")}
    ];

    return <div className="space-y-7">
        <PageHeader eyebrow={scope === 'public' ? tr("KHÁM PHÁ & ĐÓNG GÓP") : tr("KHÔNG GIAN QUẢN LÝ")} title={scope === 'mine' ? tr("Chiến dịch của bạn") : scope === 'admin' ? tr("Quản lý chiến dịch") : tr("Tìm nơi bạn muốn góp sức.")} description={scope === 'public' ? tr("Dành thời gian cho điều bạn quan tâm. Khám phá những chiến dịch cùng cộng đồng sinh viên DUT.") : tr("Theo dõi chiến dịch, điều phối hoạt động và quản lý những đóng góp.")} actions={scope === 'mine' ? <Link to="/proposals/new" className="button-link"><Icon name="file" size={17}/>{tr("Đề xuất chiến dịch")}</Link> : undefined}/>
        <div className="filter-panel space-y-4">
            <form className="flex gap-3" onSubmit={form.handleSubmit(v => {const result = z.string().trim().max(200).safeParse(v.q); if (result.success) change('q', result.data); else form.setError('q', {message: tr("Tìm kiếm tối đa 200 ký tự")});})}>
                <div className="relative min-w-0 flex-1"><Icon name="search" className="pointer-events-none absolute left-3.5 top-3.5 text-text-secondary"/><Input className="pl-11!" aria-label={tr("Tìm kiếm chiến dịch")} placeholder={tr("Tên chiến dịch, hoạt động bạn quan tâm…")} maxLength={200} {...form.register('q')}/></div><Button type="submit">{tr("Tìm kiếm")}</Button>
            </form>

            {renderText(form.formState.errors.q && <p role="alert" className="text-sm text-danger">{renderText(form.formState.errors.q.message)}</p>)}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="filter-label">
                    <span>{tr("Lĩnh vực")}</span>
                    <FilterDropdown value={filters.categoryId} onChange={val => change('categoryId', val)} options={categoryOptions} />
                </div>
                <div className="filter-label">
                    <span>{tr("Tổ chức")}</span>
                    <FilterDropdown value={filters.organizationId} onChange={val => change('organizationId', val)} options={orgOptions} />
                </div>
                <div className="filter-label">
                    <span>{tr("Cách đóng góp")}</span>
                    <FilterDropdown value={filters.contributionMode} onChange={val => change('contributionMode', val as CampaignFilters['contributionMode'])} options={modeOptions} />
                </div>
                <div className="filter-label">
                    <span>{tr("Sắp xếp")}</span>
                    <FilterDropdown value={filters.sort} onChange={val => change('sort', val as CampaignFilters['sort'])} options={sortOptions} />
                </div>
            </div>
        </div>
        {renderText((categories.isError || organizations.isError) && <ErrorState message={tr("Chưa tải được bộ lọc.")} onRetry={() => {void categories.refetch(); void organizations.refetch();}}/>)}
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="status-tabs" aria-label={tr("Trạng thái chiến dịch")}><button className={filters.status === '' ? 'is-active' : ''} onClick={() => change('status', '')}>{tr("Tất cả")}</button>{renderText(Object.entries(campaignStatuses).filter(([key]) => key !== 'DRAFT').map(([value, p]) => <button key={value} className={filters.status === value ? 'is-active' : ''} onClick={() => change('status', value as CampaignFilters['status'])}>{renderText(p.label)}</button>))}</div>{renderText(list.data && <p className="text-xs text-text-secondary">{renderText(list.data.totalElements)} {tr("chiến dịch")}</p>)}</div>
        {renderText(list.isPending ? <LoadingState/> : list.isError ? <ErrorState message={errorMessage(list.error)} onRetry={() => void list.refetch()}/> : <>
            {list.data.items.length === 0 ? <EmptyState message={tr("Chưa tìm thấy chiến dịch phù hợp. Thử thay đổi bộ lọc nhé.")}/> : <div className="campaign-grid">{renderText(list.data.items.map(c => <CampaignCard key={c.id} campaign={c} managed={scope !== 'public'} progress={progress.data?.find(p => p.campaignId === c.id)} financialPending={progress.isPending} financialError={progress.isError} onRetry={() => void progress.refetch()}/>))}</div>}
            <Pagination {...list.data} onPageChange={page => setFilters(f => ({...f, page}))}/>
        </>)}
        {scope === 'public' && (!filters.status || filters.status === 'COMPLETED') && !filters.organizationId && (!filters.contributionMode || filters.contributionMode === 'VOLUNTEER_ONLY') &&
            <ActivityGallery q={filters.q} category={categories.data?.find(c => c.id === filters.categoryId)?.slug || ''}/>}
    </div>;
}
