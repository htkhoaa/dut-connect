import {useEffect, useState, type ImgHTMLAttributes} from 'react';
import {apiClient} from '../api/client';
import {useAuth} from '../../features/auth/store';

/** Private images need the same Authorization header as other API requests. */
export function ApiImage({src = '', ...props}: ImgHTMLAttributes<HTMLImageElement>) {
    const userId = useAuth(s => s.user?.id);
    const [loaded, setLoaded] = useState<{src: string; userId?: string; url: string} | null>(null);
    const isApi = src.startsWith('/api/v1/');
    useEffect(() => {
        if (!isApi) return;
        const controller = new AbortController();
        let objectUrl: string | undefined;
        void apiClient.get<Blob>(src.slice('/api/v1'.length), {responseType: 'blob', signal: controller.signal})
            .then(response => {
                if (controller.signal.aborted) return;
                objectUrl = URL.createObjectURL(response.data);
                setLoaded({src, userId, url: objectUrl});
            }).catch(() => { /* Keep the image's alt text when loading fails. */ });
        return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [src, userId, isApi]);
    const imageSrc = isApi ? (loaded?.src === src && loaded.userId === userId ? loaded.url : undefined) : src;
    return <img {...props} src={imageSrc} />;
}
