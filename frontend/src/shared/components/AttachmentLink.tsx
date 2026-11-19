import {useState, type ReactNode} from 'react';
import {apiClient} from '../api/client';
import {errorMessage} from '../api/errors';

export function AttachmentLink({path, children, className}: {path: string; children: ReactNode; className?: string}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function download() {
        setBusy(true);
        setError('');
        try {
            const response = await apiClient.get<Blob>(path.replace(/^\/api\/v1/, ''), {responseType: 'blob'});
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            const extension = response.data.type === 'application/pdf' ? 'pdf' : response.data.type === 'image/png' ? 'png' : 'jpg';
            link.href = url;
            link.download = 'receipt.' + extension;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) { setError(errorMessage(e)); }
        finally { setBusy(false); }
    }
    return <span><button type="button" className={className} disabled={busy} onClick={() => void download()}>{children}</button>
        {error && <span role="alert" className="ml-2 text-xs text-danger">{error}</span>}</span>;
}
