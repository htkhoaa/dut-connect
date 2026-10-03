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
            form.setError('skillIds', {message: 'Chọn tối đa 100 kỹ năng hợp lệ.'});
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
    return <Card><h2 className="mb-5 text-xl font-semibold">Kỹ năng của bạn</h2>
        {catalog.isPending ? <LoadingState message="Đang tải kỹ năng…"/> : catalog.isError ?
            <ErrorState message={errorMessage(catalog.error)} onRetry={() => void catalog.refetch()}/> :
            <form noValidate onSubmit={submit} className="space-y-5">
                <fieldset disabled={update.isPending} className="space-y-3">
                    <legend className="mb-3 text-sm text-text-secondary">Chọn những kỹ năng bạn muốn đóng góp.
                    </legend>
                    {catalog.data.items.length === 0 && <EmptyState message="Chưa có kỹ năng để chọn."/>}
                    {catalog.data.items.map((skill) => <label key={skill.id}
                                                              className="flex items-center gap-3 text-sm">
                        <input type="checkbox" value={skill.id} {...form.register('skillIds')}/>{catalogLabel(skill.name)}
                    </label>)}
                </fieldset>
                {form.formState.errors.skillIds && <ErrorState message={form.formState.errors.skillIds.message || 'Kỹ năng không hợp lệ'}/>}
                {form.formState.errors.root && <ErrorState message={form.formState.errors.root.message || 'Chưa thể lưu kỹ năng'}/>}
                {update.isSuccess && <p role="status" className="text-success">Đã lưu kỹ năng.</p>}
                <Button type="submit"
                        disabled={update.isPending}>{update.isPending ? 'Đang lưu…' : 'Lưu kỹ năng'}</Button>
            </form>}
    </Card>;
}


