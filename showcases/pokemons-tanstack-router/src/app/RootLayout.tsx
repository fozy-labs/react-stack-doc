import { useSignal } from '@fozy-labs/rx-toolkit';
import { inject } from '@fozy-labs/simplest-di';
import { Outlet } from '@tanstack/react-router';
import { Header } from '@/widgets';
import { ThemeStore } from '@/shared/lib';

/** Корневой лейаут: тема + шапка + слот вложенных роутов. Рендерится внутри
 * корневого DiScopeProvider (rootScope), поэтому inject(ThemeStore) доступен. */
export function RootLayout() {
    const themeStore = inject(ThemeStore);
    const theme = useSignal(themeStore.theme$);

    return (
        <div className={`${theme} min-h-full bg-background text-foreground`}>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}
