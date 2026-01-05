"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { formatCurrency } from "@/lib/formatUtils";

interface AssetData {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

interface AllocationChartProps {
    data: AssetData[];
    isBlurred?: boolean;
}

// Custom active shape for the donut chart - Dark Academia
const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}
            />
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#E3E3E3" fontSize={13} fontWeight={500}>
                {payload.name}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#CCAE70" fontSize={16} fontWeight={700}>
                {formatCurrency(value)}
            </text>
        </g>
    );
};

export function AllocationChart({ data, isBlurred = false }: AllocationChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(undefined);
    };

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className={`w-full h-full flex transition-all duration-300 ${isBlurred ? "blur-md" : ""}`}>
            {/* Chart */}
            <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data as any}
                            cx="50%"
                            cy="50%"
                            innerRadius="55%"
                            outerRadius="85%"
                            paddingAngle={2}
                            dataKey="value"
                            {...{ activeIndex } as any}
                            activeShape={renderActiveShape}
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                            animationDuration={1000}
                            animationEasing="ease-out"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="rgba(25, 25, 25, 0.8)"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* Center label when nothing is hovered */}
                {activeIndex === undefined && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[#9B9B9B] text-xs">Total</span>
                        <span className="text-[#E3E3E3] text-lg font-bold">{formatCurrency(totalValue)}</span>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="w-32 flex flex-col justify-center gap-2 pl-2">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className={`flex items-center gap-2 transition-all cursor-pointer ${activeIndex === index ? "scale-105" : "opacity-70 hover:opacity-100"
                            }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(undefined)}
                    >
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                            <p className="text-xs text-[#E3E3E3] truncate">{item.name}</p>
                            <p className="text-[10px] text-[#5A5A5A]">
                                {((item.value / totalValue) * 100).toFixed(0)}%
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
