import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {catalogLabel} from '../../../shared/lib/catalogLabels';
import {useEffect, useState} from 'react';
import {useForm, type FieldPath} from 'react-hook-form';
import {z} from 'zod';
import {useNavigate} from 'react-router-dom';
import {useCreateOrganization, useEditOrganization, useOrganizationTypes} from '../hooks';
import type {OrganizationDetail, OrganizationValues} from '../types';
import {apiError, errorMessage} from '../../../shared/api/errors';
import {FormField} from '../../../shared/components/FormField';
import {Input} from '../../../shared/components/Input';
import {Select} from '../../../shared/components/Select';
import {Textarea} from '../../../shared/components/Textarea';
import {Button} from '../../../shared/components/Button';
import {LoadingState} from '../../../shared/components/LoadingState';
import {ErrorState} from '../../../shared/components/ErrorState';
import {EmptyState} from '../../../shared/components/EmptyState';

const schema = z.object({name: z.string().trim().min(1, 'Nhập tên tổ chức').max(200), organizationTypeId: z.uuid('Chọn loại tổ chức'), description: z.string().max(10000)});
function values(detail?: OrganizationDetail): OrganizationValues {
    return {name: detail?.organization.name || '', organizationTypeId: detail?.organization.organizationTypeId || '', description: detail?.description || ''};
}
export function OrganizationForm({detail}: {detail?: OrganizationDetail}) {
    useLanguage();
    const catalog = useOrganizationTypes();
    const create = useCreateOrganization();
    const edit = useEditOrganization(detail?.organization.id || '');
    const navigate = useNavigate();
    const form = useForm<OrganizationValues>({defaultValues: values(detail)});
    const [version, setVersion] = useState(detail?.organization.version);
    useEffect(() => {
        if (detail && !form.formState.isDirty) {form.reset(values(detail)); setVersion(detail.organization.version);}
    }, [detail, form]);
    const submit = form.handleSubmit(async (input) => {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            for (const issue of parsed.error.issues) form.setError(String(issue.path[0]) as FieldPath<OrganizationValues>, {message: issue.message});
            return;
        }
        try {
            const saved = detail ? await edit.mutateAsync({...parsed.data, version: version!}) : await create.mutateAsync(parsed.data);
            form.reset(values(saved)); setVersion(saved.organization.version);
            if (!detail) navigate('/organizations/' + saved.organization.id);
        } catch (error) {
            form.setError('root', {message: errorMessage(error)});
            for (const field of apiError(error)?.fieldErrors || [])
                if (['name', 'organizationTypeId', 'description'].includes(field.field)) form.setError(field.field as FieldPath<OrganizationValues>, {message: field.message});
        }
    });
    if (catalog.isPending) return <LoadingState message={tr("Đang tải loại tổ chức…")}/>;
    if (catalog.isError) return <ErrorState message={errorMessage(catalog.error)} onRetry={() => void catalog.refetch()}/>;
    const pending = create.isPending || edit.isPending;
    return <form noValidate onSubmit={submit} className="space-y-4">
        <fieldset disabled={pending} className="space-y-4">
            <FormField id="organization-name" label={tr("Tên tổ chức")} error={form.formState.errors.name?.message}>
                <Input id="organization-name" maxLength={200} {...form.register('name')}/>
            </FormField>
            <FormField id="organization-type" label={tr("Loại tổ chức")} error={form.formState.errors.organizationTypeId?.message}>
                <Select id="organization-type" {...form.register('organizationTypeId')}>
                    <option value="">{tr("Chọn loại")}</option>
                    {renderText(catalog.data.items.map(type => <option key={type.id} value={type.id}>{renderText(catalogLabel(type.name))}</option>))}
                    {renderText(detail && !catalog.data.items.some(type => type.id === detail.organization.organizationTypeId) &&
                        <option value={detail.organization.organizationTypeId}>{renderText(detail.organization.organizationTypeName)}{tr("(ngừng sử dụng)")}</option>)}
                </Select>
            </FormField>
            <FormField id="organization-description" label={tr("Mô tả")} error={form.formState.errors.description?.message}>
                <Textarea id="organization-description" rows={5} maxLength={10000} {...form.register('description')}/>
            </FormField>
        </fieldset>
        {renderText(catalog.data.items.length === 0 && !detail && <EmptyState message={tr("Chưa có loại tổ chức đang sử dụng.")}/>)}
        {renderText(form.formState.errors.root && <ErrorState message={form.formState.errors.root.message || tr("Chưa thể lưu tổ chức")}/>)}
        {renderText(edit.isSuccess && <p role="status" className="text-success">{tr("Đã lưu tổ chức.")}</p>)}
        <Button type="submit" disabled={pending || (!detail && catalog.data.items.length === 0)}>{renderText(pending ? tr("Đang lưu…") : detail ? tr("Lưu tổ chức") : tr("Tạo tổ chức"))}</Button>
    </form>;
}
