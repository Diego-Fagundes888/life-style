"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatUtils";

interface WealthDataPoint {
    month: string;
    netWorth: number;
}

interface WealthChartProps {
    data: WealthDataPoint[];
    isBlurred?: boolean;
}

export function WealthChart({ data, isBlurred = false }: WealthChartProps) {
    return (
        <div className={`w-full h-full transition-all duration-300 ${isBlurred ? "blur-md" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8C9E78" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="#8C9E78" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#8C9E78" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9B9B9B", fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9B9B9B", fontSize: 11 }}
                        width={45}
                    />
                    <Tooltip
                        formatter={(value) => [formatCurrency(value as number), "Patrimônio"]}
                        contentStyle={{
                            backgroundColor: "rgba(32, 32, 32, 0.95)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                            padding: "12px 16px",
                        }}
                        labelStyle={{ color: "#9B9B9B", marginBottom: "4px" }}
                        itemStyle={{ color: "#8C9E78", fontWeight: 600 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="netWorth"
                        stroke="#8C9E78"
                        strokeWidth={3}
                        fill="url(#wealthGradient)"
                        animationDuration={1500}
                        animationEasing="ease-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
