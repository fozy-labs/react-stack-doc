import { injectable, Scope } from '@fozy-labs/simplest-di';
import { Subject } from 'rxjs';
import { LocalSignal, Signal } from '@fozy-labs/rx-toolkit';
import type { User } from '@/entities/user';
import { findUserByEmail } from './auth.utils';

/**
 * SINGLETON: личность и время жизни сессии живут на уровне приложения.
 *
 * Помимо собственно авторизации, `AuthStore` владеет жизненным циклом
 * приватного скоупа: создаёт его лениво при входе в приватную зону и
 * уничтожает при логауте. Так весь приватный кэш (покемоны, посты)
 * привязан к сессии и гарантированно убирается при выходе.
 */
@injectable('SINGLETON')
export class AuthStore {
    currentUser$ = LocalSignal.state<User | null>({
        key: 'showcase-tsr-current-user',
        defaultValue: null,
        devtoolsOptions: { base: 'showcase/auth', key: 'currentUser' },
    });

    isAuthenticated$ = Signal.compute(() => this.currentUser$() !== null, {
        base: 'showcase/auth',
        key: 'isAuthenticated',
    });

    private _privateScope: Scope | null = null;

    /**
     * Лениво создаёт приватный скоуп как дочерний от переданного родителя
     * (rootScope). Мемоизируется, чтобы навигации внутри приватной зоны не
     * плодили новые скоупы. Родитель приходит явно из context роутера — не из
     * `getCurrentScope()`, что безопасно для async-loader'ов.
     */
    getPrivateScope(parent: Scope): Scope {
        if (!this._privateScope) {
            const scope = new Scope(parent, 'private');
            // Scope должен поддерживать lifecycle-колбэки (init$/destroyed$), иначе
            // inject() для SCOPED-сервиса бросает «does not support destruction
            // callbacks». DiScopeProvider/useScope делают это сами; ручной скоуп — нет.
            scope.init$ = new Subject();
            scope.destroyed$ = new Subject();
            scope.init();
            this._privateScope = scope;
        }
        return this._privateScope;
    }

    login(email: string): { ok: boolean; error?: string } {
        const user = findUserByEmail(email);

        if (!user) {
            return { ok: false, error: 'User not found. Try: sincere@april.biz' };
        }

        this.currentUser$.set(user);
        return { ok: true };
    }

    logout = () => {
        // Уничтожаем приватный скоуп: его SCOPED-сервисы (PokemonApi/PostApi с их
        // кэшами) теряют ссылки и собираются GC. Следующий вход создаст свежий
        // скоуп с чистым кэшем — приватные данные не переживают логаут.
        this._privateScope?.dispose();
        this._privateScope = null;
        this.currentUser$.clear();
    };
}
