"use client";

import * as React from "react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Goal, GoalType, GoalDirection } from "@/lib/types/goals";
import { cn } from "@/lib/utils";

// Opções de tipo de meta
const typeOptions: SelectOption[] = [
    { value: "binary", label: "Checkbox (Sim/Não)" },
    { value: "numeric", label: "Numérica (Com progresso)" },
];

// Opções de direção para metas numéricas
const directionOptions: SelectOption[] = [
    { value: "increase", label: "Aumentar (ex: Livros lidos)" },
    { value: "decrease", label: "Diminuir (ex: Peso corporal)" },
];

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<Goal, "id">) => void;
    /** Meta existente para edição (opcional) */
    editingGoal?: Goal;
}

/**
 * GoalModal - Modal para adicionar ou editar metas individuais.
 */
export function GoalModal({
    isOpen,
    onClose,
    onSave,
    editingGoal
}: GoalModalProps) {
    // Form state
    const [title, setTitle] = React.useState("");
    const [type, setType] = React.useState<GoalType>("binary");
    const [target, setTarget] = React.useState("");
    const [unit, setUnit] = React.useState("");
    const [direction, setDirection] = React.useState<GoalDirection>("increase");
    const [startValue, setStartValue] = React.useState("");
    const [currentValue, setCurrentValue] = React.useState("");

    // Errors
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    // Populate fields when editing
    React.useEffect(() => {
        if (editingGoal) {
            setTitle(editingGoal.title);
            setType(editingGoal.type);
            setTarget(editingGoal.target.toString());
            setUnit(editingGoal.unit || "");
            setDirection(editingGoal.direction || "increase");
            setStartValue(editingGoal.startValue?.toString() || "");
            setCurrentValue(editingGoal.current.toString());
        } else {
            // Reset form
            setTitle("");
            setType("binary");
            setTarget("");
            setUnit("");
            setDirection("increase");
            setStartValue("");
            setCurrentValue("");
        }
        setErrors({});
    }, [editingGoal, isOpen]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!title.trim()) {
            newErrors.title = "O título é obrigatório";
        }

        if (type === "numeric") {
            if (!target || isNaN(Number(target)) || Number(target) <= 0) {
                newErrors.target = "Informe um valor numérico válido maior que zero";
            }

            if (direction === "decrease") {
                if (!startValue || isNaN(Number(startValue))) {
                    newErrors.startValue = "Informe o valor inicial para metas de redução";
                } else if (Number(startValue) <= Number(target)) {
                    newErrors.startValue = "O valor inicial deve ser maior que a meta";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const goal: Omit<Goal, "id"> = {
            title: title.trim(),
            type,
            current: type === "binary"
                ? (editingGoal?.current ?? 0)
                : (currentValue ? Number(currentValue) : (direction === "decrease" ? Number(startValue) : 0)),
            target: type === "binary" ? 1 : Number(target),
        };

        // Add optional fields
        if (type === "numeric") {
            goal.direction = direction;
            if (unit.trim()) goal.unit = unit.trim();
            if (direction === "decrease" && startValue) {
                goal.startValue = Number(startValue);
            }
        }

        onSave(goal);
        onClose();
    };

    const isEditing = !!editingGoal;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Meta" : "Nova Meta"}
            description="Defina um objetivo claro e mensurável"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title Input */}
                <Input
                    label="Título da Meta"
                    placeholder="Ex: Ler 12 livros, Perder 5kg, Aprender violão..."
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setErrors(prev => ({ ...prev, title: "" }));
                    }}
                    error={errors.title}
                    autoFocus
                />

                {/* Goal Type */}
                <Select
                    label="Tipo de Meta"
                    options={typeOptions}
                    value={type}
                    onChange={(v) => setType(v as GoalType)}
                />

                {/* Numeric-specific fields */}
                {type === "numeric" && (
                    <>
                        {/* Direction */}
                        <Select
                            label="Direção do Progresso"
                            options={directionOptions}
                            value={direction}
                            onChange={(v) => setDirection(v as GoalDirection)}
                        />

                        {/* Target Value */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Meta (Alvo)"
                                type="number"
                                placeholder={direction === "increase" ? "Ex: 12" : "Ex: 70"}
                                value={target}
                                onChange={(e) => {
                                    setTarget(e.target.value);
                                    setErrors(prev => ({ ...prev, target: "" }));
                                }}
                                error={errors.target}
                                min={0}
                                step="any"
                            />
                            <Input
                                label="Unidade (opcional)"
                                placeholder="Ex: kg, livros, R$, %"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            />
                        </div>

                        {/* Start Value (for decrease goals) */}
                        {direction === "decrease" && (
                            <Input
                                label="Valor Inicial"
                                type="number"
                                placeholder="De onde você está partindo?"
                                value={startValue}
                                onChange={(e) => {
                                    setStartValue(e.target.value);
                                    setErrors(prev => ({ ...prev, startValue: "" }));
                                }}
                                error={errors.startValue}
                                hint="Ex: Se quer chegar a 70kg e está com 80kg, o inicial é 80"
                                min={0}
                                step="any"
                            />
                        )}

                        {/* Current Value (for editing) */}
                        {isEditing && (
                            <Input
                                label="Valor Atual"
                                type="number"
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                min={0}
                                step="any"
                            />
                        )}
                    </>
                )}

                {/* Footer */}
                <ModalFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit">
                        {isEditing ? "Salvar Alterações" : "Criar Meta"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
