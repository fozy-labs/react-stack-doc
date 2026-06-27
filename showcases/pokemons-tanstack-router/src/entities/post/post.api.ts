import { injectable } from '@fozy-labs/simplest-di';
import { createApi, reactHooksPlugin } from '@fozy-labs/rx-toolkit';
import type { Post, CreatePostCommandArgs } from './types';

const BASE = 'https://jsonplaceholder.typicode.com';

/**
 * SCOPED: держит собственный `createApi`. Команды демонстрируют связи (links)
 * с оптимистичными обновлениями и патчами кэша списка. Предоставляется в
 * приватный скоуп через `inject.provide(PostApi, scope)` в loader'е роута.
 */
@injectable('SCOPED')
export class PostApi {
    private readonly api = createApi({ keyPrefix: 'posts', plugins: [reactHooksPlugin()] });

    list = this.api.createResource<void, Post[]>({
        key: 'posts-list',
        queryFn: async (_args, signal) => {
            const res = await fetch(`${BASE}/posts`, { signal });
            if (!res.ok) throw new Error('Failed to fetch posts');
            return res.json();
        },
    });

    detail = this.api.createResource<number, Post>({
        key: 'post-detail',
        queryFn: async (id, signal) => {
            const res = await fetch(`${BASE}/posts/${id}`, { signal });
            if (!res.ok) throw new Error(`Post #${id} not found`);
            return res.json();
        },
    });

    create = this.api.createCommand<CreatePostCommandArgs, Post>({
        queryFn: async ({ tempId: _tempId, ...dto }) => {
            const res = await fetch(`${BASE}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto),
            });

            if (!res.ok) {
                throw new Error('Failed to create post');
            }

            return res.json();
        },
        links: (link) => link({
            resource: this.list,
            forwardArgs: () => undefined as void,
            optimisticUpdate: (draft, args) => {
                draft.unshift({
                    id: args.tempId,
                    userId: args.userId,
                    title: args.title,
                    body: args.body,
                });
            },
            update: (draft, args, data) => {
                const tempPostIndex = draft.findIndex((post: Post) => post.id === args.tempId);

                if (tempPostIndex === -1) {
                    draft.unshift(data);
                    return;
                }

                draft[tempPostIndex] = data;
            },
        }),
    });

    delete = this.api.createCommand<number, void>({
        queryFn: async (id) => {
            const res = await fetch(`${BASE}/posts/${id}`, { method: 'DELETE' });

            if (!res.ok) {
                throw new Error(`Failed to delete post #${id}`);
            }
        },
        links: (link) => link({
            resource: this.list,
            forwardArgs: () => undefined as void,
            optimisticUpdate: (draft, args) => {
                const postIndex = draft.findIndex((post: Post) => post.id === args);

                if (postIndex !== -1) {
                    draft.splice(postIndex, 1);
                }
            },
        }),
    });
}
