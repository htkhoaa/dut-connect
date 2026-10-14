import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
﻿import {useEffect, useState} from 'react';
import {useForm, type FieldPath} from 'react-hook-form';
import {z} from 'zod';
import {useUpdateProfile} from '../hooks';
import type {Profile, ProfileValues} from '../types';
import {apiError, errorMessage} from '../../../shared/api/errors';
import {Card} from '../../../shared/components/Card';
import {Button} from '../../../shared/components/Button';
import {FormField} from '../../../shared/components/FormField';
import {Input} from '../../../shared/components/Input';
import {Select} from '../../../shared/components/Select';
import {Textarea} from '../../../shared/components/Textarea';
import {faculties} from '../../../shared/lib/faculties';
const schema = z.object({
    fullName: z.string().trim().min(1).max(150), faculty: z.string().trim().min(1).max(150),
    bio: z.string().max(500), preferredTrack: z.enum(['', 'TECHNICAL', 'LOGISTICS']), experience: z.string().max(10000),
});

export function ProfileEditor({profile}: { profile: Profile }) {
    useLanguage();
    const form = useForm<ProfileValues>({
        defaultValues: {
            fullName: profile.user.fullName, faculty: profile.faculty, bio: profile.bio || '',
            preferredTrack: profile.preferredTrack || '', experience: profile.experience || '',
        }
    });
    const update = useUpdateProfile();
    const [expected, setExpected] = useState({version: profile.version, userVersion: profile.user.version});
    useEffect(() => {
        if (!form.formState.isDirty) {
            form.reset({
                fullName: profile.user.fullName, faculty: profile.faculty, bio: profile.bio || '',
                preferredTrack: profile.preferredTrack || '', experience: profile.experience || ''
            });
            setExpected({version: profile.version, userVersion: profile.user.version});
        }
    }, [profile, form]);
    const submit = form.handleSubmit(async (values) => {
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
            for (const issue of parsed.error.issues) form.setError(String(issue.path[0]) as FieldPath<ProfileValues>, {message: issue.message});
            return;
        }
        try {
            const saved = await update.mutateAsync({
                ...parsed.data,
                preferredTrack: parsed.data.preferredTrack || null, ...expected
            });
            form.reset({
                fullName: saved.user.fullName, faculty: saved.faculty, bio: saved.bio || '',
                preferredTrack: saved.preferredTrack || '', experience: saved.experience || ''
            });
            setExpected({version: saved.version, userVersion: saved.user.version});
        } catch (error) {
            for (const field of apiError(error)?.fieldErrors || [])
                if (['fullName', 'faculty', 'bio', 'preferredTrack', 'experience'].includes(field.field))
                    form.setError(field.field as FieldPath<ProfileValues>, {message: field.message});
        }
    });
    return <Card><h2 className="mb-5 text-xl font-semibold">{tr("Thông tin cá nhân")}</h2>
        <p className="mb-5 text-sm text-text-secondary">{renderText(profile.user.studentId)} · {renderText(profile.user.email)}</p>
        <form noValidate onSubmit={submit} className="space-y-4">
            <FormField id="fullName" label={tr("Họ và tên")} error={form.formState.errors.fullName?.message}><Input
                id="fullName" maxLength={150} {...form.register('fullName')} /></FormField>
            <FormField id="faculty" label="Khoa" error={form.formState.errors.faculty?.message}><Select id="faculty" {...form.register('faculty')}>
                {renderText(!faculties.some(f => f === profile.faculty) && <option value={profile.faculty}>{renderText(profile.faculty)}</option>)}
                {renderText(faculties.map(f => <option key={f} value={f}>{renderText(f)}</option>))}
            </Select></FormField>
            <FormField id="bio" label={tr("Giới thiệu bản thân")} error={form.formState.errors.bio?.message}><Textarea id="bio" rows={3}
                                                                                                 maxLength={500} {...form.register('bio')} /></FormField>
            <FormField id="preferredTrack" label={tr("Nhóm đóng góp mong muốn")}
                       error={form.formState.errors.preferredTrack?.message}>
                <Select id="preferredTrack" {...form.register('preferredTrack')}>
                    <option value="">{tr("Chưa chọn")}</option>
                    <option value="TECHNICAL">{tr("Kỹ thuật")}</option>
                    <option value="LOGISTICS">{tr("Hậu cần")}</option>
                </Select>
            </FormField>
            <FormField id="experience" label={tr("Kinh nghiệm")} error={form.formState.errors.experience?.message}><Textarea
                id="experience" rows={4} maxLength={10000} {...form.register('experience')} /></FormField>
            {renderText(update.isError && <p role="alert" className="text-danger">{renderText(errorMessage(update.error))}</p>)}
            {renderText(update.isSuccess && <p role="status" className="text-success">{tr("Đã lưu hồ sơ.")}</p>)}
            <Button type="submit" disabled={update.isPending}>{renderText(update.isPending ? tr("Đang lưu…") : tr("Lưu hồ sơ"))}</Button>
        </form>
    </Card>;
}


