import { DragEvent, useState } from 'react';

/** Move o elemento de `from` para `to` (índices) numa cópia da lista. */
export const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Ordenar por arrastar (HTML5 nativo). `onReorder` recebe a lista nova quando
 * se larga. Para teclado, usar `moveItem` com botões subir/descer.
 */
export function useDragOrder<T extends { id: string }>(items: T[], onReorder: (next: T[]) => void) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const handlers = (item: T) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      setDragging(item.id);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id);
    },
    onDragOver: (event: DragEvent) => {
      if (!dragging) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (over !== item.id) setOver(item.id);
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      const from = items.findIndex((i) => i.id === dragging);
      const to = items.findIndex((i) => i.id === item.id);
      setDragging(null);
      setOver(null);
      if (from >= 0 && to >= 0 && from !== to) onReorder(moveItem(items, from, to));
    },
    onDragEnd: () => {
      setDragging(null);
      setOver(null);
    },
  });

  return { handlers, dragging, over };
}
