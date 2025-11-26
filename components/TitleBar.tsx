import { useState } from 'react';
import { Window } from '@tauri-apps/api/window';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  // @ts-ignore - Window.getCurrent() might be typed differently depending on version but this is standard
  const appWindow = new Window('main');

  const minimize = () => appWindow.minimize();

  const toggleMaximize = async () => {
    await appWindow.toggleMaximize();
    setIsMaximized(!isMaximized);
  };

  const close = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      className="h-8 bg-military-900/70 backdrop-blur-md flex justify-end items-center select-none fixed top-0 left-0 right-0 z-[9999] border-b border-white/10 text-slate-200"
    >
      <div className="flex h-full relative z-10">
        <button
          onClick={minimize}
          className="px-4 hover:bg-white/10 text-slate-400 hover:text-slate-50 flex items-center justify-center h-full transition-colors focus:outline-none"
          title="Réduire"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={toggleMaximize}
          className="px-4 hover:bg-white/10 text-slate-400 hover:text-slate-50 flex items-center justify-center h-full transition-colors focus:outline-none"
          title={isMaximized ? "Restaurer" : "Agrandir"}
        >
          {isMaximized ? <Square size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={close}
          className="px-4 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center h-full transition-colors focus:outline-none"
          title="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
