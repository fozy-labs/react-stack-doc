import {
    createRouter,
    createRootRouteWithContext,
    createRoute,
    redirect,
    lazyRouteComponent,
} from '@tanstack/react-router';
import { inject, type Scope } from '@fozy-labs/simplest-di';

import { AuthStore } from '@/features/auth';
import { rootScope, scopeStore } from '@/di';
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

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: RootLayout,
    onEnter: () => {
        rootScope.init();
    }
});

// Публичный лендинг на `/`: гость и состояние «после логаута». Авторизованного
// уводим на его приватную главную `/home`, чтобы он не оказывался на публичном
// `/` вне приватной зоны (иначе выход из зоны уронил бы скоуп через onLeave).
const welcomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => {
        const authStore = inject(AuthStore);

        if (authStore.isAuthenticated$.peek()) {
            throw redirect({ to: '/home' });
        }
    },
    component: lazyRouteComponent(() => import('@/pages/welcome'), 'WelcomePage'),
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'login',
    beforeLoad: () => {
        const authStore = inject(AuthStore);

        // Гость-онли: уже авторизованного уводим на приватную главную.
        if (authStore.isAuthenticated$.peek()) {
            throw redirect({ to: '/home' });
        }
    },
    component: lazyRouteComponent(() => import('@/pages/login'), 'LoginPage'),
});

// Ключ priviate скоупа в сторе.
const PRIVATE_SCOPE_KEY = 'authenticated';

/**
 * Pathless layout приватной зоны (id вместо path). Здесь живёт auth-гард и
 * подмена scope: для всего поддерева context.scope становится приватным —
 * зонным скоупом из стора, общим для лоадеров и компонентов.
 */
const privateRoute = createRoute({
    id: 'authenticated',
    getParentRoute: () => rootRoute,
    beforeLoad() {
        const auth = inject(AuthStore);

        if (!auth.isAuthenticated$.peek()) {
            throw redirect({ to: '/login' });
        }

        // beforeLoad бежит на каждую навигацию внутри зоны, поэтому `acquire`
        // (взять-или-создать) возвращает ОДИН и тот же скоуп зоны — без
        // пересоздания на каждом переходе.
        return { scope: scopeStore.acquire(PRIVATE_SCOPE_KEY) };
    },
    // init/dispose привязаны к реальному входу/выходу зоны (onEnter/onLeave —
    // по разу), а не к beforeLoad. На выходе скоуп каскадно гаснет и удаляется
    // из стора; повторный вход создаст свежий.
    onEnter() {
        scopeStore.init(PRIVATE_SCOPE_KEY);
    },
    onLeave() {
        scopeStore.dispose(PRIVATE_SCOPE_KEY);
    },
    component: AuthenticatedLayout,
});

// Приватная главная (дашборд). Внутри `privateRoute`, поэтому переход на неё «домой»
// не покидает приватную зону и не роняет скоуп. Лоадер не нужен — данные разделов
// грузятся на своих роутах.
const homeRoute = createRoute({
    getParentRoute: () => privateRoute,
    path: 'home',
    component: lazyRouteComponent(() => import('@/pages/home'), 'HomePage'),
});

const pokemonListRoute = createRoute({
    getParentRoute: () => privateRoute,
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
    getParentRoute: () => privateRoute,
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
    getParentRoute: () => privateRoute,
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
    getParentRoute: () => privateRoute,
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
    welcomeRoute,
    loginRoute,
    privateRoute.addChildren([
        homeRoute,
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
    // Логаут уводит на публичный лендинг `/`.
    router.navigate({ to: '/' }).catch(console.error);
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
