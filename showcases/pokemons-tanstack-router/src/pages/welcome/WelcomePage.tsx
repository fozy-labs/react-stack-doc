import { Button } from '@heroui/react';
import { Link } from '@tanstack/react-router';

/**
 * Публичный лендинг на `/`. Доступен гостю и состоянию «после логаута».
 * Авторизованного на этот роут не пускает гард `welcomeRoute.beforeLoad`
 * (уводит на приватную `/home`), поэтому здесь нет обращений к приватным
 * сервисам и проверок сессии.
 */
export function WelcomePage() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-20">
            <h1 className="text-4xl font-bold text-center">RX Toolkit × TanStack Router</h1>
            <p className="text-lg text-default-500 text-center max-w-lg">
                A demo app showcasing reactive state management with Signals, Resource queries, Commands, and DI — wired into TanStack Router loaders and scopes.
            </p>
            <Button as={Link} to="/login" color="primary" size="lg">
                Get Started
            </Button>
        </div>
    );
}
