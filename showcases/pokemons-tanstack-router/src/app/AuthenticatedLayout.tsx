import { inject, DiScopeProvider } from '@fozy-labs/simplest-di';
import { Outlet } from '@tanstack/react-router';
import { AuthStore } from '@/features/auth';
import { rootScope } from '@/di';

/**
 * Лейаут приватной зоны. Подмонтирует приватный скоуп в React-дерево через
 * `DiScopeProvider scope=`. Скоуп берём из `AuthStore` (тот же мемоизированный
 * экземпляр, что создал `beforeLoad`), поэтому компоненты резолвят приватные
 * сервисы из ровно того же скоупа, что и loader — кэш общий.
 *
 * Скоуп получаем из AuthStore, а не из контекста роута, чтобы не импортировать
 * сам роут (иначе циклическая зависимость с router.tsx).
 */
export function AuthenticatedLayout() {
    const scope = inject(AuthStore).getPrivateScope(rootScope);

    return (
        <DiScopeProvider scope={scope}>
            <Outlet />
        </DiScopeProvider>
    );
}
