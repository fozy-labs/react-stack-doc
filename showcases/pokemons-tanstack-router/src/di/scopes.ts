import { Scope } from '@fozy-labs/simplest-di';

/**
 * Корневой (публичный) скоуп приложения. Живёт всё время работы приложения.
 * Приватный скоуп создаётся как его дочерний при входе в авторизованную зону
 */
export const rootScope = new Scope(null, 'app');

export function createAuthScope(scope: Scope) {
    return new Scope(scope, 'auth');
}
