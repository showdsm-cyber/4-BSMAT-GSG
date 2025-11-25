import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    isDangerous = false,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-md rounded-lg shadow-2xl border border-white/10 overflow-hidden transform transition-all scale-100">

                {/* Header */}
                <div className={`p-4 border-b border-white/5 flex justify-between items-center ${isDangerous ? 'bg-red-500/10' : 'bg-black/20'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-100 tracking-wide">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors border border-transparent hover:border-white/10"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-bold text-white rounded shadow-lg transition-all transform active:scale-95 ${isDangerous
                                ? 'bg-red-600 hover:bg-red-500 border border-red-500'
                                : 'bg-blue-600 hover:bg-blue-500 border border-blue-500'
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ConfirmModal;
