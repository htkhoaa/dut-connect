import {Icon} from './Icon';
export function EmptyState({message}: {message: string}) {
    return <div className="state-panel text-center"><span className="icon-tile mx-auto mb-4"><Icon name="search" size={26}/></span><p className="text-text-secondary">{message}</p></div>;
}
