"use client";

import Link from "next/link";
import { useFinanceDataQuery } from "@/lib/db-hooks";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Target, ChevronRight, Plus } from "lucide-react";

/**
 * FinanceWidget - Dark Academia Style
 *
 * Visão macro das finanças com cores terrosas elegantes.
 * Usa gold para sucesso, rust para perigo.
 * Dados carregados do IndexedDB em tempo real.
 */
export function FinanceWidget() {
    const financeData = useFinanceDataQuery();

    // Valores padrão quando não há dados
    const currentBalance = financeData?.currentBalance ?? 0;
    const monthlyBudget = financeData?.monthlyBudget ?? 0;
    const monthlySpent = financeData?.monthlySpent ?? 0;
    const savingsGoal = financeData?.savingsGoal ?? 0;
    const currentSavings = financeData?.currentSavings ?? 0;

    // Estado vazio - usuário ainda não configurou finanças
    const hasNoData = !financeData || (currentBalance === 0 && monthlyBudget === 0 && savingsGoal === 0);

    // Cálculos com proteção contra divisão por zero
    const spentPercentage = monthlyBudget > 0 ? Math.round((monthlySpent / monthlyBudget) * 100) : 0;
    const savingsPercentage = savingsGoal > 0 ? Math.round((currentSavings / savingsGoal) * 100) : 0;
    const isOverBudget = monthlyBudget > 0 && monthlySpent > monthlyBudget;
    const remainingBudget = monthlyBudget - monthlySpent;

    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <Link
                        href="/finances"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <Wallet className="h-5 w-5 text-[#CCAE70]" />
                        <CardTitle className="text-lg font-sans font-medium">Finanças</CardTitle>
                        <ChevronRight className="h-4 w-4 text-[#5A5A5A]" />
                    </Link>
                    {!hasNoData && (
                        <Badge variant={isOverBudget ? "rust" : "olive"}>
                            {isOverBudget ? (
                                <>
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    Acima
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    No Limite
                                </>
                            )}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                {hasNoData ? (
                    /* Estado Vazio - CTA para configurar finanças */
                    <Link
                        href="/finances"
                        className="flex flex-col items-center justify-center py-8 gap-4 rounded-lg border-2 border-dashed border-[rgba(255,255,255,0.1)] hover:border-[#CCAE70]/50 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#CCAE70]/10 flex items-center justify-center group-hover:bg-[#CCAE70]/20 transition-colors">
                            <Plus className="h-6 w-6 text-[#CCAE70]" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-[#E3E3E3]">Configure suas Finanças</p>
                            <p className="text-xs text-[#5A5A5A] mt-1">Adicione seu saldo e metas</p>
                        </div>
                    </Link>
                ) : (
                    /* Dados financeiros reais */
                    <>
                        {/* Saldo Atual */}
                        <div className="space-y-1">
                            <span className="text-sm text-[#9B9B9B]">Saldo Disponível</span>
                            <p className="text-3xl font-bold font-mono text-[#E3E3E3]">
                                {formatCurrency(currentBalance)}
                            </p>
                        </div>

                        {/* Meta de Gastos */}
                        {monthlyBudget > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[#9B9B9B]">Gastos Mensais</span>
                                    <span className={isOverBudget ? "text-[#C87F76]" : "text-[#8C9E78]"}>
                                        {formatCurrency(monthlySpent)} / {formatCurrency(monthlyBudget)}
                                    </span>
                                </div>
                                <Progress
                                    value={Math.min(spentPercentage, 100)}
                                    variant={isOverBudget ? "rust" : spentPercentage > 80 ? "clay" : "olive"}
                                    size="md"
                                />
                                <p className="text-xs text-[#5A5A5A]">
                                    {isOverBudget ? (
                                        <span className="text-[#C87F76]">
                                            Orçamento estourado em {formatCurrency(Math.abs(remainingBudget))}
                                        </span>
                                    ) : (
                                        <span>
                                            Disponível: {formatCurrency(remainingBudget)}
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Meta de Economia */}
                        {savingsGoal > 0 && (
                            <div className="pt-3 border-t border-[rgba(255,255,255,0.05)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <PiggyBank className="h-4 w-4 text-[#CCAE70]" />
                                    <span className="text-sm text-[#9B9B9B]">Meta de Economia</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-semibold font-mono text-[#E3E3E3]">
                                        {formatCurrency(currentSavings)}
                                    </span>
                                    <span className="text-sm text-[#5A5A5A]">
                                        de {formatCurrency(savingsGoal)}
                                    </span>
                                </div>
                                <Progress value={savingsPercentage} variant="gold" size="sm" />
                                <div className="flex items-center gap-1 mt-2 text-xs text-[#CCAE70]">
                                    <Target className="h-3 w-3" />
                                    <span>{savingsPercentage}% da meta alcançada</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
