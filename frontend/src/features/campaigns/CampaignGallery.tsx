import {useState, useRef, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useLanguage, tr, renderText} from '../../shared/lib/i18n';
import {apiClient} from '../../shared/api/client';
import {Card} from '../../shared/components/Card';
import {Icon} from '../../shared/components/Icon';
import {Button} from '../../shared/components/Button';

export interface GalleryItem {
    id: string;
    campaignId: string;
    caption: string;
    sortOrder: number;
    createdAt: string;
    imageUrl: string;
}

export function CampaignGallery({campaignId, canManage = false}: {campaignId: string; canManage?: boolean}) {
    useLanguage();
    const qc = useQueryClient();
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
    const [captionInput, setCaptionInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const query = useQuery({
        queryKey: ['campaign-gallery', campaignId],
        queryFn: async () => {
            return (await apiClient.get<GalleryItem[]>(`/campaigns/${campaignId}/gallery`)).data;
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async ({file, caption}: {file: File; caption: string}) => {
            const formData = new FormData();
            formData.append('file', file);
            if (caption) formData.append('caption', caption);
            return (await apiClient.post<GalleryItem>(`/campaigns/${campaignId}/gallery`, formData, {
                headers: {'Content-Type': 'multipart/form-data'},
            })).data;
        },
        onSuccess: () => {
            void qc.invalidateQueries({queryKey: ['campaign-gallery', campaignId]});
            setCaptionInput('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (imageId: string) => {
            await apiClient.delete(`/campaigns/gallery/${imageId}`);
        },
        onSuccess: () => {
            void qc.invalidateQueries({queryKey: ['campaign-gallery', campaignId]});
            if (selectedImage) setSelectedImage(null);
        },
    });

    const items = query.data ?? [];
    const currentIndex = selectedImage ? items.findIndex(x => x.id === selectedImage.id) : -1;

    const showPrev = () => {
        if (items.length <= 1) return;
        const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        setSelectedImage(items[prevIndex]);
    };

    const showNext = () => {
        if (items.length <= 1) return;
        const nextIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
        setSelectedImage(items[nextIndex]);
    };

    useEffect(() => {
        if (!selectedImage) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') showPrev();
            else if (e.key === 'ArrowRight') showNext();
            else if (e.key === 'Escape') setSelectedImage(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    if (query.isPending) return null;
    if (items.length === 0 && !canManage) return null;

    return (
        <Card className="overflow-hidden">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-text-primary">{tr("Thư viện ảnh")}</h2>
                {items.length > 0 && (
                    <span className="text-xs font-semibold text-text-secondary">
                        {items.length} {tr("hình ảnh")}
                    </span>
                )}
            </div>

            {/* Gallery Grid */}
            {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-text-secondary">
                    {tr("Chưa có hình ảnh nào được tải lên cho chiến dịch này.")}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-surface-muted cursor-pointer transition-all hover:shadow-md"
                            onClick={() => setSelectedImage(item)}
                        >
                            <img
                                src={item.imageUrl}
                                alt={item.caption || tr("Hình ảnh chiến dịch")}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {item.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-2 pt-6 text-[11px] text-white">
                                    <p className="truncate font-medium">{renderText(item.caption)}</p>
                                </div>
                            )}
                            {canManage && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(tr("Xóa ảnh này khỏi thư viện?"))) {
                                            deleteMutation.mutate(item.id);
                                        }
                                    }}
                                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
                                    title={tr("Xóa ảnh")}
                                >
                                    <Icon name="close" size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Uploader Section for Campaign Managers */}
            {canManage && (
                <div className="mt-5 rounded-xl border border-border/70 bg-surface-muted/40 p-4">
                    <p className="text-xs font-semibold text-text-primary mb-2">
                        {tr("Tải thêm ảnh vào thư viện (tối đa 5MB / ảnh)")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            placeholder={tr("Chú thích ngắn về bức ảnh…")}
                            value={captionInput}
                            onChange={(e) => setCaptionInput(e.target.value)}
                            className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-xs text-text-primary focus:outline-primary"
                            maxLength={300}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    uploadMutation.mutate({file, caption: captionInput});
                                }
                            }}
                        />
                        <Button
                            type="button"
                            disabled={uploadMutation.isPending}
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs py-2 whitespace-nowrap"
                        >
                            <Icon name="file" size={15} />
                            {uploadMutation.isPending ? tr("Đang tải ảnh…") : tr("Chọn và tải ảnh")}
                        </Button>
                    </div>
                </div>
            )}

            {/* Fullscreen Lightbox Modal with Left/Right Navigation */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Image Viewer */}
                        <div className="relative flex items-center justify-center bg-black/95 min-h-[300px]">
                            <img
                                src={selectedImage.imageUrl}
                                alt={selectedImage.caption || ''}
                                className="max-h-[75vh] w-auto max-w-full object-contain"
                            />

                            {/* Left & Right Navigation Buttons */}
                            {items.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); showPrev(); }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white hover:scale-105 transition-all shadow-lg text-lg font-bold backdrop-blur-xs"
                                        title={tr("Ảnh trước (Phím mũi tên trái ←)")}
                                    >
                                        ⟨
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); showNext(); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white hover:scale-105 transition-all shadow-lg text-lg font-bold backdrop-blur-xs"
                                        title={tr("Ảnh kế tiếp (Phím mũi tên phải →)")}
                                    >
                                        ⟩
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Footer Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border-t border-border">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">
                                    {renderText(selectedImage.caption || tr("Hình ảnh chiến dịch DUT Connect"))}
                                </p>
                                {items.length > 1 && (
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        {tr("Ảnh")} {currentIndex + 1} / {items.length}
                                    </p>
                                )}
                            </div>
                            <Button variant="secondary" onClick={() => setSelectedImage(null)} className="text-xs">
                                {tr("Đóng (Esc)")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
