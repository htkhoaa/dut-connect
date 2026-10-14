import {tr} from "../lib/i18n";
import {useLanguage} from '../lib/i18n';
export function LanguageSwitch() {
    const {language, setLanguage} = useLanguage();
    return <div className="language-switch" role="group" aria-label={tr("Language / Ngôn ngữ")}>
        {(['vi', 'en'] as const).map(value => <button key={value} type="button" lang={value} aria-pressed={language === value}
            className={language === value ? 'is-selected' : ''} onClick={() => setLanguage(value)}>{value.toUpperCase()}</button>)}
    </div>;
}
