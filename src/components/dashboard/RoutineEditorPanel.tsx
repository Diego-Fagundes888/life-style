"use client";

import * as React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { X, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TimeBlockCard, TIME_BLOCK_CATEGORIES } from "./TimeBlockCard";
import { useTimeBlocksQuery } from "@/lib/db-hooks";
import {
    saveTimeBlock,
    deleteTimeBlock,
    reorderTimeBlocks,
    createTimeBlock,
} from "@/lib/db-hooks";
import { db, DEFAULT_TIME_BLOCKS, type DBTimeBlock } from "@/lib/db";

interface RoutineEditorPanelProps {
    /** Se o painel está aberto */
    open: boolean;
    /** Callback para fechar o painel */
    onOpenChange: (open: boolean) => void;
}

/**
 * RoutineEditorPanel - Painel de edição de rotina diária
 * 
 * Slide-over panel inspirado no Sunsama para edição dos blocos
 * de tempo que compõem a rotina diária do usuário.
 * 
 * Features:
 * - Drag & drop para reordenação
 * - Edição inline de cada bloco
 * - Adicionar/remover blocos
 * - Reset para valores padrão
 */
export function RoutineEditorPanel({ open, onOpenChange }: RoutineEditorPanelProps) {
    const timeBlocks = useTimeBlocksQuery();
    const [localBlocks, setLocalBlocks] = React.useState<DBTimeBlock[]>([]);

    // Sincroniza estado local com dados do banco
    React.useEffect(() => {
        if (timeBlocks.length > 0) {
            setLocalBlocks([...timeBlocks]);
        }
    }, [timeBlocks]);

    // Configuração dos sensores de drag & drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Evita ativação acidental
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    /**
     * Handler para fim do drag & drop
     * Reordena os blocos e persiste no banco
     */
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localBlocks.findIndex((b) => b.id === active.id);
            const newIndex = localBlocks.findIndex((b) => b.id === over.id);

            const reordered = arrayMove(localBlocks, oldIndex, newIndex);

            // Atualiza order de cada bloco
            const withNewOrder = reordered.map((block, index) => ({
                ...block,
                order: index,
            }));

            setLocalBlocks(withNewOrder);

            // Persiste no banco
            await reorderTimeBlocks(
                withNewOrder.map((b) => ({ id: b.id, order: b.order }))
            );
        }
    };

    /**
     * Atualiza um bloco específico
     */
    const handleUpdateBlock = async (updatedBlock: DBTimeBlock) => {
        setLocalBlocks((prev) =>
            prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
        );
        await saveTimeBlock(updatedBlock);
    };

    /**
     * Deleta um bloco
     */
    const handleDeleteBlock = async (id: string) => {
        setLocalBlocks((prev) => prev.filter((b) => b.id !== id));
        await deleteTimeBlock(id);
    };

    /**
     * Adiciona um novo bloco
     */
    const handleAddBlock = async () => {
        const lastBlock = localBlocks[localBlocks.length - 1];
        const startHour = lastBlock ? (lastBlock.endHour + 1) % 24 : 8;
        const endHour = (startHour + 1) % 24;

        const newBlock: Omit<DBTimeBlock, "id"> = {
            title: "Novo Bloco",
            startHour,
            startMinute: 0,
            endHour,
            endMinute: 0,
            category: "routine",
            icon: "Timer",
            order: localBlocks.length,
        };

        await createTimeBlock(newBlock);
    };

    /**
     * Reseta para a rotina padrão
     */
    const handleResetToDefault = async () => {
        // Limpa todos os blocos existentes
        await db.timeBlocks.clear();
        // Reinsere os padrões
        await db.timeBlocks.bulkPut(DEFAULT_TIME_BLOCKS);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl bg-[#1A1A1A] border-l border-[rgba(204,174,112,0.2)] p-0"
            >
                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle className="text-xl font-serif text-[#E3E3E3]">
                                Editar Rotina
                            </SheetTitle>
                            <SheetDescription className="text-[#9B9B9B]">
                                Personalize os blocos de tempo do seu dia
                            </SheetDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-[#5A5A5A] hover:text-[#E3E3E3]"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </SheetHeader>

                {/* Content */}
                <ScrollArea className="h-[calc(100vh-180px)]">
                    <div className="p-4 space-y-2">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis]}
                        >
                            <SortableContext
                                items={localBlocks.map((b) => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {localBlocks.map((block) => (
                                    <TimeBlockCard
                                        key={block.id}
                                        block={block}
                                        onUpdate={handleUpdateBlock}
                                        onDelete={handleDeleteBlock}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {localBlocks.length === 0 && (
                            <div className="text-center py-12 text-[#5A5A5A]">
                                <p className="mb-4">Nenhum bloco de tempo configurado</p>
                                <Button
                                    variant="outline"
                                    onClick={handleResetToDefault}
                                    className="border-[rgba(204,174,112,0.3)] text-[#CCA870] hover:bg-[rgba(204,174,112,0.1)]"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Carregar Rotina Padrão
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A] to-transparent pt-8">
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleAddBlock}
                            className="flex-1 bg-[#CCA870] hover:bg-[#D4B87A] text-[#1A1A1A] font-medium"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Bloco
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="border-[rgba(255,255,255,0.1)] text-[#9B9B9B] hover:bg-[#2C2C2C]"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#1E1E1E] border-[rgba(204,174,112,0.2)]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-[#E3E3E3]">
                                        Restaurar rotina padrão?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-[#9B9B9B]">
                                        Isso irá substituir todos os seus blocos de tempo
                                        personalizados pela rotina padrão. Esta ação não
                                        pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-[#2C2C2C] border-[rgba(255,255,255,0.1)] text-[#E3E3E3] hover:bg-[#3C3C3C]">
                                        Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleResetToDefault}
                                        className="bg-[#CCA870] hover:bg-[#D4B87A] text-[#1A1A1A]"
                                    >
                                        Restaurar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* Category Legend */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {TIME_BLOCK_CATEGORIES.map((cat) => (
                            <div
                                key={cat.value}
                                className={`px-2 py-1 rounded-md text-xs ${cat.color}`}
                            >
                                {cat.label}
                            </div>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
