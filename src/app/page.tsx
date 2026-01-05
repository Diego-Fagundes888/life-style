import {
  HeaderWidget,
  NowWidget,
  HabitsWidget,
  FinanceWidget,
  ReviewWidget,
  HeroStatsCard,
  FloatingDock,
} from "@/components/dashboard";

/**
 * Life Sync Dashboard - Página Principal
 * 
 * Layout "Dopamine Dashboard":
 * - HeroStatsCard: Streak, XP, Progress Ring (full width)
 * - Now + Habits + Finance em Bento Box Grid
 * - Review + SelfAnalysis 
 * - FloatingDock: Navegação flutuante estilo macOS
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen pb-32">
      {/* Main Content with padding */}
      <div className="p-4 md:p-6 lg:p-8">
        {/* Container com max-width para telas muito grandes */}
        <div className="max-w-7xl mx-auto">

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">

            {/* Row 1: Header - Full Width */}
            <HeaderWidget />

            {/* Row 2: Hero Stats Card - Full Width */}
            <HeroStatsCard />

            {/* Row 3-4: Main Content Bento Box */}
            {/* NowWidget - Destaque Principal (ocupa 2 colunas e 2 linhas em desktop) */}
            <NowWidget />

            {/* Sidebar Widgets - Empilhados ao lado do NowWidget */}
            <HabitsWidget />
            <FinanceWidget />

            {/* Row 5: Review Widget - Full Width */}
            <ReviewWidget />
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-[#5A5A5A]">
            <p>
              Life Sync © {new Date().getFullYear()} — Seu Sistema Operacional Pessoal
            </p>
          </footer>
        </div>
      </div>

      {/* Floating Dock - Fixed at bottom */}
      <FloatingDock />
    </div>
  );
}
