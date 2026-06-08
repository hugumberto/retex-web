import { VisionResult } from '@/app/types/vision';

interface VisionResultsProps {
  result: VisionResult;
}

export function VisionResults({ result }: VisionResultsProps) {
  const all = [...result.objects, ...result.labels].sort((a, b) => b.score - a.score);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Resultado da identificação</h3>
      {all.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item identificado.</p>
      ) : (
        <ul className="space-y-2">
          {all.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span>{item.description}</span>
              <span className="text-xs font-medium text-secondary">
                {(item.score * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
