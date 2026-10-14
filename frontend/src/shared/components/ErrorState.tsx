import {useLanguage, tr, renderText} from "../lib/i18n";
import {Button} from './Button';

export function ErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
    useLanguage();
    return <div role="alert" className="state-panel space-y-3 text-danger"><p>{renderText(message)}</p>
        {renderText(onRetry && <Button variant="secondary" onClick={onRetry}>{tr("Thử lại")}</Button>)}
    </div>;
}
