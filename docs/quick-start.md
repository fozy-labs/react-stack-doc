# 🚀 Быстрый старт

Peer-зависимости: React **19+**, TypeScript **5+**, RxJS **7+**. `zod` опционален (для валидации `localStorage`).

```bash
pnpm add @fozy-labs/rx-toolkit @fozy-labs/simplest-di rxjs react
pnpm add -D zod # опционально
```

В `tsconfig.json` нужны **стандартные** TC39-декораторы:

```jsonc
{
    "compilerOptions": {
        "target": "ES2022",
        "useDefineForClassFields": true
        // НЕ включайте "experimentalDecorators": true
    }
}
```

> В `vite` в зависимости от версии и конфигурации может потребоваться дополнительная настройка для поддержки декораторов.

**🔌 Подключение в коде**

`setupReactDi()` вызывается один раз перед монтированием React-дерева. DevTools `rx-toolkit` настраиваются до создания первого сигнала или API.

```tsx
// app/main.tsx
import { setupReactDi, DiScopeProvider } from '@fozy-labs/simplest-di';
import { DefaultOptions, reduxDevtools } from '@fozy-labs/rx-toolkit';

setupReactDi(); // Связываем DI систему с React

if (import.meta.env.DEV) {
    DefaultOptions.update({ 
        DEVTOOLS: reduxDevtools({ name: 'app' }), // Используем Redux DevTools для отображения состояния сигналов и API
    });
}
```

**🌐 Создание API**

```ts
// shared/api/api.ts
import { createApi, reactHooksPlugin } from '@fozy-labs/rx-toolkit';

export const api = createApi({
    plugins: [reactHooksPlugin()], // Добавляет хуки для использования в React-компонентах
});
```

> Обычно достаточно одного `api` на приложение.
