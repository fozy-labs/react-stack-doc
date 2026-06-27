import { type ReactNode } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { setupReactDi, DiScopeProvider } from '@fozy-labs/simplest-di';
import { DefaultOptions, reduxDevtools } from '@fozy-labs/rx-toolkit';
import { rootScope } from '@/di';
import { AuthStore } from '@/features/auth';
import { ThemeStore } from '@/shared/lib';

setupReactDi();

// Redux DevTools подключаем только если расширение установлено: иначе
// reduxDevtools() бросает исключение и приложение падает в белый экран.
const hasReduxDevtools =
    typeof window !== 'undefined' &&
    (window as unknown as { __REDUX_DEVTOOLS_EXTENSION__?: unknown }).__REDUX_DEVTOOLS_EXTENSION__;

if (hasReduxDevtools) {
    DefaultOptions.update({ DEVTOOLS: reduxDevtools() });
}

/**
 * Корневые провайдеры. `DiScopeProvider scope={rootScope}` — тот же rootScope,
 * что лежит в context роутера и служит родителем приватного скоупа, поэтому DI
 * в лоадерах и в компонентах когерентен.
 */
export function Providers({ children }: { children: ReactNode }) {
    return (
        <HeroUIProvider className="min-h-full max-h-0 h-full">
            <DiScopeProvider scope={rootScope} provide={[ThemeStore, AuthStore]}>
                {children}
            </DiScopeProvider>
        </HeroUIProvider>
    );
}
