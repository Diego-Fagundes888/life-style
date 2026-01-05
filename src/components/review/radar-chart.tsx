"use client";

import * as React from "react";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { motion } from "framer-motion";

interface PillarScore {
    pillar: string;
    current: number;
    previous: number;
    fullMark: number;
}

interface LifeRadarChartProps {
    /** Dados dos pilares */
    data: PillarScore[];
    /** Mostrar série do mês anterior */
    showPrevious?: boolean;
    /** Altura do gráfico */
    height?: number;
}

/**
 * LifeRadarChart - Gráfico de Radar para os 5 pilares da vida.
 * Mostra duas séries: mês atual (colorido) e mês anterior (pontilhado/cinza).
 */
export function LifeRadarChart({
    data,
    showPrevious = true,
    height = 300,
}: LifeRadarChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full"
            style={{ height }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    {/* Grid */}
                    <PolarGrid
                        stroke="rgba(100, 116, 139, 0.3)"
                        strokeDasharray="3 3"
                    />

                    {/* Eixo dos Pilares */}
                    <PolarAngleAxis
                        dataKey="pillar"
                        tick={{
                            fill: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                    />

                    {/* Eixo Radial (0-10) */}
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 10]}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        tickCount={6}
                    />

                    {/* Série: Mês Anterior (cinza pontilhado) */}
                    {showPrevious && (
                        <Radar
                            name="Mês Anterior"
                            dataKey="previous"
                            stroke="#64748b"
                            fill="#64748b"
                            fillOpacity={0.1}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            animationDuration={800}
                            animationEasing="ease-out"
                        />
                    )}

                    {/* Série: Mês Atual (colorido sólido) */}
                    <Radar
                        name="Mês Atual"
                        dataKey="current"
                        stroke="#818cf8"
                        fill="#818cf8"
                        fillOpacity={0.3}
                        strokeWidth={3}
                        animationDuration={800}
                        animationEasing="ease-out"
                    />

                    {/* Tooltip */}
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '12px',
                        }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                        formatter={(value, name) => [
                            `${(value as number).toFixed(1)}`,
                            name,
                        ]}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

/**
 * Legenda do gráfico de radar.
 */
export function RadarLegend() {
    return (
        <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-indigo-400" />
                <span className="text-xs text-slate-400">Mês Atual</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-slate-500 border-dashed border-t-2 border-slate-500"
                    style={{ borderStyle: 'dashed' }} />
                <span className="text-xs text-slate-400">Mês Anterior</span>
            </div>
        </div>
    );
}
