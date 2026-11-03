import {useState} from 'react';
import {useLanguage, tr} from '../../../shared/lib/i18n';
import {Button} from '../../../shared/components/Button';
import {Icon} from '../../../shared/components/Icon';
import {useToast} from '../../../shared/components/ToastProvider';

export function CampaignShare({title}: {title: string}) {
    useLanguage();
    const {show} = useToast();
    const [copied, setCopied] = useState(false);
    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) await navigator.share({title, text: tr('Khám phá chiến dịch này trên DUT Connect'), url});
            else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                show('Đã sao chép liên kết chiến dịch.', 'success');
                window.setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            show('Không thể chia sẻ chiến dịch. Hãy thử sao chép đường dẫn.', 'error');
        }
    };
    return <Button variant="secondary" onClick={() => void share()} aria-label={tr('Chia sẻ chiến dịch')}>
        <Icon name="share" size={16}/>{copied ? tr('Đã sao chép') : tr('Chia sẻ')}
    </Button>;
}
