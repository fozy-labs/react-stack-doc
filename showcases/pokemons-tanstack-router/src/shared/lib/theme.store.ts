import { injectable } from '@fozy-labs/simplest-di';
import { LocalSignal } from '@fozy-labs/rx-toolkit';

export type Theme = 'light' | 'dark';

@injectable('SINGLETON')
export class ThemeStore {
    theme$ = LocalSignal.state<Theme>({
        key: 'showcase-tsr-theme',
        defaultValue: 'light',
    });

    toggleTheme = () => {
        this.theme$.set(this.theme$.peek() === 'light' ? 'dark' : 'light');
    };
}
