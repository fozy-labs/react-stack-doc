import { type SyntheticEvent, useMemo, useState } from 'react';
import { inject } from '@fozy-labs/simplest-di';
import { Card, CardBody, Input, Pagination, Skeleton } from '@heroui/react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import { PokemonApi } from '@/entities/pokemon';
import { POKEMON_PAGE_LIMIT } from '@/shared/lib';

function handlePokemonImageError(event: SyntheticEvent<HTMLImageElement>, fallbackImageUrl: string) {
    const image = event.currentTarget;

    if (image.dataset.fallbackApplied === 'true') {
        image.onerror = null;
        return;
    }

    image.dataset.fallbackApplied = 'true';
    image.src = fallbackImageUrl;
}

export function PokemonListPage() {
    const pokemonApi = inject(PokemonApi);
    const navigate = useNavigate();
    const { page } = useSearch({ strict: false }) as { page?: number };
    const currentPage = page ?? 1;
    const [search, setSearch] = useState('');

    const offset = (currentPage - 1) * POKEMON_PAGE_LIMIT;
    const query = pokemonApi.list.useResource({ offset, limit: POKEMON_PAGE_LIMIT });

    const totalPages = query.data ? Math.ceil(query.data.count / POKEMON_PAGE_LIMIT) : 1;

    const filtered = useMemo(() => {
        if (!query.data) return [];
        if (!search) return query.data.results;
        return query.data.results.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [query.data, search]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold">Pokemon</h1>
                <Input
                    placeholder="Filter current page..."
                    value={search}
                    onValueChange={setSearch}
                    isClearable
                    onClear={() => setSearch('')}
                    variant="bordered"
                    size="sm"
                    className="max-w-xs"
                />
            </div>

            {query.isError && (
                <div className="text-center py-12">
                    <p className="text-danger text-lg">Failed to load pokemon</p>
                    <p className="text-default-400 text-sm mt-1">{String(query.error)}</p>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {query.isLoading && Array.from({ length: POKEMON_PAGE_LIMIT }, (_, i) => (
                    <Card key={i} shadow="sm">
                        <CardBody className="items-center gap-6 p-1 h-44 w-44">
                            <Skeleton className="rounded-lg w-30 h-30 opacity-50"/>
                            <Skeleton className="h-4 w-16 rounded-lg"/>
                        </CardBody>
                    </Card>
                ))}
                {!query.isLoading && filtered.map(pokemon => (
                    <Link
                        key={pokemon.name}
                        to="/pokemon/$id"
                        params={{ id: String(pokemon.id) }}
                        search={{ page: currentPage }}
                        className="block transition-transform hover:scale-[1.03]"
                    >
                        <Card shadow="sm">
                            <CardBody className="items-center gap-1 p-1 h-44 w-44">
                                <img
                                    src={pokemon.imageUrl}
                                    alt={pokemon.name}
                                    className="h-30 w-30 object-contain"
                                    onErrorCapture={(e) => handlePokemonImageError(e, '/pokemon-fallback.png')}
                                />
                                <p className="capitalize text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-32">{pokemon.name}</p>
                                <p className="text-xs text-default-400">#{pokemon.id}</p>
                            </CardBody>
                        </Card>
                    </Link>
                ))}
            </div>

            {filtered.length === 0 && search && (
                <p className="text-center text-default-400 py-8">No pokemon match "{search}"</p>
            )}

            <div className="flex justify-center pt-4">
                <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={(p) => navigate({ to: '/pokemon', search: { page: p } })}
                    showControls
                    color="primary"
                />
            </div>
        </div>
    );
}
