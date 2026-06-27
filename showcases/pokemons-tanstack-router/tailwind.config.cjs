const path = require('node:path');

// Реальный путь к скомпилированной теме HeroUI через Node-резолв — не зависит
// от раскладки node_modules (pnpm/.pnpm, npm-hoisted и т.д.) и от версии.
const herouiThemeDist = path.join(
    path.dirname(require.resolve('@heroui/theme/package.json')),
    'dist',
);

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        `${herouiThemeDist}/**/*.{js,mjs}`,
    ],
};
