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

    login(email: string): { ok: boolean; error?: string } {
        const user = findUserByEmail(email);

        if (!user) {
            return { ok: false, error: 'User not found. Try: sincere@april.biz' };
        }

        this.currentUser$.set(user);
        return { ok: true };
    }

    logout = () => {
        this.currentUser$.clear();
    };
}
