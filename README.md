# Fozy-labs React Stack
[![simplest-di on npm](https://img.shields.io/npm/v/%40fozy-labs%2Fsimplest-di.svg?label=%40fozy-labs%2Fsimplest-di)](https://www.npmjs.com/package/@fozy-labs/simplest-di)
[![rx-toolkit on npm](https://img.shields.io/npm/v/%40fozy-labs%2Frx-toolkit.svg?label=%40fozy-labs%2Frx-toolkit)](https://www.npmjs.com/package/@fozy-labs/rx-toolkit)


Стек состоит из двух самостоятельных пакетов, отлично работающих, как вместе, так и по отдельности.

| Пакет | npm | GitHub | Зона ответственности |
|---|---|---|---|
| `@fozy-labs/simplest-di` | [npm](https://www.npmjs.com/package/@fozy-labs/simplest-di) | [github](https://github.com/fozy-labs/simplest-di) | Граф объектов: время жизни, скоупы, React-мост |
| `@fozy-labs/rx-toolkit` | [npm](https://www.npmjs.com/package/@fozy-labs/rx-toolkit) | [github](https://github.com/fozy-labs/rx-toolkit) | Реактивное состояние (`Signal`, `LocalSignal`) и серверное состояние (`createApi` / `createResource` / `createCommand`) |


Разделение ролей в стеке:

- **DI** владеет идентичностью и временем жизни объектов (стораджи, репозитории, API-клиенты).
- **Signals** владеют реактивным локальным состоянием.
- **createApi** владеет серверным состоянием (кеш, мутации, инвалидация).

## 📑 Содержание

- [🧠 Концепция](docs/concepts.md)
- [🚀 Быстрый старт](docs/quick-start.md)
- [🎬 Showcases (pokemons)](./showcases/pokemons)

##  📚 Документация пакетов:

**`@fozy-labs/simplest-di`** — [README](https://github.com/fozy-labs/simplest-di/blob/main/README.md) · [концепции DI](https://github.com/fozy-labs/simplest-di/blob/main/docs/concepts.md) · [React-интеграция](https://github.com/fozy-labs/simplest-di/blob/main/docs/react-integration.md)

**`@fozy-labs/rx-toolkit`** —  [README](https://github.com/fozy-labs/rx-toolkit/blob/main/README.md) · [Signals](https://github.com/fozy-labs/rx-toolkit/blob/main/docs/signals/README.md) · [Query](https://github.com/fozy-labs/rx-toolkit/blob/main/docs/query/README.md) · [React](https://github.com/fozy-labs/rx-toolkit/blob/main/docs/usage/react/README.md) · [DevTools](https://github.com/fozy-labs/rx-toolkit/blob/main/docs/devtools/README.md)
