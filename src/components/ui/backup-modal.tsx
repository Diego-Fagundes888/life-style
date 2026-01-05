"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Download,
    Upload,
    X,
    FileJson,
    CheckCircle2,
    AlertTriangle,
    HardDrive,
    Trash2
} from "lucide-react";
import {
    downloadBackup,
    exportAllData,
    importBackupData,
    getStorageSize,
    clearAllData,
    type BackupData
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BackupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * BackupModal - Modal para exportar/importar backups de dados.
 * Permite ao usuário fazer backup e restaurar seus dados.
 */
export function BackupModal({ isOpen, onClose }: BackupModalProps) {
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<BackupData | null>(null);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const storageInfo = getStorageSize();

    const handleExport = useCallback(() => {
        downloadBackup();
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFile(file);
        setImportStatus('idle');
        setImportError(null);

        // Ler e validar arquivo
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content) as BackupData;

                // Validar estrutura básica
                if (!parsed.version || !parsed.data) {
                    throw new Error('Formato de backup inválido');
                }

                setImportPreview(parsed);
            } catch (error) {
                setImportError(error instanceof Error ? error.message : 'Erro ao ler arquivo');
                setImportPreview(null);
            }
        };
        reader.readAsText(file);
    }, []);

    const handleImport = useCallback(() => {
        if (!importPreview) return;

        try {
            const success = importBackupData(importPreview);
            if (success) {
                setImportStatus('success');
                // Recarregar após 1.5s
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error('Falha ao importar dados');
            }
        } catch (error) {
            setImportStatus('error');
            setImportError(error instanceof Error ? error.message : 'Erro ao importar');
        }
    }, [importPreview]);

    const handleClearData = useCallback(() => {
        if (confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) {
            clearAllData();
            window.location.reload();
        }
    }, []);

    const resetImport = useCallback(() => {
        setImportFile(null);
        setImportPreview(null);
        setImportStatus('idle');
        setImportError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "w-full max-w-lg mx-4 p-6",
                            "bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl"
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">
                                Backup & Restauração
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Storage Info */}
                        <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <HardDrive className="h-5 w-5 text-zinc-400" />
                                <span className="text-sm text-zinc-300">Armazenamento Local</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all",
                                            storageInfo.percentage > 80 ? "bg-red-500" :
                                                storageInfo.percentage > 50 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${storageInfo.percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-zinc-400">
                                    {(storageInfo.used / 1024).toFixed(1)} KB / {(storageInfo.total / 1024 / 1024).toFixed(0)} MB
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('export')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl",
                                    "text-sm font-medium transition-colors",
                                    activeTab === 'export'
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                                )}
                            >
                                <Download className="h-4 w-4" />
                                Exportar
                            </button>
                            <button
                                onClick={() => { setActiveTab('import'); resetImport(); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl",
                                    "text-sm font-medium transition-colors",
                                    activeTab === 'import'
                                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                                )}
                            >
                                <Upload className="h-4 w-4" />
                                Importar
                            </button>
                        </div>

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'export' ? (
                                <motion.div
                                    key="export"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <p className="text-sm text-zinc-400 mb-4">
                                        Faça download de todos os seus dados em um arquivo JSON.
                                        Você pode usar este arquivo para restaurar seus dados
                                        em outro dispositivo ou após limpar o navegador.
                                    </p>

                                    <Button
                                        onClick={handleExport}
                                        className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Download className="h-5 w-5 mr-2" />
                                        Baixar Backup Completo
                                    </Button>

                                    <div className="mt-6 pt-6 border-t border-zinc-800">
                                        <button
                                            onClick={handleClearData}
                                            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Apagar todos os dados
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="import"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    {importStatus === 'success' ? (
                                        <div className="text-center py-8">
                                            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-white mb-2">
                                                Importação Concluída!
                                            </h3>
                                            <p className="text-sm text-zinc-400">
                                                Recarregando página...
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* File Input */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".json"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />

                                            {!importFile ? (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={cn(
                                                        "w-full p-8 border-2 border-dashed border-zinc-700 rounded-xl",
                                                        "hover:border-blue-500/50 hover:bg-zinc-800/50 transition-colors",
                                                        "flex flex-col items-center gap-3"
                                                    )}
                                                >
                                                    <FileJson className="h-12 w-12 text-zinc-500" />
                                                    <span className="text-sm text-zinc-400">
                                                        Clique para selecionar arquivo de backup
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        Formato: JSON (.json)
                                                    </span>
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* File preview */}
                                                    <div className="p-4 bg-zinc-800/50 rounded-xl">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <FileJson className="h-8 w-8 text-blue-400" />
                                                            <div>
                                                                <p className="font-medium text-white">
                                                                    {importFile.name}
                                                                </p>
                                                                <p className="text-xs text-zinc-500">
                                                                    {(importFile.size / 1024).toFixed(1)} KB
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={resetImport}
                                                                className="ml-auto p-2 text-zinc-400 hover:text-white"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        {importPreview && (
                                                            <div className="text-xs text-zinc-400 space-y-1">
                                                                <p>Versão: {importPreview.version}</p>
                                                                <p>Exportado em: {new Date(importPreview.exportedAt).toLocaleDateString('pt-BR')}</p>
                                                                <p>Categorias: {Object.keys(importPreview.data).length}</p>
                                                            </div>
                                                        )}

                                                        {importError && (
                                                            <div className="flex items-center gap-2 mt-3 text-red-400">
                                                                <AlertTriangle className="h-4 w-4" />
                                                                <span className="text-sm">{importError}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Import button */}
                                                    {importPreview && !importError && (
                                                        <>
                                                            <p className="text-xs text-amber-400 flex items-center gap-2">
                                                                <AlertTriangle className="h-4 w-4" />
                                                                Atenção: Isso substituirá todos os dados atuais!
                                                            </p>
                                                            <Button
                                                                onClick={handleImport}
                                                                className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white"
                                                            >
                                                                <Upload className="h-5 w-5 mr-2" />
                                                                Restaurar Backup
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
