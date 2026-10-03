import type {IconName} from '../../shared/components/Icon';
import {dutPhotography} from '../../shared/lib/dutPhotography';
export function organizationPhoto(name: string, type: string) {
    const icon = organizationIcon(name, type);
    if (icon === 'leaf') return dutPhotography.garden;
    if (icon === 'cpu' || icon === 'spark') return dutPhotography.technology;
    if (icon === 'shield' || icon === 'heart') return dutPhotography.tower;
    if (icon === 'users') return dutPhotography.welcome;
    return dutPhotography.classrooms;
}
export function organizationIcon(name: string, type: string): IconName {
    const text = name.toLocaleLowerCase('vi-VN');
    if (/xanh|green/.test(text)) return 'leaf';
    if (/công tác xã hội|social/.test(text)) return 'heart';
    if (/công nghệ|sáng tạo/.test(text)) return 'cpu';
    if (/Youth Union|Đoàn/.test(type)) return 'shield';
    if (/Association|Hội/.test(type)) return 'users';
    if (/Club|Câu lạc bộ/.test(type)) return 'spark';
    return 'building';
}
