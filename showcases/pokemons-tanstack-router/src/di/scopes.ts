import { Scope } from '@fozy-labs/simplest-di';
import { Subject } from 'rxjs';

/**
 * Корневой (публичный) скоуп приложения. Живёт всё время работы приложения.
 * Приватный скоуп создаётся как его дочерний при входе в авторизованную зону
 */
export const rootScope = new Scope(null, 'app');

/**
 * Создаёт приватный (auth) скоуп — дочерний от переданного публичного.
 *
 * Помимо конструктора заводит `init$`/`destroyed$`: без `destroyed$` `inject`
 * SCOPED-сервиса бросит «does not support destruction callbacks». Обычно эти
 * субъекты ставит React-обёртка `useScope` на mount, но приватный скоуп мы
 * создаём вручную (в лоадерах роутера, вне React-дерева), поэтому заводим их
 * сами. Жизненным циклом (`init`/`dispose`) владеет `AuthStore`.
 */
export function createAuthScope(scope: Scope) {
    const authScope = new Scope(scope, 'auth');
    authScope.init$ = new Subject<void>();
    authScope.destroyed$ = new Subject<void>();
    return authScope;
}
