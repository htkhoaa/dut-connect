import { Link } from 'react-router-dom';
import { tr, useLanguage } from '../../shared/lib/i18n';

export function Brand() {
    useLanguage();
    return (
        <Link to="/" className="brand" aria-label={tr('DUT Connect – Trang chủ')}>
            <img
                className="brand-logo"
                src="/images/dut-logo-51.png"
                alt={tr('Logo kỷ niệm 51 năm Đại học Bách khoa Đà Nẵng')}
            />
            <span>
                DUT<span className="font-normal"> Connect</span>
                <small>{tr('KẾT NỐI ĐỂ CỐNG HIẾN')}</small>
            </span>
        </Link>
    );
}
