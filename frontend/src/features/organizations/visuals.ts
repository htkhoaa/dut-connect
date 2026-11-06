import type {IconName} from '../../shared/components/Icon';
import {dutPhotography} from '../../shared/lib/dutPhotography';

export function organizationPhoto(name: string, type: string) {
    if (/sức trẻ|nhiệt/i.test(name)) return {src: '/images/dut-volunteer-beach.jpg', alt: ''};
    if (/hội sinh viên|tư vấn sinh viên/i.test(name)) return {src: '/images/dut-volunteer-spring.jpg', alt: ''};
    if (/đoàn thanh niên/i.test(name)) return {src: '/images/dut-volunteer-summer.jpg', alt: ''};
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

export function organizationLogo(name: string, type: string): {src: string; icon: IconName} {
    const text = name.toLocaleLowerCase('vi-VN');
    if (/đoàn thanh niên/i.test(text)) return {src: '/images/dut-logo-51.png', icon: 'shield'};
    if (/hội sinh viên/i.test(text)) return {src: '/images/dut-logo-51.png', icon: 'users'};
    if (/nhiệt|sức trẻ/i.test(text)) return {src: '/images/dut-volunteer-beach.jpg', icon: 'spark'};
    if (/quản lý dự án/i.test(text)) return {src: '/images/dut-campus-main.jpg', icon: 'building'};
    if (/tư vấn/i.test(text)) return {src: '/images/dut-students-welcome.jpg', icon: 'users'};
    return {src: '/images/dut-logo-51.png', icon: organizationIcon(name, type)};
}
