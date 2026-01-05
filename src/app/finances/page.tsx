"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    PiggyBank,
    Target,
    Eye,
    EyeOff,
    Plus,
    X,
    Home,
    ChevronUp,
    ChevronDown,
    Settings,
    Pencil,
    Trash2,
    Check,
    History,
    DollarSign,
    Sparkles,
    Trophy,
    Zap,
    Calendar,
    Heart,
    Shield
} from "lucide-react";
import { useRouter } from "next/navigation";
import { WealthChart } from "@/components/finances/WealthChart";
import { AllocationChart } from "@/components/finances/AllocationChart";
import { formatCurrency, formatPercentage, formatCurrencyDiff } from "@/lib/formatUtils";
import { getStoredData, setStoredData, STORAGE_KEYS } from "@/lib/store";
import { FloatingDock } from "@/components/dashboard/FloatingDock";

// ============================================================================
// TYPES
// ============================================================================

interface FinancialSnapshot {
    id: string;
    date: string;
    month: string;
    bankBalance: number;
    investments: number;
    monthlyExpenses: number;
    netWorth: number;
}

interface AssetAllocation {
    id: string;
    name: string;
    value: number;
    color: string;
}

interface FinanceData {
    snapshots: FinancialSnapshot[];
    spendingLimit: number;
    currentSpending: number;
    monthlyIncome: number;
    assetAllocation: AssetAllocation[];
}

// ============================================================================
// CONSTANTS & COLORS - Dark Academia Palette
// ============================================================================

const ASSET_COLORS = [
    "#CCAE70", // gold
    "#8C9E78", // olive
    "#768C9E", // slate
    "#D99E6B", // clay
    "#C87F76", // rust
    "#A89078", // tan
    "#8B7355", // wood
    "#6B5B4F", // dark wood
];

// ============================================================================
// FINANCIAL LEVEL SYSTEM
// ============================================================================

interface FinancialLevel {
    id: number;
    name: string;
    icon: string;
    minNetWorth: number;
    maxNetWorth: number;
    color: string;
    bgColor: string;
}

const FINANCIAL_LEVELS: FinancialLevel[] = [
    { id: 1, name: "Iniciante", icon: "🌱", minNetWorth: 0, maxNetWorth: 10000, color: "#8C9E78", bgColor: "rgba(140,158,120,0.15)" },
    { id: 2, name: "Poupador", icon: "💵", minNetWorth: 10000, maxNetWorth: 50000, color: "#8C9E78", bgColor: "rgba(140,158,120,0.15)" },
    { id: 3, name: "Investidor", icon: "📈", minNetWorth: 50000, maxNetWorth: 200000, color: "#CCAE70", bgColor: "rgba(204,174,112,0.15)" },
    { id: 4, name: "Construtor", icon: "💎", minNetWorth: 200000, maxNetWorth: 500000, color: "#D99E6B", bgColor: "rgba(217,158,107,0.15)" },
    { id: 5, name: "Milionário", icon: "👑", minNetWorth: 500000, maxNetWorth: Infinity, color: "#CCAE70", bgColor: "rgba(204,174,112,0.2)" },
];

function getFinancialLevel(netWorth: number): FinancialLevel {
    for (let i = FINANCIAL_LEVELS.length - 1; i >= 0; i--) {
        if (netWorth >= FINANCIAL_LEVELS[i].minNetWorth) {
            return FINANCIAL_LEVELS[i];
        }
    }
    return FINANCIAL_LEVELS[0];
}

function getNextLevel(netWorth: number): FinancialLevel | null {
    const current = getFinancialLevel(netWorth);
    const nextIndex = FINANCIAL_LEVELS.findIndex(l => l.id === current.id) + 1;
    return nextIndex < FINANCIAL_LEVELS.length ? FINANCIAL_LEVELS[nextIndex] : null;
}

function getLevelProgress(netWorth: number): number {
    const current = getFinancialLevel(netWorth);
    const next = getNextLevel(netWorth);
    if (!next) return 100;
    const progressInLevel = netWorth - current.minNetWorth;
    const levelRange = next.minNetWorth - current.minNetWorth;
    return Math.round((progressInLevel / levelRange) * 100);
}

