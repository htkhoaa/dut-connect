import { Link } from 'react-router-dom';
import { tr, useLanguage } from '../../shared/lib/i18n';
import { Brand } from './Brand';

export function AppFooter({ hasUser }: { hasUser: boolean }) {
    useLanguage();
    return (
        <footer className="border-t border-border bg-white/90 backdrop-blur-sm py-12 text-sm text-text-secondary">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
                <div>
                    <Brand />
                    <p className="mt-4 max-w-sm text-xs leading-relaxed">
                        {tr(
                            'Cùng sinh viên Bách khoa kết nối tri thức, sẻ chia thời gian và lan tỏa những điều tốt đẹp.',
                        )}
                    </p>
                </div>
                <div>
                    <p className="mb-3 font-semibold text-text-primary">{tr('Cùng hành động')}</p>
                    <div className="grid gap-2 text-xs">
                        <Link to="/campaigns" className="hover:text-primary transition-colors">
                            {tr('Khám phá chiến dịch')}
                        </Link>
                        <Link to="/guide" className="hover:text-primary transition-colors">
                            {tr('Hướng dẫn tham gia')}
                        </Link>
                        <Link to="/organizations" className="hover:text-primary transition-colors">
                            {tr('Cộng đồng tổ chức')}
                        </Link>
                        <Link
                            to={hasUser ? '/proposals/new' : '/login'}
                            className="hover:text-primary transition-colors"
                        >
                            {tr(hasUser ? 'Tạo đề xuất' : 'Đăng nhập để bắt đầu')}
                        </Link>
                    </div>
                </div>
                <div>
                    <p className="mb-3 font-semibold text-text-primary">DUT Connect</p>
                    <p className="text-xs leading-relaxed">
                        {tr('Đại học Bách khoa')}
                        <br />
                        {tr('Đại học Đà Nẵng')}
                    </p>
                    <p className="mt-3 text-xs text-primary font-semibold">
                        {tr('Kết nối để cống hiến.')}
                    </p>
                </div>
            </div>
            <div className="mx-auto mt-8 flex max-w-7xl flex-wrap justify-between gap-3 border-t border-border px-4 pt-4 sm:px-6 text-xs text-text-secondary">
                <small>© {new Date().getFullYear()} DUT Connect</small>
                <small>{tr('Thời gian · Kỹ năng · Giá trị cộng đồng')}</small>
            </div>
        </footer>
    );
}
