import {vnd} from '../campaigns/presentation';
export function Fundraising({raised,goal}:{raised:string;goal:string|null}){
    const percent=goal?BigInt(raised)*100n/BigInt(goal):null;
    const width=percent===null?0:Number(percent>100n?100n:percent<0n?0n:percent);
    return <div className="space-y-2"><div className="flex flex-wrap items-baseline justify-between gap-2 text-sm"><strong className="text-primary">{vnd(raised)}</strong>{goal && <span className="text-xs text-text-secondary">/ {vnd(goal)}</span>}</div>{goal && <div role="progressbar" aria-label="Tiến độ gây quỹ" aria-valuemin={0} aria-valuemax={100} aria-valuenow={width} aria-valuetext={`${percent}% mục tiêu`} className="h-1.5 overflow-hidden rounded-full bg-primary-light"><div className="h-full rounded-full bg-primary" style={{width:`${width}%`}}/></div>}<p className="text-xs text-text-secondary">Đóng góp đã xác nhận{goal && ' · ' + percent?.toString() + '% mục tiêu'}</p></div>;
}