const DEFAULT_DATA: FinanceData = {
    snapshots: [
        { id: "1", date: "2025-07-01", month: "Jul", bankBalance: 15000, investments: 125000, monthlyExpenses: 3500, netWorth: 140000 },
        { id: "2", date: "2025-08-01", month: "Ago", bankBalance: 18000, investments: 127000, monthlyExpenses: 3200, netWorth: 145000 },
        { id: "3", date: "2025-09-01", month: "Set", bankBalance: 20000, investments: 128000, monthlyExpenses: 3800, netWorth: 148000 },
        { id: "4", date: "2025-10-01", month: "Out", bankBalance: 22000, investments: 130000, monthlyExpenses: 3100, netWorth: 152000 },
        { id: "5", date: "2025-11-01", month: "Nov", bankBalance: 19000, investments: 136000, monthlyExpenses: 4200, netWorth: 155000 },
        { id: "6", date: "2025-12-01", month: "Dez", bankBalance: 25000, investments: 140000, monthlyExpenses: 3600, netWorth: 165000 },
    ],
    spendingLimit: 4000,
    currentSpending: 2800,
    monthlyIncome: 8000,
    assetAllocation: [
        { id: "1", name: "Caixa (Liquidez)", value: 25000, color: "#CCAE70" },
        { id: "2", name: "Ações/FIIs", value: 85000, color: "#8C9E78" },
        { id: "3", name: "Reserva Emergência", value: 30000, color: "#768C9E" },
        { id: "4", name: "Cripto/Risco", value: 15000, color: "#D99E6B" },
        { id: "5", name: "Objetivos", value: 10000, color: "#C87F76" },
    ],
};

// ============================================================================
// ANIMATED COUNTER COMPONENT
// ============================================================================

function AnimatedCounter({ value, duration = 1500, isBlurred = false }: { value: number; duration?: number; isBlurred?: boolean }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;
        const startValue = displayValue;
        const difference = value - startValue;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(startValue + difference * easeOutQuart);
            if (progress < 1) animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return (
        <span className={`transition-all duration-300 ${isBlurred ? "blur-lg" : ""}`}>
            {formatCurrency(displayValue)}
        </span>
    );
}

// ============================================================================
// BURN RATE BAR COMPONENT - Dark Academia
// ============================================================================

