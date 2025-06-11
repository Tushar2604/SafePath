import React, { createContext, useContext, useState, ReactNode } from 'react';

type Notification = {
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
};

const NotificationContext = createContext<{
    notification: Notification | null;
    showNotification: (message: string, type?: Notification['type']) => void;
    hideNotification: () => void;
}>({
    notification: null,
    showNotification: () => { },
    hideNotification: () => { },
});

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = (message: string, type: Notification['type'] = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000); // auto-hide after 4s
    };

    const hideNotification = () => setNotification(null);

    return (
        <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}