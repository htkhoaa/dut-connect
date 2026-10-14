import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
﻿import {useState} from 'react';
import {useProfile} from './hooks';
import {ProfileEditor} from './components/ProfileEditor';
import {SkillEditor} from './components/SkillEditor';
import {errorMessage} from '../../shared/api/errors';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {Icon} from '../../shared/components/Icon';
import {UserAvatar, AvatarEditor} from './avatar';
export function ProfilePage() {
    useLanguage();
    const profile = useProfile();
    const [confirmReload, setConfirmReload] = useState(false);
    if (profile.isPending) return <LoadingState message={tr("Đang tải hồ sơ…")}/>;
    if (profile.isError) return <ErrorState message={errorMessage(profile.error)} onRetry={() => void profile.refetch()}/>;
    return <>
        <div className="profile-heading mb-7"><UserAvatar className="profile-avatar"/><div className="min-w-0 flex-1"><p className="eyebrow text-primary">{tr("KHÔNG GIAN CỦA BẠN")}</p><h1 className="mt-2 break-words text-3xl font-bold">{renderText(profile.data.user.fullName)}</h1><p className="mt-2 text-sm text-text-secondary">{renderText(profile.data.faculty)} · {renderText(profile.data.user.studentId)}</p></div>
            <Button variant="secondary" onClick={() => setConfirmReload(true)}>{tr("Tải lại hồ sơ")}</Button>
        </div>
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-muted bg-primary-light p-4"><Icon name="spark" className="shrink-0 text-primary"/><p className="text-sm text-text-secondary">{tr("Chia sẻ kỹ năng và kinh nghiệm để ban tổ chức hiểu rõ hơn cách bạn có thể đóng góp.")}</p></div>
        <div className="grid gap-6 md:grid-cols-2">
            <ProfileEditor profile={profile.data}/><SkillEditor profile={profile.data}/>
        </div>
        <div className="mt-6"><AvatarEditor/></div>
        <ConfirmDialog open={confirmReload} title={tr("Tải lại hồ sơ?")} message={tr("Các thay đổi chưa lưu sẽ bị mất.")}
                       confirmLabel={tr("Tải lại")} onConfirm={() => window.location.reload()} onClose={() => setConfirmReload(false)}/>
    </>;
}

