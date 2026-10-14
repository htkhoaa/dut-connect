import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {catalogLabel} from '../../../shared/lib/catalogLabels';
﻿import {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useSkills, useUpdateSkills} from '../hooks';
import type {Profile, SkillsValues} from '../types';
import {errorMessage} from '../../../shared/api/errors';
import {Card} from '../../../shared/components/Card';
import {Button} from '../../../shared/components/Button';
import {LoadingState} from '../../../shared/components/LoadingState';
import {ErrorState} from '../../../shared/components/ErrorState';
import {EmptyState} from '../../../shared/components/EmptyState';

const schema = z.object({skillIds: z.array(z.uuid()).max(100)});

export function SkillEditor({profile}: { profile: Profile }) {
    useLanguage();
    const catalog = useSkills();
    const update = useUpdateSkills();
    const form = useForm<SkillsValues>({defaultValues: {skillIds: profile.skills.map((skill) => skill.id)}});
    const [expectedVersion, setExpectedVersion] = useState(profile.version);
    useEffect(() => {
        if (!form.formState.isDirty) {
            form.reset({skillIds: profile.skills.map((skill) => skill.id)});
            setExpectedVersion(profile.version);
        }
    }, [profile, form]);
    const submit = form.handleSubmit(async (values) => {
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
            form.setError('skillIds', {message: tr("Chọn tối đa 100 kỹ năng hợp lệ.")});
            return;
        }
        try {
            const saved = await update.mutateAsync({...parsed.data, version: expectedVersion});
            form.reset({skillIds: saved.skills.map((skill) => skill.id)});
            setExpectedVersion(saved.version);
        } catch (error) {
            form.setError('root', {message: errorMessage(error)});
        }
    });
    return <Card><h2 className="mb-5 text-xl font-semibold">{tr("Kỹ năng của bạn")}</h2>
        {renderText(catalog.isPending ? <LoadingState message={tr("Đang tải kỹ năng…")}/> : catalog.isError ?
            <ErrorState message={errorMessage(catalog.error)} onRetry={() => void catalog.refetch()}/> :
            <form noValidate onSubmit={submit} className="space-y-5">
                <fieldset disabled={update.isPending} className="space-y-3">
                    <legend className="mb-3 text-sm text-text-secondary">{tr("Chọn những kỹ năng bạn muốn đóng góp.")}</legend>
                    {renderText(catalog.data.items.length === 0 && <EmptyState message={tr("Chưa có kỹ năng để chọn.")}/>)}
                    {renderText(catalog.data.items.map((skill) => <label key={skill.id}
                                                              className="flex items-center gap-3 text-sm">
                        <input type="checkbox" value={skill.id} {...form.register('skillIds')}/>{renderText(catalogLabel(skill.name))}
                    </label>))}
                </fieldset>
                {renderText(form.formState.errors.skillIds && <ErrorState message={form.formState.errors.skillIds.message || tr("Kỹ năng không hợp lệ")}/>)}
                {renderText(form.formState.errors.root && <ErrorState message={form.formState.errors.root.message || tr("Chưa thể lưu kỹ năng")}/>)}
                {renderText(update.isSuccess && <p role="status" className="text-success">{tr("Đã lưu kỹ năng.")}</p>)}
                <Button type="submit"
                        disabled={update.isPending}>{renderText(update.isPending ? tr("Đang lưu…") : tr("Lưu kỹ năng"))}</Button>
            </form>)}
    </Card>;
}


