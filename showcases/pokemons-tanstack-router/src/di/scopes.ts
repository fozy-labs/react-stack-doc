import { Scope, unstable_createScopesStore } from '@fozy-labs/simplest-di';

/**
 * Корневой скоуп приложения. Живёт всё время работы приложения.
 */
export const rootScope = new Scope(null, 'app');

/**
 * Стор зонных скоупов, чьим жизненным циклом управляет роутер.
 */
export const scopeStore = unstable_createScopesStore({ parent: rootScope });
