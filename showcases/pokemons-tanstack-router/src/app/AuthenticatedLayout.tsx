import React from "react";
import { DiScopeProvider } from '@fozy-labs/simplest-di';

/**
 * Лейаут приватной зоны. Подмонтирует приватный скоуп в React-дерево через
 * `DiScopeProvider scope=`. Скоуп берём из `AuthStore` (тот же мемоизированный
 * экземпляр, что создал `beforeLoad`), поэтому компоненты резолвят приватные
 * сервисы из ровно того же скоупа, что и loader — кэш общий.
 *
 * Скоуп получаем из AuthStore, а не из контекста роута, чтобы не импортировать
 * сам роут (иначе циклическая зависимость с router.tsx).
 */
export function AuthenticatedLayout({ children }: React.PropsWithChildren) {

    return (
        <DiScopeProvider scope={scope}>
            {children}
        </DiScopeProvider>
    );
}
