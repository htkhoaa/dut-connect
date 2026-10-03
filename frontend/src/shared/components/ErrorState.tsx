import {Button} from './Button';

export function ErrorState({message, onRetry}: {message: string; onRetry?: () => void}) {
    return <div role="alert" className="state-panel space-y-3 text-danger"><p>{message}</p>
        {onRetry && <Button variant="secondary" onClick={onRetry}>Thử lại</Button>}
    </div>;
}
