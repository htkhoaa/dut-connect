import {useEffect, useState} from 'react';
import {tr, useLanguage} from '../lib/i18n';

/** A labelled scroll position indicator for long campaign pages. */
export function SectionNavigation({sections}: {sections: {id: string; label: string}[]}) {
    useLanguage();
    const [active, setActive] = useState(sections[0]?.id);
    const [progress, setProgress] = useState(0);
    const sectionKey = sections.map(s => s.id).join(',');
    useEffect(() => {
        const ids = sectionKey.split(',');
        const update = () => {
            let current = ids[0];
            for (const id of ids) {
                const section = document.getElementById(id);
                if (section && section.getBoundingClientRect().top <= 190) current = id;
            }
            setActive(current);
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(max > 0 ? Math.round(window.scrollY / max * 100) : 100);
        };
        update();
        window.addEventListener('scroll', update, {passive: true});
        window.addEventListener('resize', update);
        return () => {window.removeEventListener('scroll', update); window.removeEventListener('resize', update);};
    }, [sectionKey]);
    return <nav aria-label={tr('Mục lục trang')} className="hidden lg:block sticky top-20 z-20 rounded-2xl border border-border bg-white/95 p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-sm"><span className="mr-2 font-semibold">{tr('Trong trang này')}</span>
            {sections.map(s => <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? 'location' : undefined} className={`rounded-lg px-3 py-2 ${active === s.id ? 'bg-primary text-white' : 'text-text-secondary hover:bg-primary-light'}`}>{tr(s.label)}</a>)}
            <span className="ml-auto text-xs text-text-secondary" aria-hidden="true">{progress}%</span>
        </div><div className="mt-2 h-1 rounded bg-surface-muted" aria-hidden="true"><div className="h-full rounded bg-primary transition-[width]" style={{width: `${progress}%`}}/></div>
    </nav>;
}
