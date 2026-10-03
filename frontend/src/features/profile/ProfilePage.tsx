import {useState} from 'react';
import {useProfile} from './hooks';
import {ProfileEditor} from './components/ProfileEditor';
import {SkillEditor} from './components/SkillEditor';
import {errorMessage} from '../../shared/api/errors';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {Icon} from '../../shared/components/Icon';
export function ProfilePage() {
    const profile = useProfile();
    const [confirmReload, setConfirmReload] = useState(false);
    if (profile.isPending) return <LoadingState message="Đang tải hồ sơ…"/>;
    if (profile.isError) return <ErrorState message={errorMessage(profile.error)} onRetry={() => void profile.refetch()}/>;
    return <>
        <div className="profile-heading mb-7"><span className="profile-avatar">{profile.data.user.fullName.slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="eyebrow text-primary">KHÔNG GIAN CỦA BẠN</p><h1 className="mt-2 break-words text-3xl font-bold">{profile.data.user.fullName}</h1><p className="mt-2 text-sm text-text-secondary">{profile.data.faculty} · {profile.data.user.studentId}</p></div>
            <Button variant="secondary" onClick={() => setConfirmReload(true)}>Tải lại hồ sơ</Button>
        </div>
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-muted bg-primary-light p-4"><Icon name="spark" className="shrink-0 text-primary"/><p className="text-sm text-text-secondary">Chia sẻ kỹ năng và kinh nghiệm để ban tổ chức hiểu rõ hơn cách bạn có thể đóng góp.</p></div>
        <div className="grid gap-6 md:grid-cols-2">
            <ProfileEditor profile={profile.data}/><SkillEditor profile={profile.data}/>
        </div>
        <ConfirmDialog open={confirmReload} title="Tải lại hồ sơ?" message="Các thay đổi chưa lưu sẽ bị mất."
                       confirmLabel="Tải lại" onConfirm={() => window.location.reload()} onClose={() => setConfirmReload(false)}/>
    </>;
}

