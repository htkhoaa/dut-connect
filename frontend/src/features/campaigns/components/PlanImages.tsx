import type { ChangeEventHandler, Dispatch, RefObject, SetStateAction } from 'react';
import { ApiImage } from '../../../shared/components/ApiImage';
import { Button } from '../../../shared/components/Button';
import { tr, useLanguage } from '../../../shared/lib/i18n';
import type { PendingPlanImage, PlanGalleryImage } from './planTypes';

interface PlanImagesProps {
    existingImages: PlanGalleryImage[] | undefined;
    pendingImages: PendingPlanImage[];
    setPendingImages: Dispatch<SetStateAction<PendingPlanImage[]>>;
    fileInputRef: RefObject<HTMLInputElement | null>;
    handleFilesSelected: ChangeEventHandler<HTMLInputElement>;
    onDeleteImage: (id: string) => void;
}
export function PlanImages({
    existingImages,
    pendingImages,
    setPendingImages,
    fileInputRef,
    handleFilesSelected,
    onDeleteImage,
}: PlanImagesProps) {
    useLanguage();
    return (
        <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <span>📸</span>
                        <span>{tr('Hình ảnh chiến dịch (Ảnh bìa & Thư viện ảnh)')}</span>
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                        {tr(
                            'Tải lên hình ảnh truyền thông hoặc kế hoạch thực hiện chiến dịch (tối đa 5MB/ảnh, PNG, JPG).',
                        )}
                    </p>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleFilesSelected}
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        className="text-xs font-semibold px-3 py-2 rounded-xl"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        + {tr('Chọn ảnh tải lên')}
                    </Button>
                </div>
            </div>

            {/* Preview grid */}
            {(existingImages && existingImages.length > 0) || pendingImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {/* Existing images */}
                    {existingImages?.map((img) => (
                        <div
                            key={img.id}
                            className="relative group aspect-4/3 rounded-xl overflow-hidden border border-border bg-surface-muted"
                        >
                            <ApiImage
                                src={img.imageUrl}
                                alt={img.caption || ''}
                                className="w-full h-full object-cover"
                            />
                            {img.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-[10px] text-white truncate">
                                    {img.caption}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm(tr('Xóa ảnh này khỏi thư viện?'))) {
                                        onDeleteImage(img.id);
                                    }
                                }}
                                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-danger text-xs transition-colors"
                                title={tr('Xóa ảnh')}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* Pending newly picked images */}
                    {pendingImages.map((item) => (
                        <div
                            key={item.id}
                            className="relative group aspect-4/3 rounded-xl overflow-hidden border-2 border-dashed border-primary/50 bg-primary-light/20 flex flex-col justify-between"
                        >
                            <ApiImage
                                src={item.previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <span className="absolute top-1.5 left-1.5 rounded-md bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 shadow-2xs">
                                {tr('Mới')}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    URL.revokeObjectURL(item.previewUrl);
                                    setPendingImages((prev) =>
                                        prev.filter((p) => p.id !== item.id),
                                    );
                                }}
                                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/70 text-white hover:bg-danger text-xs transition-colors"
                                title={tr('Hủy chọn ảnh')}
                            >
                                ✕
                            </button>
                            <div className="absolute inset-x-0 bottom-0 bg-white/95 p-1.5 border-t border-border">
                                <input
                                    type="text"
                                    placeholder={tr('Chú thích ảnh (tùy chọn)…')}
                                    value={item.caption}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setPendingImages((prev) =>
                                            prev.map((p) =>
                                                p.id === item.id ? { ...p, caption: val } : p,
                                            ),
                                        );
                                    }}
                                    className="w-full text-[11px] rounded bg-surface-muted px-1.5 py-0.5 border border-border focus:outline-primary"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/80 bg-surface-muted/30 py-6 px-4 text-center cursor-pointer hover:bg-surface-muted/60 transition-colors"
                >
                    <span className="text-2xl">🖼️</span>
                    <p className="text-xs font-semibold text-text-primary">
                        {tr('Chưa có ảnh nào được chọn')}
                    </p>
                    <p className="text-[11px] text-text-secondary">
                        {tr(
                            'Nhấn vào đây để tải ảnh bìa hoặc ảnh hoạt động minh họa cho chiến dịch',
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}
