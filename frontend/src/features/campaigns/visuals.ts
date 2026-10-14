import type {IconName} from '../../shared/components/Icon';
import {dutPhotography} from '../../shared/lib/dutPhotography';
export function campaignVisual(category: string, title = ''): {image: string; alt: string; icon: IconName} {
    if (/mùa hè xanh|xã lìa/i.test(title)) return {image: '/images/dut-volunteer-summer.jpg', alt: '', icon: 'heart'};
    if (/xuân tình nguyện/i.test(title)) return {image: '/images/dut-volunteer-spring.jpg', alt: '', icon: 'heart'};
    if (/hiến máu/i.test(title)) return {image: '/images/dut-volunteer-blood.jpg', alt: '', icon: 'heart'};
    if (/nguyễn tất thành/i.test(title)) return {image: '/images/dut-volunteer-beach.jpg', alt: '', icon: 'leaf'};
    const name = (category + ' ' + title).toLocaleLowerCase('vi-VN');
    if (/stem|công nghệ|kỹ thuật|bách khoa số/.test(title.toLocaleLowerCase('vi-VN'))) return {image: dutPhotography.technology.src, alt: dutPhotography.technology.alt, icon: 'cpu'};
    if (/buddy|tân sinh viên/.test(title.toLocaleLowerCase('vi-VN'))) return {image: dutPhotography.welcome.src, alt: dutPhotography.welcome.alt, icon: 'users'};
    if (/education|giáo dục|tiếp sức|sách|gia sư/.test(name)) return {image: dutPhotography.classrooms.src, alt: dutPhotography.classrooms.alt, icon: 'book'};
    if (/community|hỗ trợ cộng đồng|vùng cao/.test(name)) return {image: dutPhotography.tower.src, alt: dutPhotography.tower.alt, icon: 'heart'};
    return {image: dutPhotography.garden.src, alt: dutPhotography.garden.alt, icon: 'leaf'};
}
export function isDemoContent(text: string): boolean {return text.includes('Dữ liệu minh họa');}
