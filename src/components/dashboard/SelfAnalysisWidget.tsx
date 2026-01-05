"use client";

import { PILLAR_SCORES, getOverallScore } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
} from "recharts";
import { Activity, PenLine } from "lucide-react";
import Link from "next/link";

/**
 * SelfAnalysisWidget - Dark Academia Style
 *
 * Gráfico radar dos 5 pilares com cores terrosas elegantes.
 */
export function SelfAnalysisWidget() {
    const overallScore = getOverallScore();

    // Determina variante do badge baseado no score
    const scoreVariant =
        overallScore >= 80 ? "olive" : overallScore >= 60 ? "clay" : "rust";
    const scoreLabel =
        overallScore >= 80 ? "Excelente" : overallScore >= 60 ? "Bom" : "Atenção";

    return (
        <Card className="col-span-full lg:col-span-2">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-[#CCAE70]" />
                        <CardTitle className="text-lg font-sans font-medium">Autoanálise</CardTitle>
                    </div>
                    <Badge variant={scoreVariant}>
                        {overallScore}% - {scoreLabel}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Radar Chart - minWidth/minHeight to avoid SSR warning */}
                <div className="h-48 w-full" style={{ minWidth: 200, minHeight: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                            data={PILLAR_SCORES}
                            cx="50%"
                            cy="50%"
                            outerRadius="80%"
                        >
                            <PolarGrid stroke="#3A3A3A" strokeDasharray="3 3" />
                            <PolarAngleAxis
                                dataKey="name"
                                tick={{ fill: "#9B9B9B", fontSize: 12 }}
                                tickLine={false}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fill: "#5A5A5A", fontSize: 10 }}
                                tickCount={5}
                                axisLine={false}
                            />
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke="#CCAE70"
                                fill="#CCAE70"
                                fillOpacity={0.3}
                                strokeWidth={2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Score Pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {PILLAR_SCORES.map((pillar) => (
                        <div
                            key={pillar.name}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#2C2C2C] text-sm"
                        >
                            <span className="text-[#9B9B9B]">{pillar.name}:</span>
                            <span
                                className={
                                    pillar.score >= 80
                                        ? "text-[#8C9E78] font-medium"
                                        : pillar.score >= 60
                                            ? "text-[#D99E6B] font-medium"
                                            : "text-[#C87F76] font-medium"
                                }
                            >
                                {pillar.score}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <Link href="/journal" className="block">
                    <Button variant="outline" className="w-full gap-2">
                        <PenLine className="h-4 w-4" />
                        Refletir no Diário
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
