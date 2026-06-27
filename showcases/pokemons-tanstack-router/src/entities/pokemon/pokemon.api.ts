import { injectable } from '@fozy-labs/simplest-di';
import { createApi, reactHooksPlugin } from '@fozy-labs/rx-toolkit';
import type { PokemonDetail, PokemonListItem, PokemonListResponse } from './types';
import { normalizePokemonListItem } from './pokemon.utils';

/**
 * SCOPED: резолвится в приватном скоупе. Держит собственный `createApi`, поэтому
 * его кэш живёт и умирает вместе с приватным скоупом (исчезает при логауте).
 *
 * Самодостаточен (никаких вложенных `inject`), поэтому предоставляется в скоуп
 * простым `inject.provide(PokemonApi, scope)` в loader'е роута — без runInScope.
 */
@injectable('SCOPED')
export class PokemonApi {
    private readonly api = createApi({ keyPrefix: 'pokemon', plugins: [reactHooksPlugin()] });

    list = this.api.createResource<{ offset: number; limit: number }, PokemonListResponse>({
        key: 'pokemon-list',
        queryFn: async ({ offset, limit }, signal) => {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`, { signal });
            if (!res.ok) throw new Error('Failed to fetch pokemon list');

            const data = await res.json() as {
                count: number;
                results: Array<Pick<PokemonListItem, 'name' | 'url'>>;
            };

            return {
                ...data,
                results: data.results.map(normalizePokemonListItem),
            };
        },
    });

    detail = this.api.createResource<string, PokemonDetail>({
        key: 'pokemon-detail',
        queryFn: async (nameOrId, signal) => {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId}`, { signal });
            if (!res.ok) throw new Error(`Pokemon "${nameOrId}" not found`);
            return res.json();
        },
    });
}
