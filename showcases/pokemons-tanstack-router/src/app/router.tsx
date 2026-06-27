import {
    createRouter,
    createRootRouteWithContext,
    createRoute,
    redirect,
    lazyRouteComponent,
} from '@tanstack/react-router';
import { inject, type Scope } from '@fozy-labs/simplest-di';

import { AuthStore } from '@/features/auth';
import { rootScope } from '@/di';

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
        // Гость-онли: уже авторизованного уводим на главную.
        if (inject(AuthStore).isAuthenticated$.peek()) {
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
    beforeLoad: ({ context }) => {
        const auth = inject(AuthStore);

        if (!auth.isAuthenticated$.peek()) {
            throw redirect({ to: '/login' });
        }

        // Подменяем scope зоны: приватный скоуп (дочерний от rootScope).
        return { scope: auth.getPrivateScope(context.scope) };
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
    loader: async ({ context }) => {
        const { PokemonApi } = await import('@/entities/pokemon');
        inject.provide(PokemonApi, context.scope);
    },
    component: lazyRouteComponent(() => import('@/pages/pokemon'), 'PokemonListPage'),
});

const pokemonDetailRoute = createRoute({
    getParentRoute: () => authRoute,
    path: 'pokemon/$id',
    loader: async ({ context }) => {
        const { PokemonApi } = await import('@/entities/pokemon');
        inject.provide(PokemonApi, context.scope);
    },
    component: lazyRouteComponent(() => import('@/pages/pokemon-detail'), 'PokemonDetailPage'),
});

const postsListRoute = createRoute({
    getParentRoute: () => authRoute,
    path: 'posts',
    loader: async ({ context }) => {
        const { PostApi } = await import('@/entities/post');
        inject.provide(PostApi, context.scope);
    },
    component: lazyRouteComponent(() => import('@/pages/posts'), 'PostsListPage'),
});

const postDetailRoute = createRoute({
    getParentRoute: () => authRoute,
    path: 'posts/$id',
    loader: async ({ context }) => {
        const { PostApi } = await import('@/entities/post');
        inject.provide(PostApi, context.scope);
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

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