function BurnRateBar({ current, limit, isBlurred = false }: { current: number; limit: number; isBlurred?: boolean }) {
    const percentage = Math.min((current / limit) * 100, 120);
    const getColor = () => {
        if (percentage >= 100) return "bg-[#C87F76]"; // rust
        if (percentage >= 75) return "bg-[#D99E6B]"; // clay
        return "bg-[#8C9E78]"; // olive
    };

    return (
        <div className={`transition-all duration-300 ${isBlurred ? "blur-md" : ""}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[#9B9B9B] text-sm">Gasto Atual vs. Teto</span>
                <span className="text-sm font-medium text-[#E3E3E3]">
                    {formatCurrency(current)} de {formatCurrency(limit)}
                </span>
            </div>
            <div className="h-4 bg-[#2C2C2C] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${getColor()} ${percentage >= 100 ? "animate-pulse" : ""}`}
                />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-[#5A5A5A]">
                <span>{percentage.toFixed(0)}% utilizado</span>
                <span>Restante: {formatCurrency(Math.max(limit - current, 0))}</span>
            </div>
        </div>
    );
}

// ============================================================================
// SNAPSHOT MODAL COMPONENT - Dark Academia
// ============================================================================

function SnapshotModal({ isOpen, onClose, onSave }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { bankBalance: number; investments: number; expenses: number }) => void;
}) {
    const [bankBalance, setBankBalance] = useState("");
    const [investments, setInvestments] = useState("");
    const [expenses, setExpenses] = useState("");

    const handleSave = () => {
        onSave({
            bankBalance: parseFloat(bankBalance) || 0,
            investments: parseFloat(investments) || 0,
            expenses: parseFloat(expenses) || 0,
        });
        setBankBalance("");
        setInvestments("");
        setExpenses("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md">
                <div className="bg-[#202020] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(140,158,120,0.15)] flex items-center justify-center">
                                <PiggyBank className="w-5 h-5 text-[#8C9E78]" />
                            </div>
                            <div>
                                <h2 className="font-serif text-lg font-medium text-[#E3E3E3]">Fechamento de Mês</h2>
                                <p className="text-xs text-[#5A5A5A]">Atualize seu snapshot</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#5A5A5A]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-[#9B9B9B] mb-1.5">💳 Saldo no Banco</label>
                            <input type="number" value={bankBalance} onChange={(e) => setBankBalance(e.target.value)} placeholder="Ex: 15000" className="w-full px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#E3E3E3] placeholder-[#5A5A5A] focus:outline-none focus:ring-2 focus:ring-[rgba(204,174,112,0.5)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[#9B9B9B] mb-1.5">📈 Investimentos</label>
                            <input type="number" value={investments} onChange={(e) => setInvestments(e.target.value)} placeholder="Ex: 80000" className="w-full px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#E3E3E3] placeholder-[#5A5A5A] focus:outline-none focus:ring-2 focus:ring-[rgba(204,174,112,0.5)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[#9B9B9B] mb-1.5">🧾 Gasto Mensal</label>
                            <input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} placeholder="Ex: 3500" className="w-full px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#E3E3E3] placeholder-[#5A5A5A] focus:outline-none focus:ring-2 focus:ring-[rgba(204,174,112,0.5)]" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={onClose} className="flex-1 px-4 py-3 bg-[#2C2C2C] hover:bg-[#3A3A3A] text-[#9B9B9B] rounded-lg font-medium transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="flex-1 px-4 py-3 bg-[#E3E3E3] hover:bg-[#D4D4D4] text-[#191919] rounded-lg font-medium transition-colors">Salvar</button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ============================================================================
// ALLOCATION MODAL COMPONENT - Dark Academia
// ============================================================================

function AllocationModal({ isOpen, onClose, allocations, onSave }: {
    isOpen: boolean;
    onClose: () => void;
    allocations: AssetAllocation[];
    onSave: (allocations: AssetAllocation[]) => void;
}) {
    const [items, setItems] = useState<AssetAllocation[]>(allocations);
    const [newName, setNewName] = useState("");
    const [newValue, setNewValue] = useState("");

    useEffect(() => {
        setItems(allocations);
    }, [allocations, isOpen]);

    const addItem = () => {
        if (!newName.trim() || !newValue) return;
        const colorIndex = items.length % ASSET_COLORS.length;
        setItems([...items, {
            id: Date.now().toString(),
            name: newName.trim(),
            value: parseFloat(newValue) || 0,
            color: ASSET_COLORS[colorIndex]
        }]);
        setNewName("");
        setNewValue("");
    };

    const updateItem = (id: string, field: "name" | "value", val: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: field === "value" ? parseFloat(val) || 0 : val } : item
        ));
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSave = () => {
        onSave(items);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-lg max-h-[80vh] overflow-hidden">
                <div className="bg-[#202020] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl">
                    <div className="p-6 border-b border-[rgba(255,255,255,0.05)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[rgba(204,174,112,0.15)] flex items-center justify-center">
                                    <PiggyBank className="w-5 h-5 text-[#CCAE70]" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-lg font-medium text-[#E3E3E3]">Alocação de Ativos</h2>
                                    <p className="text-xs text-[#5A5A5A]">Gerencie suas categorias</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#5A5A5A]"><X className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 bg-[#2C2C2C] rounded-lg p-3">
                                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                                    className="flex-1 bg-transparent text-[#E3E3E3] text-sm focus:outline-none"
                                />
                                <input
                                    type="number"
                                    value={item.value}
                                    onChange={(e) => updateItem(item.id, "value", e.target.value)}
                                    className="w-24 bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-lg text-[#E3E3E3] text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#CCAE70]"
                                />
                                <button onClick={() => deleteItem(item.id)} className="p-1.5 text-[#C87F76]/60 hover:text-[#C87F76] hover:bg-[rgba(200,127,118,0.1)] rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.02)] border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-lg p-3">
                            <Plus className="w-4 h-4 text-[#5A5A5A]" />
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Nova categoria..."
                                className="flex-1 bg-transparent text-[#E3E3E3] text-sm placeholder-[#5A5A5A] focus:outline-none"
                            />
                            <input
                                type="number"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                placeholder="Valor"
                                className="w-24 bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-lg text-[#E3E3E3] text-sm text-right placeholder-[#5A5A5A] focus:outline-none"
                            />
                            <button onClick={addItem} disabled={!newName.trim() || !newValue} className="p-1.5 text-[#8C9E78] hover:bg-[rgba(140,158,120,0.1)] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                <Check className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[rgba(255,255,255,0.05)] flex gap-3">
                        <button onClick={onClose} className="flex-1 px-4 py-3 bg-[#2C2C2C] hover:bg-[#3A3A3A] text-[#9B9B9B] rounded-lg font-medium transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="flex-1 px-4 py-3 bg-[#E3E3E3] hover:bg-[#D4D4D4] text-[#191919] rounded-lg font-medium transition-colors">Salvar</button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ============================================================================
// SETTINGS MODAL COMPONENT - Dark Academia
// ============================================================================

function SettingsModal({ isOpen, onClose, currentLimit, currentIncome, onSave }: {
    isOpen: boolean;
    onClose: () => void;
    currentLimit: number;
    currentIncome: number;
    onSave: (limit: number, income: number) => void;
}) {
    const [limit, setLimit] = useState(currentLimit.toString());
    const [income, setIncome] = useState(currentIncome.toString());

    useEffect(() => {
        setLimit(currentLimit.toString());
        setIncome(currentIncome.toString());
    }, [currentLimit, currentIncome, isOpen]);

    const handleSave = () => {
        onSave(parseFloat(limit) || 0, parseFloat(income) || 0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md">
                <div className="bg-[#202020] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(217,158,107,0.15)] flex items-center justify-center">
                                <Settings className="w-5 h-5 text-[#D99E6B]" />
                            </div>
                            <div>
                                <h2 className="font-serif text-lg font-medium text-[#E3E3E3]">Configurações</h2>
                                <p className="text-xs text-[#5A5A5A]">Ajuste seus limites</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#5A5A5A]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-[#9B9B9B] mb-1.5">📊 Teto de Gastos Mensal</label>
                            <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Ex: 4000" className="w-full px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#E3E3E3] placeholder-[#5A5A5A] focus:outline-none focus:ring-2 focus:ring-[rgba(217,158,107,0.5)]" />
                            <p className="text-xs text-[#5A5A5A] mt-1">Limite máximo de gastos por mês</p>
                        </div>
                        <div>
                            <label className="block text-sm text-[#9B9B9B] mb-1.5">💰 Renda Mensal</label>
                            <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="Ex: 8000" className="w-full px-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#E3E3E3] placeholder-[#5A5A5A] focus:outline-none focus:ring-2 focus:ring-[rgba(217,158,107,0.5)]" />
                            <p className="text-xs text-[#5A5A5A] mt-1">Sua renda mensal para cálculo do savings rate</p>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={onClose} className="flex-1 px-4 py-3 bg-[#2C2C2C] hover:bg-[#3A3A3A] text-[#9B9B9B] rounded-lg font-medium transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="flex-1 px-4 py-3 bg-[#E3E3E3] hover:bg-[#D4D4D4] text-[#191919] rounded-lg font-medium transition-colors">Salvar</button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ============================================================================
// SNAPSHOTS HISTORY MODAL - Dark Academia
// ============================================================================

function HistoryModal({ isOpen, onClose, snapshots, onDelete, onEdit }: {
    isOpen: boolean;
    onClose: () => void;
    snapshots: FinancialSnapshot[];
    onDelete: (id: string) => void;
    onEdit: (snapshot: FinancialSnapshot) => void;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ bankBalance: "", investments: "", expenses: "" });

    const startEdit = (snapshot: FinancialSnapshot) => {
        setEditingId(snapshot.id);
        setEditData({
            bankBalance: snapshot.bankBalance.toString(),
            investments: snapshot.investments.toString(),
            expenses: snapshot.monthlyExpenses.toString()
        });
    };

    const saveEdit = (snapshot: FinancialSnapshot) => {
        onEdit({
            ...snapshot,
            bankBalance: parseFloat(editData.bankBalance) || 0,
            investments: parseFloat(editData.investments) || 0,
            monthlyExpenses: parseFloat(editData.expenses) || 0,
            netWorth: (parseFloat(editData.bankBalance) || 0) + (parseFloat(editData.investments) || 0)
        });
        setEditingId(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="bg-[#202020] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-2xl">
                    <div className="p-6 border-b border-[rgba(255,255,255,0.05)]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[rgba(118,140,158,0.15)] flex items-center justify-center">
                                    <History className="w-5 h-5 text-[#768C9E]" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-lg font-medium text-[#E3E3E3]">Histórico de Snapshots</h2>
                                    <p className="text-xs text-[#5A5A5A]">{snapshots.length} registros</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#5A5A5A]"><X className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {snapshots.slice().reverse().map((snapshot) => (
                            <div key={snapshot.id} className="p-4 border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                {editingId === snapshot.id ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-[#9B9B9B]">
                                            <span className="font-medium text-[#E3E3E3]">{snapshot.month}</span>
                                            <span>•</span>
                                            <span>{snapshot.date}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input type="number" value={editData.bankBalance} onChange={(e) => setEditData({ ...editData, bankBalance: e.target.value })} placeholder="Banco" className="px-3 py-2 bg-[#2C2C2C] rounded-lg text-[#E3E3E3] text-sm focus:outline-none focus:ring-1 focus:ring-[#CCAE70]" />
                                            <input type="number" value={editData.investments} onChange={(e) => setEditData({ ...editData, investments: e.target.value })} placeholder="Invest." className="px-3 py-2 bg-[#2C2C2C] rounded-lg text-[#E3E3E3] text-sm focus:outline-none focus:ring-1 focus:ring-[#CCAE70]" />
                                            <input type="number" value={editData.expenses} onChange={(e) => setEditData({ ...editData, expenses: e.target.value })} placeholder="Gastos" className="px-3 py-2 bg-[#2C2C2C] rounded-lg text-[#E3E3E3] text-sm focus:outline-none focus:ring-1 focus:ring-[#CCAE70]" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-[#9B9B9B] hover:text-[#E3E3E3]">Cancelar</button>
                                            <button onClick={() => saveEdit(snapshot)} className="px-3 py-1.5 text-sm bg-[#E3E3E3] text-[#191919] rounded-lg hover:bg-[#D4D4D4]">Salvar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-medium text-[#E3E3E3]">{snapshot.month}</span>
                                                <span className="text-[#3A3A3A]">•</span>
                                                <span className="text-[#9B9B9B]">{snapshot.date}</span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm">
                                                <span className="text-[#8C9E78]">{formatCurrency(snapshot.netWorth)}</span>
                                                <span className="text-[#5A5A5A]">Gastos: {formatCurrency(snapshot.monthlyExpenses)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => startEdit(snapshot)} className="p-2 text-[#9B9B9B] hover:text-[#E3E3E3] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onDelete(snapshot.id)} className="p-2 text-[#C87F76]/60 hover:text-[#C87F76] hover:bg-[rgba(200,127,118,0.1)] rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-[rgba(255,255,255,0.05)]">
                        <button onClick={onClose} className="w-full px-4 py-3 bg-[#2C2C2C] hover:bg-[#3A3A3A] text-[#9B9B9B] rounded-lg font-medium transition-colors">Fechar</button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ============================================================================
// MAIN COMPONENT - Dark Academia
// ============================================================================

export default function FinancesPage() {
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);
    const [data, setData] = useState<FinanceData>(DEFAULT_DATA);
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    useEffect(() => {
        const stored = getStoredData<any>(STORAGE_KEYS.FINANCES);
        if (stored) {
            const migratedData: FinanceData = {
                ...DEFAULT_DATA,
                ...stored,
                monthlyIncome: stored.monthlyIncome ?? 8000,
                snapshots: (stored.snapshots || []).map((s: any, i: number) => ({
                    ...s,
                    id: s.id || `legacy-${i}-${Date.now()}`
                })),
                assetAllocation: (stored.assetAllocation || []).map((a: any, i: number) => ({
                    ...a,
                    id: a.id || `alloc-${i}-${Date.now()}`
                }))
            };
            setData(migratedData);
        }
        setIsHydrated(true);
    }, []);

    const saveData = useCallback((newData: FinanceData) => {
        setData(newData);
        setStoredData(STORAGE_KEYS.FINANCES, newData);
    }, []);

    const handleSnapshotSave = useCallback((snapshot: { bankBalance: number; investments: number; expenses: number }) => {
        const now = new Date();
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const newSnapshot: FinancialSnapshot = {
            id: Date.now().toString(),
            date: now.toISOString().split("T")[0],
            month: monthNames[now.getMonth()],
            bankBalance: snapshot.bankBalance,
            investments: snapshot.investments,
            monthlyExpenses: snapshot.expenses,
            netWorth: snapshot.bankBalance + snapshot.investments,
        };
        saveData({ ...data, snapshots: [...data.snapshots, newSnapshot], currentSpending: snapshot.expenses });
    }, [data, saveData]);

    const handleAllocationSave = useCallback((allocations: AssetAllocation[]) => {
        saveData({ ...data, assetAllocation: allocations });
    }, [data, saveData]);

    const handleSettingsSave = useCallback((limit: number, income: number) => {
        saveData({ ...data, spendingLimit: limit, monthlyIncome: income });
    }, [data, saveData]);

    const handleSnapshotDelete = useCallback((id: string) => {
        saveData({ ...data, snapshots: data.snapshots.filter(s => s.id !== id) });
    }, [data, saveData]);

    const handleSnapshotEdit = useCallback((updatedSnapshot: FinancialSnapshot) => {
        saveData({ ...data, snapshots: data.snapshots.map(s => s.id === updatedSnapshot.id ? updatedSnapshot : s) });
    }, [data, saveData]);

    const latestSnapshot = data.snapshots[data.snapshots.length - 1];
    const previousSnapshot = data.snapshots[data.snapshots.length - 2];
    const netWorth = latestSnapshot?.netWorth || 0;
    const netWorthChange = previousSnapshot ? netWorth - previousSnapshot.netWorth : 0;
    const netWorthChangePercent = previousSnapshot ? ((netWorthChange / previousSnapshot.netWorth) * 100) : 0;
    const isPositiveChange = netWorthChange >= 0;
    const savingsRate = data.monthlyIncome > 0 ? ((data.monthlyIncome - data.currentSpending) / data.monthlyIncome) * 100 : 0;

    const wealthChartData = data.snapshots.map(s => ({ month: s.month, netWorth: s.netWorth }));
    const allocationChartData = data.assetAllocation.map(a => ({ name: a.name, value: a.value, color: a.color }));

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

    if (!isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Wallet className="w-12 h-12 text-[#CCAE70]" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#191919]/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push("/")} className="p-2 rounded-lg bg-[#2C2C2C] hover:bg-[#3A3A3A] text-[#9B9B9B] hover:text-[#E3E3E3] transition-colors">
                            <Home className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(204,174,112,0.15)] flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-[#CCAE70]" />
                            </div>
                            <div>
                                <h1 className="font-serif text-xl font-medium text-[#E3E3E3]">Finanças</h1>
                                <p className="text-xs text-[#5A5A5A]">Painel de Investidor</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsHistoryModalOpen(true)} className="p-2.5 rounded-lg bg-[#2C2C2C] text-[#9B9B9B] hover:text-[#E3E3E3] transition-colors" title="Histórico">
                            <History className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsSettingsModalOpen(true)} className="p-2.5 rounded-lg bg-[#2C2C2C] text-[#9B9B9B] hover:text-[#E3E3E3] transition-colors" title="Configurações">
                            <Settings className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className={`p-2.5 rounded-lg transition-all ${isPrivacyMode ? "bg-[rgba(200,127,118,0.15)] text-[#C87F76]" : "bg-[#2C2C2C] text-[#9B9B9B] hover:text-[#E3E3E3]"}`} title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}>
                            {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Hero Number - Net Worth */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-gradient-to-br from-[#202020] via-[#252525] to-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-[#CCAE70]" />
                                <span className="text-[#9B9B9B] text-sm font-medium">Patrimônio Total (Net Worth)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {data.monthlyIncome > 0 && (
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgba(118,140,158,0.15)] text-[#768C9E] ${isPrivacyMode ? "blur-sm" : ""}`}>
                                        <DollarSign className="w-3 h-3" />
                                        <span>Savings: {savingsRate.toFixed(0)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                            <h2 className="text-4xl sm:text-5xl font-bold text-[#E3E3E3] tracking-tight">
                                <AnimatedCounter value={netWorth} isBlurred={isPrivacyMode} />
                            </h2>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${isPositiveChange ? "bg-[rgba(140,158,120,0.15)] text-[#8C9E78]" : "bg-[rgba(200,127,118,0.15)] text-[#C87F76]"} ${isPrivacyMode ? "blur-sm" : ""}`}>
                                {isPositiveChange ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span>{formatCurrencyDiff(netWorthChange)}</span>
                                <span className="text-xs opacity-70">({formatPercentage(netWorthChangePercent)})</span>
                            </div>
                        </div>

                        {/* Financial Level Section */}
                        <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <motion.span
                                        className="text-3xl"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {getFinancialLevel(netWorth).icon}
                                    </motion.span>
                                    <div>
                                        <p className="text-sm text-[#9B9B9B]">Nível Financeiro</p>
                                        <p className="text-lg font-semibold" style={{ color: getFinancialLevel(netWorth).color }}>
                                            {getFinancialLevel(netWorth).name}
                                        </p>
                                    </div>
                                </div>
                                {getNextLevel(netWorth) && (
                                    <div className="flex-1 max-w-[300px]">
                                        <div className="flex justify-between text-xs text-[#5A5A5A] mb-1">
                                            <span>{getLevelProgress(netWorth)}% para {getNextLevel(netWorth)?.name}</span>
                                            <span>{formatCurrency(getNextLevel(netWorth)?.minNetWorth || 0)}</span>
                                        </div>
                                        <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${getLevelProgress(netWorth)}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: getFinancialLevel(netWorth).color }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Burn Rate */}
                    <motion.div variants={itemVariants} className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-[#D99E6B]" />
                                <span className="text-[#9B9B9B] text-sm font-medium">Controle de Fluxo</span>
                            </div>
                            <button onClick={() => setIsSettingsModalOpen(true)} className="p-1.5 text-[#5A5A5A] hover:text-[#E3E3E3] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.05)]">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <BurnRateBar current={data.currentSpending} limit={data.spendingLimit} isBlurred={isPrivacyMode} />
                    </motion.div>

                    {/* Asset Allocation */}
                    <motion.div variants={itemVariants} className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <PiggyBank className="w-5 h-5 text-[#CCAE70]" />
                                <span className="text-[#9B9B9B] text-sm font-medium">Alocação de Ativos</span>
                            </div>
                            <button onClick={() => setIsAllocationModalOpen(true)} className="p-1.5 text-[#5A5A5A] hover:text-[#E3E3E3] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.05)]">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="h-[200px]">
                            <AllocationChart data={allocationChartData} isBlurred={isPrivacyMode} />
                        </div>
                    </motion.div>

                    {/* Wealth History Chart */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#8C9E78]" />
                                <span className="text-[#9B9B9B] text-sm font-medium">Histórico de Riqueza</span>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(true)} className="p-1.5 text-[#5A5A5A] hover:text-[#E3E3E3] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.05)]">
                                <History className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="h-[220px]">
                            <WealthChart data={wealthChartData} isBlurred={isPrivacyMode} />
                        </div>
                    </motion.div>

                    {/* ================================================================
                        NEW: INSIGHTS SECTION
                    ================================================================ */}

                    {/* Quick Stats Grid - 4 mini cards */}
                    <motion.div variants={itemVariants} className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Average Monthly Expenses */}
                        <div className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 hover:border-[rgba(200,127,118,0.3)] transition-all group">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-[rgba(200,127,118,0.15)] rounded-lg">
                                    <TrendingDown className="w-4 h-4 text-[#C87F76]" />
                                </div>
                                <span className="text-xs text-[#5A5A5A]">Média Mensal</span>
                            </div>
                            <p className={`text-xl font-bold text-[#C87F76] ${isPrivacyMode ? "blur-sm" : ""}`}>
                                {formatCurrency(data.snapshots.reduce((sum, s) => sum + s.monthlyExpenses, 0) / data.snapshots.length)}
                            </p>
                            <p className="text-xs text-[#5A5A5A] mt-1">gastos/mês</p>
                        </div>

                        {/* Best Month */}
                        <div className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 hover:border-[rgba(140,158,120,0.3)] transition-all group">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-[rgba(140,158,120,0.15)] rounded-lg">
                                    <Trophy className="w-4 h-4 text-[#8C9E78]" />
                                </div>
                                <span className="text-xs text-[#5A5A5A]">Melhor Mês</span>
                            </div>
                            <p className="text-xl font-bold text-[#8C9E78]">
                                {data.snapshots.reduce((best, s) => (s.netWorth - (data.snapshots[data.snapshots.indexOf(s) - 1]?.netWorth || s.netWorth)) > (best.growth || 0) ? { month: s.month, growth: s.netWorth - (data.snapshots[data.snapshots.indexOf(s) - 1]?.netWorth || s.netWorth) } : best, { month: "--", growth: 0 }).month}
                            </p>
                            <p className="text-xs text-[#5A5A5A] mt-1">maior crescimento</p>
                        </div>

                        {/* Runway (how many months you can survive) */}
                        <div className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 hover:border-[rgba(118,140,158,0.3)] transition-all group">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-[rgba(118,140,158,0.15)] rounded-lg">
                                    <Shield className="w-4 h-4 text-[#768C9E]" />
                                </div>
                                <span className="text-xs text-[#5A5A5A]">Runway</span>
                            </div>
                            <p className={`text-xl font-bold text-[#768C9E] ${isPrivacyMode ? "blur-sm" : ""}`}>
                                {Math.floor(netWorth / (data.snapshots.reduce((sum, s) => sum + s.monthlyExpenses, 0) / data.snapshots.length))} meses
                            </p>
                            <p className="text-xs text-[#5A5A5A] mt-1">de reserva</p>
                        </div>

                        {/* Financial Health Score */}
                        <div className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 hover:border-[rgba(204,174,112,0.3)] transition-all group">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-[rgba(204,174,112,0.15)] rounded-lg">
                                    <Heart className="w-4 h-4 text-[#CCAE70]" />
                                </div>
                                <span className="text-xs text-[#5A5A5A]">Saúde Financeira</span>
                            </div>
                            <p className="text-xl font-bold text-[#CCAE70]">
                                {Math.min(100, Math.round((savingsRate * 0.4) + (Math.min(netWorth / 100000, 1) * 30) + (netWorthChangePercent > 0 ? 30 : 15)))}/100
                            </p>
                            <p className="text-xs text-[#5A5A5A] mt-1">score geral</p>
                        </div>
                    </motion.div>

                    {/* Monthly Insights Card */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-gradient-to-br from-[#202020] via-[#1a1a1a] to-[#252525] border border-[rgba(204,174,112,0.15)] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-[rgba(204,174,112,0.15)] rounded-lg">
                                <Sparkles className="w-5 h-5 text-[#CCAE70]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#E3E3E3]">Insights do Mês</h3>
                        </div>
                        <div className="space-y-4">
                            {/* Insight 1 - Growth */}
                            <div className="flex items-start gap-3 p-3 bg-[rgba(140,158,120,0.08)] rounded-lg border border-[rgba(140,158,120,0.15)]">
                                <TrendingUp className="w-5 h-5 text-[#8C9E78] mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm text-[#E3E3E3]">
                                        Seu patrimônio cresceu <span className="font-bold text-[#8C9E78]">{formatPercentage(netWorthChangePercent)}</span> este mês!
                                    </p>
                                    <p className="text-xs text-[#5A5A5A] mt-1">
                                        {netWorthChangePercent > 5 ? "Excelente! Continue assim!" : netWorthChangePercent > 0 ? "Bom progresso, mantenha o ritmo!" : "Fique atento aos gastos."}
                                    </p>
                                </div>
                            </div>

                            {/* Insight 2 - Savings Rate */}
                            <div className="flex items-start gap-3 p-3 bg-[rgba(118,140,158,0.08)] rounded-lg border border-[rgba(118,140,158,0.15)]">
                                <PiggyBank className="w-5 h-5 text-[#768C9E] mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm text-[#E3E3E3]">
                                        Taxa de poupança: <span className="font-bold text-[#768C9E]">{savingsRate.toFixed(0)}%</span>
                                    </p>
                                    <p className="text-xs text-[#5A5A5A] mt-1">
                                        {savingsRate > 50 ? "Acima da média! Você está construindo riqueza rapidamente." : savingsRate > 20 ? "Acima da média nacional de 20%." : "Tente aumentar sua taxa de poupança."}
                                    </p>
                                </div>
                            </div>

                            {/* Insight 3 - Projection */}
                            <div className="flex items-start gap-3 p-3 bg-[rgba(204,174,112,0.08)] rounded-lg border border-[rgba(204,174,112,0.15)]">
                                <Zap className="w-5 h-5 text-[#CCAE70] mt-0.5 shrink-0" />
                                <div>
                                    <p className={`text-sm text-[#E3E3E3] ${isPrivacyMode ? "blur-sm" : ""}`}>
                                        Se manter esse ritmo, você alcança <span className="font-bold text-[#CCAE70]">{formatCurrency(getNextLevel(netWorth)?.minNetWorth || netWorth * 2)}</span>
                                    </p>
                                    <p className={`text-xs text-[#5A5A5A] mt-1 ${isPrivacyMode ? "blur-sm" : ""}`}>
                                        em ~{netWorthChange > 0 ? Math.ceil(((getNextLevel(netWorth)?.minNetWorth || netWorth * 2) - netWorth) / netWorthChange) : "?"} meses
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Financial Milestones */}
                    <motion.div variants={itemVariants} className="bg-[#202020] border border-[rgba(255,255,255,0.05)] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-[rgba(217,158,107,0.15)] rounded-lg">
                                <Target className="w-5 h-5 text-[#D99E6B]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#E3E3E3]">Marcos Financeiros</h3>
                        </div>
                        <div className="space-y-4">
                            {/* Milestone 1 - Emergency Fund */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[#E3E3E3]">🛡️ Reserva 12 meses</span>
                                    <span className={`text-[#768C9E] ${isPrivacyMode ? "blur-sm" : ""}`}>
                                        {Math.min(100, Math.round((netWorth / (data.currentSpending * 12)) * 100))}%
                                    </span>
                                </div>
                                <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (netWorth / (data.currentSpending * 12)) * 100)}%` }}
                                        transition={{ duration: 1, delay: 0.8 }}
                                        className="h-full bg-[#768C9E] rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Milestone 2 - Construtor Level */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[#E3E3E3]">💎 Nível Construtor</span>
                                    <span className={`text-[#D99E6B] ${isPrivacyMode ? "blur-sm" : ""}`}>
                                        {Math.min(100, Math.round((netWorth / 200000) * 100))}%
                                    </span>
                                </div>
                                <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (netWorth / 200000) * 100)}%` }}
                                        transition={{ duration: 1, delay: 1 }}
                                        className="h-full bg-[#D99E6B] rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Milestone 3 - Half Million */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-[#E3E3E3]">👑 Meio Milhão</span>
                                    <span className={`text-[#CCAE70] ${isPrivacyMode ? "blur-sm" : ""}`}>
                                        {Math.min(100, Math.round((netWorth / 500000) * 100))}%
                                    </span>
                                </div>
                                <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (netWorth / 500000) * 100)}%` }}
                                        transition={{ duration: 1, delay: 1.2 }}
                                        className="h-full bg-[#CCAE70] rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </main>

            {/* FAB */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                onClick={() => setIsSnapshotModalOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#E3E3E3] hover:bg-[#D4D4D4] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-40"
            >
                <Plus className="w-6 h-6 text-[#191919]" />
            </motion.button>

            {/* Modals */}
            <SnapshotModal isOpen={isSnapshotModalOpen} onClose={() => setIsSnapshotModalOpen(false)} onSave={handleSnapshotSave} />
            <AllocationModal isOpen={isAllocationModalOpen} onClose={() => setIsAllocationModalOpen(false)} allocations={data.assetAllocation} onSave={handleAllocationSave} />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} currentLimit={data.spendingLimit} currentIncome={data.monthlyIncome} onSave={handleSettingsSave} />
            <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} snapshots={data.snapshots} onDelete={handleSnapshotDelete} onEdit={handleSnapshotEdit} />

            {/* Floating Dock */}
            <FloatingDock />
        </div>
    );
}
