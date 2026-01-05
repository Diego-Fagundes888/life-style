import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
    Calendar,
    BookOpen,
    Target,
    ChevronRight,
    TrendingUp,
    Wallet,
    Brain,
    Sparkles,
    Users,
} from "lucide-react";

interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
    description: string;
    color: string;
}

// Dark Academia color palette for navigation
const NAV_ITEMS: NavItem[] = [
    {
        href: "/planning",
        icon: Calendar,
        label: "Planejamento Semanal",
        description: "Organize sua semana",
        color: "text-[#768C9E] bg-[rgba(118,140,158,0.15)] group-hover:bg-[rgba(118,140,158,0.25)]", // slate
    },
    {
        href: "/habits",
        icon: TrendingUp,
        label: "Rastreamento de Hábitos",
        description: "Consistência e disciplina",
        color: "text-[#8C9E78] bg-[rgba(140,158,120,0.15)] group-hover:bg-[rgba(140,158,120,0.25)]", // olive
    },
    {
        href: "/finances",
        icon: Wallet,
        label: "Finanças",
        description: "Painel de investidor",
        color: "text-[#CCAE70] bg-[rgba(204,174,112,0.15)] group-hover:bg-[rgba(204,174,112,0.25)]", // gold
    },
    {
        href: "/journal",
        icon: BookOpen,
        label: "Diário & Notas",
        description: "Reflexões e insights",
        color: "text-[#C87F76] bg-[rgba(200,127,118,0.15)] group-hover:bg-[rgba(200,127,118,0.25)]", // rust
    },
    {
        href: "/goals",
        icon: Target,
        label: "Metas Anuais",
        description: "Objetivos do ano",
        color: "text-[#D99E6B] bg-[rgba(217,158,107,0.15)] group-hover:bg-[rgba(217,158,107,0.25)]", // clay
    },
    {
        href: "/review",
        icon: Brain,
        label: "Reflexão Mensal",
        description: "Espelho da vida",
        color: "text-[#768C9E] bg-[rgba(118,140,158,0.15)] group-hover:bg-[rgba(118,140,158,0.25)]", // slate
    },
    {
        href: "/bucket-list",
        icon: Sparkles,
        label: "Bucket List",
        description: "Antes de morrer",
        color: "text-[#CCAE70] bg-[rgba(204,174,112,0.15)] group-hover:bg-[rgba(204,174,112,0.25)]", // gold
    },
    {
        href: "/life-summary",
        icon: Users,
        label: "Vida em Resumo",
        description: "Análise das 5 áreas",
        color: "text-[#8C9E78] bg-[rgba(140,158,120,0.15)] group-hover:bg-[rgba(140,158,120,0.25)]", // olive
    },
];

/**
 * QuickNavWidget - Dark Academia Style
 *
 * Cards de navegação com cores terrosas elegantes.
 */
export function QuickNavWidget() {
    return (
        <div className="col-span-full">
            <h2 className="font-serif text-sm font-medium text-[#9B9B9B] mb-3">Navegação Rápida</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {NAV_ITEMS.map((item) => (
                    <Link key={item.href} href={item.href} className="group">
                        <Card className="h-full transition-all duration-300 hover:border-[rgba(255,255,255,0.1)] hover:bg-[#2C2C2C] hover:shadow-md hover:-translate-y-0.5">
                            <CardContent className="p-5 flex items-center gap-4">
                                {/* Icon */}
                                <div
                                    className={`flex-shrink-0 p-3 rounded-xl transition-colors duration-300 ${item.color}`}
                                >
                                    <item.icon className="h-6 w-6" />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-[#E3E3E3] group-hover:text-white transition-colors">
                                        {item.label}
                                    </h3>
                                    <p className="text-sm text-[#5A5A5A] truncate">
                                        {item.description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="h-5 w-5 text-[#3A3A3A] group-hover:text-[#9B9B9B] group-hover:translate-x-1 transition-all" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
