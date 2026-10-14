import {useLanguage, renderText} from "../../shared/lib/i18n";
import {Icon, type IconName} from '../../shared/components/Icon';
const icons: IconName[] = ['heart', 'check', 'file', 'building', 'shield', 'users', 'clock', 'heart', 'leaf', 'file'];
export function MetricGrid({items}:{items:readonly (readonly [string,string|number])[]}){
    useLanguage();
    return <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{renderText(items.map(([label,value],index)=><div className="metric-tile" key={label}><div className="mb-4 flex items-start justify-between gap-3"><dt className="text-sm text-text-secondary">{renderText(label)}</dt><span className="metric-icon"><Icon name={icons[index % icons.length]} size={18}/></span></div><dd className="break-words text-3xl font-semibold tracking-tight">{renderText(value)}</dd></div>))}</dl>;
}
