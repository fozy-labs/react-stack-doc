import { Scope } from '@fozy-labs/simplest-di';

/**
 * Корневой (публичный) скоуп приложения. Живёт всё время работы приложения.
 * Приватный скоуп создаётся как его дочерний при входе в авторизованную зону
 * (см. `AuthStore.getPrivateScope`).
 */
export const rootScope = new Scope(null, 'app');
