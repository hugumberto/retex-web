'use client';

import { VisionLabel, VisionResult } from '@/app/types/vision';
import { cn } from '@/lib/utils';

interface VisionResultsProps {
  result: VisionResult;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-secondary"
          style={{ width: `${(score * 100).toFixed(0)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function LabelList({ items }: { items: VisionLabel[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">—</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between text-sm">
          <span className="capitalize">{item.description}</span>
          <ScoreBar score={item.score} />
        </li>
      ))}
    </ul>
  );
}

function Section({ title, items, highlight }: { title: string; items: VisionLabel[]; highlight?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className={cn('space-y-2', highlight && 'rounded-lg border bg-muted/40 p-3')}>
      <p className={cn('text-xs font-semibold uppercase tracking-wider text-muted-foreground', highlight && 'text-foreground')}>
        {title}
      </p>
      <LabelList items={items} />
    </div>
  );
}

export function VisionResults({ result }: VisionResultsProps) {
  const { clothing, colors, labels, objects } = result;

  const hasClothing =
    clothing.types.length > 0 ||
    clothing.materials.length > 0 ||
    clothing.styles.length > 0 ||
    clothing.patterns.length > 0;

  // Raw labels not yet covered by clothing taxonomy
  const classifiedDescriptions = new Set([
    ...clothing.types,
    ...clothing.materials,
    ...clothing.styles,
    ...clothing.patterns,
    ...objects,
  ].map((l) => l.description.toLowerCase()));

  const otherLabels = labels.filter(
    (l) => !classifiedDescriptions.has(l.description.toLowerCase()),
  );

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold">Resultado da identificação</h3>

      {/* Color swatches */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cores dominantes
          </p>
          <div className="flex gap-2 flex-wrap">
            {colors.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="size-8 rounded-md border shadow-sm"
                  style={{ backgroundColor: c.hex }}
                  title={c.hex}
                />
                <span className="text-[10px] text-muted-foreground">
                  {(c.pixelFraction * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clothing taxonomy */}
      {hasClothing ? (
        <>
          <Section title="Tipo de peça" items={clothing.types} highlight />
          <Section title="Material" items={clothing.materials} />
          <Section title="Estilo" items={clothing.styles} />
          <Section title="Padrão" items={clothing.patterns} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma peça de roupa identificada nas categorias conhecidas.
        </p>
      )}

      {/* Other raw labels */}
      {otherLabels.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground select-none hover:text-foreground transition-colors">
            Ver todos os resultados ({otherLabels.length + objects.length})
          </summary>
          <div className="mt-2 space-y-1">
            <LabelList items={[...objects, ...otherLabels].sort((a, b) => b.score - a.score)} />
          </div>
        </details>
      )}
    </div>
  );
}
