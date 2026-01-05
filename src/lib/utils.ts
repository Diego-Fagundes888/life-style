import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Re-export generateId para uso em todo o app
export { generateId } from "./store";

/**
 * Combina classes Tailwind de forma inteligente, resolvendo conflitos.
 * Utiliza clsx para lógica condicional e tailwind-merge para resolver conflitos.
 * 
 * @example
 * cn("px-4 py-2", condition && "bg-blue-500", "px-6") // -> "py-2 px-6 bg-blue-500"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Retorna saudação baseada no horário do dia.
 * 
 * @param hour - Hora atual (0-23)
 * @returns Saudação apropriada em português
 */
export function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * Formata data em português com estilo elegante.
 * 
 * @param date - Data a ser formatada
 * @returns String formatada (ex: "Segunda-feira, 30 de Dezembro de 2024")
 */
export function formatDateElegant(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Calcula o progresso do dia como percentual.
 * 
 * @param hour - Hora atual
 * @param minute - Minuto atual
 * @returns Percentual do dia transcorrido (0-100)
 */
export function getDayProgress(hour: number, minute: number): number {
  const totalMinutes = hour * 60 + minute;
  const dayMinutes = 24 * 60;
  return Math.round((totalMinutes / dayMinutes) * 100);
}

/**
 * Formata valor monetário em Real brasileiro.
 * 
 * @param value - Valor numérico
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Calcula tempo restante até determinado horário.
 * 
 * @param targetHour - Hora alvo
 * @param targetMinute - Minuto alvo
 * @param currentHour - Hora atual
 * @param currentMinute - Minuto atual
 * @returns Objeto com horas e minutos restantes
 */
export function getTimeRemaining(
  targetHour: number,
  targetMinute: number,
  currentHour: number,
  currentMinute: number
): { hours: number; minutes: number } {
  const targetTotal = targetHour * 60 + targetMinute;
  const currentTotal = currentHour * 60 + currentMinute;
  const diff = targetTotal - currentTotal;

  if (diff <= 0) return { hours: 0, minutes: 0 };

  return {
    hours: Math.floor(diff / 60),
    minutes: diff % 60,
  };
}

/**
 * Converte Date para string ISO (YYYY-MM-DD).
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Retorna a data de hoje como string ISO.
 */
export function getTodayISO(): string {
  return toISODateString(new Date());
}

/**
 * Formata tempo relativo (ex: "há 2 horas", "ontem").
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) return "Agora";
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Calcula diferença em dias entre duas datas.
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / 86400000);
}

/**
 * Retorna array de datas entre início e fim.
 */
export function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(toISODateString(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Retorna o primeiro dia da semana (domingo) para uma data.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

/**
 * Retorna o primeiro dia do mês para uma data.
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Clamp um valor entre min e max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
