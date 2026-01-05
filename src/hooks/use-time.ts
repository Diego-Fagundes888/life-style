"use client";

import { useState, useEffect } from "react";

interface TimeState {
    hours: number;
    minutes: number;
    seconds: number;
    date: Date;
}

/**
 * Hook que mantém o horário atual sincronizado.
 * Atualiza a cada segundo para relógios/contadores.
 * 
 * @returns Estado atual do tempo incluindo horas, minutos, segundos e Date
 */
export function useTime(): TimeState {
    const [time, setTime] = useState<TimeState>(() => {
        const now = new Date();
        return {
            hours: now.getHours(),
            minutes: now.getMinutes(),
            seconds: now.getSeconds(),
            date: now,
        };
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setTime({
                hours: now.getHours(),
                minutes: now.getMinutes(),
                seconds: now.getSeconds(),
                date: now,
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return time;
}

/**
 * Hook que atualiza apenas a cada minuto.
 * Mais eficiente para componentes que não precisam de segundos.
 */
export function useTimeMinute(): Omit<TimeState, "seconds"> {
    const [time, setTime] = useState<Omit<TimeState, "seconds">>(() => {
        const now = new Date();
        return {
            hours: now.getHours(),
            minutes: now.getMinutes(),
            date: now,
        };
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setTime({
                hours: now.getHours(),
                minutes: now.getMinutes(),
                date: now,
            });
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return time;
}
