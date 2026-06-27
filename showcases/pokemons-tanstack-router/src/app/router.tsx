import {
    createRouter,
    createRootRouteWithContext,
    createRoute,
    redirect,
    lazyRouteComponent,
} from '@tanstack/react-router';
import { inject, type Scope } from '@fozy-labs/simplest-di';

import { AuthStore } from '@/features/auth';
import { rootScope, createAuthScope } from '@/di';
import { POKEMON_PAGE_LIMIT } from '@/shared/lib';

import { RootLayout } from './RootLayout';
import { AuthenticatedLayout } from './AuthenticatedLayout';

/**
 * В context кладём ТОЛЬКО scope зоны — никаких статических импортов дата-слоя.
 * Это сохраняет code-splitting: API сущностей подгружаются динамически в
 * лоадерах и в ленивых компонентах, а не тянутся в главный бандл.
 *
 * Лоадеры НЕ ждут данные (никакого ensure): они лишь предоставляют entity-API в
 * приватный скоуп (`inject.provide`), чтобы компонент мог его резолвить. Сами
 * загрузочные состояния (скелетон/SWR) рисует компонент через `useResource` —
 * поэтому переход не гейтится и не показывает «стейл» вместо нового экрана.
 */
export interface RouterContext {
    scope: Scope;
}

/**
 * Жизненный цикл приватного скоупа живёт здесь, в роутер-слое (а не в сторе):
 * скоуп — деталь композиции/маршрутизации, стор отвечает только за сессию.
 * Создаётся лениво при первом входе в приватную зону и уничтожается при
 * логауте — вместе с ним умирает весь приватный кэш (покемоны, посты).
 */
let authScope: Scope | null = null;

function getAuthScope(): Scope {
    if (!authScope) {
        authScope = createAuthScope(rootScope);
        authScope.init();
    }
    return authScope;
}

function disposeAuthScope() {
    authScope?.dispose();
    authScope = null;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: RootLayout,
});

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: lazyRouteComponent(() => import('@/pages/home'), 'HomePage'),
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'login',
    beforeLoad: () => {
        const authStore = inject(AuthStore);

        // Гость-онли: уже авторизованного уводим на главную.
        if (authStore.isAuthenticated$.peek()) {
            throw redirect({ to: '/' });
        }
    },
    component: lazyRouteComponent(() => import('@/pages/login'), 'LoginPage'),
});

/**
 * Pathless layout приватной зоны (id вместо path). Здесь живёт auth-гард и
 * подмена scope: для всего поддерева context.scope становится приватным.
 */
const authRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'authenticated',
    beforeLoad: () => {
        const auth = inject(AuthStore);

        if (!auth.isAuthenticated$.peek()) {
            throw redirect({ to: '/login' });
        }

        // Приватный скоуп подменяет публичный для всего поддерева: дочерние
        // лоадеры провайдят entity-API сюда, компоненты резолвят отсюда.
        return { scope: getAuthScope() };
    },
    component: AuthenticatedLayout,
});

const pokemonListRoute = createRoute({
    getParentRoute: () => authRoute,
    path: 'pokemon',
    // page помечен optional, чтобы ссылки на /pokemon не требовали search.
    validateSearch: (search: Record<string, unknown>): { page?: number } => ({
        page: Number(search.page ?? 1) || 1,
    }),
    // loaderDeps прокидывает page в loader, чтобы prefetch шёл по нужной странице
    // и перезапускался при её смене.
    loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
    loader: async ({ context, deps }) => {
        const { PokemonApi } = await import('@/entities/pokemon');
        const api = inject.provide(PokemonApi, context.scope);

        // prefetch: запускаем загрузку страницы и НЕ ждём её — экран рисует
        // скелетон/данные через useResource, переход не гейтится.
        const offset = (deps.page - 1) * POKEMON_PAGE_LIMIT;
        api.list.trigger({ offset, limit: POKEMON_PAGE_LIMIT });
    },
    component: lazyRouteComponent(() => import('@/pages/pokemon'), 'PokemonListPage'),
});

const pokemonDetailRoute = createRoute({
    getParentRoute: () => authRoute,
    path: 'pokemon/$id',
    loader: async ({ context, params }) => {
        const { PokemonApi } = await import('@/entities/pokemon');
        const api = inject.provide(PokemonApi, context.scope);

        // prefetch: не блокирует, useResource подхватит уже идущий запрос.
        api.detail.trigger(params.id);
    },
    component: lazyRouteComponent(() => import('@/pages/pokemon-detail'), 'PokemonDetailPage'),
});

const postsListRoute = createRoute({
    getParentRoute: () => authRoute,
    path: 'posts',
    loader: async ({ context }) => {
        const { PostApi } = await import('@/entities/post');
        const api = inject.provide(PostApi, context.scope);

        // prefetch: не блокирует.
        api.list.trigger(undefined);
    },
    component: lazyRouteComponent(() => import('@/pages/posts'), 'PostsListPage'),
});

const postDetailRoute = createRoute({
    getParentRoute: () => authRoute,
    path: 'posts/$id',
    loader: async ({ context, params }) => {
        const { PostApi } = await import('@/entities/post');
        const api = inject.provide(PostApi, context.scope);

        // prefetch: не блокирует.
        api.detail.trigger(Number(params.id));
    },
    component: lazyRouteComponent(() => import('@/pages/post-detail'), 'PostDetailPage'),
});

const routeTree = rootRoute.addChildren([
    homeRoute,
    loginRoute,
    authRoute.addChildren([
        pokemonListRoute,
        pokemonDetailRoute,
        postsListRoute,
        postDetailRoute,
    ]),
]);

export const router = createRouter({
    routeTree,
    context: { scope: rootScope },
    defaultPreload: 'intent',
    // «Свежесть» данных принадлежит rx-toolkit, а не роутеру — отдаём её кэшу.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
});

const authStore = inject(AuthStore);

authStore.isAuthenticated$.obs.subscribe((value) => {
    if (value) return;
    // Логаут: уничтожаем приватный скоуп со всем приватным кэшем, затем уводим
    // на публичную главную.
    disposeAuthScope();
    router.navigate({ to: '/' }).catch(console.error);
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
