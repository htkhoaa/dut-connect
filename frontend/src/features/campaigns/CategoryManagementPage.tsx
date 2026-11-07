import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {catalogLabel} from '../../shared/lib/catalogLabels';
import {useState, useRef} from 'react';
import type {Category} from './types';
import {useCategories, useSaveCategory} from './hooks';
import {errorMessage} from '../../shared/api/errors';
import {Button} from '../../shared/components/Button';
import {Table} from '../../shared/components/Table';
import {Pagination} from '../../shared/components/Pagination';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {EmptyState} from '../../shared/components/EmptyState';
import {Badge} from '../../shared/components/Badge';

export function CategoryManagementPage() {
    useLanguage();
    const [page, setPage] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>('');
    const [newCategoryName, setNewCategoryName] = useState<string>('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const list = useCategories(page, true);
    const mutation = useSaveCategory();

    const startEditing = (c: Category) => {
        setEditingId(c.id);
        setEditingName(c.name);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const saveInlineEdit = async (c: Category) => {
        const trimmed = editingName.trim();
        if (!trimmed || trimmed === c.name) {
            cancelEditing();
            return;
        }
        try {
            await mutation.mutateAsync({
                id: c.id,
                values: {
                    name: trimmed,
                    description: c.description || '',
                    active: c.active,
                    version: c.version,
                }
            });
            setEditingId(null);
            setFeedback(tr(`Đã đổi tên danh mục thành "${trimmed}".`));
            setTimeout(() => setFeedback(null), 4000);
        } catch (err) {
            setFeedback(errorMessage(err));
        }
    };

    const toggleStatus = async (c: Category) => {
        try {
            await mutation.mutateAsync({
                id: c.id,
                values: {
                    name: c.name,
                    description: c.description || '',
                    active: !c.active,
                    version: c.version,
                }
            });
            setFeedback(tr(`Đã cập nhật trạng thái danh mục.`));
            setTimeout(() => setFeedback(null), 4000);
        } catch (err) {
            setFeedback(errorMessage(err));
        }
    };

    const handleCreateNew = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        try {
            await mutation.mutateAsync({
                values: {
                    name: trimmed,
                    description: '',
                    active: true,
                }
            });
            setNewCategoryName('');
            setFeedback(tr(`Đã tạo danh mục mới "${trimmed}".`));
            setTimeout(() => setFeedback(null), 4000);
        } catch (err) {
            setFeedback(errorMessage(err));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{tr("Danh mục chiến dịch")}</h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        {tr("Quản lý danh mục trực tiếp. Nhấp vào tên để chỉnh sửa nhanh và bấm Enter để lưu.")}
                    </p>
                </div>
            </div>

            {/* Quick Add Bar */}
            <form onSubmit={handleCreateNew} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-xs">
                <div className="relative flex-1 min-w-[240px]">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                        📁
                    </span>
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={tr("Nhập tên danh mục mới và nhấn Enter…")}
                        className="w-full rounded-xl border border-border bg-surface-muted/40 pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none transition-all shadow-2xs"
                        maxLength={120}
                        disabled={mutation.isPending}
                    />
                </div>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={!newCategoryName.trim() || mutation.isPending}
                    className="text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
                >
                    + {tr("Thêm danh mục")}
                </Button>
            </form>

            {feedback && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 shadow-2xs flex items-center justify-between animate-fade-in">
                    <span>✓ {feedback}</span>
                    <button type="button" onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
                </div>
            )}

            {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

            {list.isPending ? (
                <LoadingState message={tr("Đang tải danh mục…")} />
            ) : list.isError ? (
                <ErrorState message={errorMessage(list.error)} onRetry={() => void list.refetch()} />
            ) : list.data.items.length === 0 ? (
                <EmptyState message={tr("Chưa có danh mục nào. Hãy tạo danh mục đầu tiên ở trên.")} />
            ) : (
                <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-xs">
                    <Table caption={tr("Danh mục chiến dịch")}>
                        <thead className="bg-surface-muted/70 text-xs font-bold uppercase text-text-secondary">
                            <tr>
                                <th scope="col" className="p-4 w-1/2">{tr("Tên danh mục (Nhấp để đổi tên)")}</th>
                                <th scope="col" className="p-4">{tr("Trạng thái")}</th>
                                <th scope="col" className="p-4 text-right">{tr("Thao tác")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {list.data.items.map((c) => {
                                const isEditing = editingId === c.id;
                                return (
                                    <tr key={c.id} className="hover:bg-primary-light/10 transition-colors group">
                                        <td className="p-4">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        ref={inputRef}
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                void saveInlineEdit(c);
                                                            } else if (e.key === 'Escape') {
                                                                cancelEditing();
                                                            }
                                                        }}
                                                        onBlur={() => void saveInlineEdit(c)}
                                                        className="w-full max-w-md rounded-lg border-2 border-primary bg-white px-3 py-1.5 text-sm font-semibold text-primary focus:outline-none shadow-xs"
                                                        maxLength={120}
                                                    />
                                                    <span className="text-[11px] text-text-secondary whitespace-nowrap">
                                                        {tr("↵ Enter để lưu · Esc để hủy")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => startEditing(c)}
                                                    className="flex items-center gap-2 cursor-pointer rounded-lg py-1 px-2 -ml-2 hover:bg-surface-muted transition-colors"
                                                    title={tr("Nhấp để chỉnh sửa tên")}
                                                >
                                                    <span className="font-semibold text-text-primary text-sm group-hover:text-primary transition-colors">
                                                        {renderText(catalogLabel(c.name))}
                                                    </span>
                                                    <span className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-opacity text-xs" title={tr("Sửa tên")}>
                                                        ✏️
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                type="button"
                                                onClick={() => void toggleStatus(c)}
                                                className="cursor-pointer transition-transform active:scale-95 text-left"
                                                title={tr("Nhấp để đổi trạng thái")}
                                                disabled={mutation.isPending}
                                            >
                                                <Badge tone={c.active ? 'success' : 'neutral'}>
                                                    {renderText(c.active ? tr("Đang hoạt động") : tr("Ngừng sử dụng"))}
                                                </Badge>
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                variant="secondary"
                                                className="text-xs py-1 px-3 rounded-lg"
                                                disabled={mutation.isPending}
                                                onClick={() => void toggleStatus(c)}
                                            >
                                                {c.active ? tr("Ngừng dùng") : tr("Kích hoạt")}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    <div className="p-3 border-t border-border">
                        <Pagination {...list.data} onPageChange={setPage} />
                    </div>
                </div>
            )}
        </div>
    );
}
