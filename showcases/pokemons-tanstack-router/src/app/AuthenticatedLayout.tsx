import { DiScopeProvider, type Scope } from '@fozy-labs/simplest-di';
import { Outlet, useRouteContext } from '@tanstack/react-router';

/**
 * Лейаут приватной зоны. Подмонтирует приватный скоуп в React-дерево через
 * `DiScopeProvider scope=`. Скоуп берём из контекста роута (его кладёт
 * `beforeLoad` приватного роута) — тот же экземпляр, что видят лоадеры, поэтому
 * компоненты резолвят приватные сервисы из ровно того же скоупа, что и loader
 * (кэш общий).
 *
 * Контекст читаем хук-ом `useRouteContext`, а не импортом самого роута, чтобы
 * не словить циклическую зависимость с router.tsx.
 */
export function AuthenticatedLayout() {
    const { scope } = useRouteContext({ strict: false }) as { scope: Scope };

    console.log('[AuthenticatedLayout]');

    return (
        <DiScopeProvider scope={scope}>
            <Outlet />
        </DiScopeProvider>
    );
}
