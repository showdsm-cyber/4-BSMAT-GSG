import { useState, useEffect } from 'react';
import { Window } from '@tauri-apps/api/window';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);
    // @ts-ignore - Window.getCurrent() might be typed differently depending on version but this is standard
    const appWindow = new Window('main');

    useEffect(() => {
        // Initial check
        // We can't easily listen to resize events without more complex setup, 
        // so we'll update state on click
    }, []);

    const minimize = () => appWindow.minimize();

    const toggleMaximize = async () => {
        await appWindow.toggleMaximize();
        setIsMaximized(!isMaximized);
    };

    const close = () => appWindow.close();

    return (
        <div data-tauri-drag-region className="h-8 bg-white dark:bg-gray-900 flex justify-end items-center select-none fixed top-0 left-0 right-0 z-[9999] border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
            {/* Drag region overlay to ensure dragging works everywhere except buttons */}
            <div className="absolute inset-0" data-tauri-drag-region></div>

            <div className="flex h-full relative z-10">
                <button
                    onClick={minimize}
                    className="px-4 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-center h-full transition-colors focus:outline-none"
                    title="Réduire"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={toggleMaximize}
                    className="px-4 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-center h-full transition-colors focus:outline-none"
                    title={isMaximized ? "Restaurer" : "Agrandir"}
                >
                    {isMaximized ? <Square size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                    onClick={close}
                    className="px-4 hover:bg-red-600 text-gray-600 dark:text-gray-400 hover:text-white flex items-center justify-center h-full transition-colors focus:outline-none"
                    title="Fermer"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
