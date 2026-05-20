# 🧠 Концепция

### 1. 🏪 Сторы и сервисы

```ts
// shared/theme/theme.store.ts
import { injectable } from '@fozy-labs/simplest-di';
import { LocalSignal, Signal } from '@fozy-labs/rx-toolkit';

export type Theme = 'light' | 'dark';

@injectable('SINGLETON')
export class ThemeStore {
    
    theme$ = LocalSignal.state<Theme>({
        key: 'theme',
        defaultValue: 'light',
    });

    isDark$ = Signal.compute(() => this.theme$() === 'dark');

    toggle = () => this.theme$.update((prev) => (prev === 'light' ? 'dark' : 'light'));
}
```

Время жизни (`@injectable(...)`):

- `SINGLETON` — один инстанс на приложение. Глобальные сторы, API-клиенты, репозитории.
- `SCOPED` — один инстанс на поддерево `DiScopeProvider`.
- `TRANSIENT` — новый инстанс на каждый `inject(T)`. Применяется редко (для работы с di метаданными, например для создания логгера)

### 2. 🌐 Данные

```ts
// entities/user/user.api.ts
import { injectable } from '@fozy-labs/simplest-di';
import { api } from '@/shared/api';
import type { User } from './types';

@injectable('SINGLETON')
export class UserApi {
    list = api.createResource({
        key: 'user-list',
        queryFn: ({ offset, limit }: { offset: number; limit: number }) =>
            fetchUsers(offset, limit),
    });

    detail = api.createResource<string, User>({
        key: 'user-detail',
        queryFn: (id) => fetchUser(id),
    });
}
```

### 3. ⚛️ Использование в компонентах

```tsx
import { inject } from '@fozy-labs/simplest-di';
import { useSignal } from '@fozy-labs/rx-toolkit';
import { UserApi } from '@/entities/user';
import { ThemeStore } from '@/shared/lib';

function UserList() {
    const userApi = inject(UserApi);
    const query = userApi.list.useResource({ offset: 0, limit: 24 });

    if (query.isLoading) return <Spinner />;
    if (query.isError) return <Error error={query.error} />;

    return <Grid items={query.data} />;
}

function ThemeToggle() {
    const themeStore = inject(ThemeStore);
    const isDark = useSignal(themeStore.isDark$);
    return <Switch isSelected={isDark} onChange={themeStore.toggle} />;
}
```
