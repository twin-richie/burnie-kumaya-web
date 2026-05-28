import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Provenance } from "@/lib/types";
import { ConfidenceBadge } from "./badges";

export function ProvenanceList({ provenance, compact = false }: { provenance: Provenance[]; compact?: boolean }) {
  return (
    <div className="space-y-2 text-xs text-stone-400">
      {provenance.map((source, index) => (
        <div key={`${source.source_type}-${source.source_ref}-${index}`} className="rounded-lg border border-stone-800/80 bg-stone-950/50 p-3">
          <div className="flex flex-wrap items-center gap-2 text-stone-300">
            <span className="font-mono uppercase tracking-[0.16em] text-amber-300/80">{source.source_type.replace("_", " ")}</span>
            <span>{source.source_ref}</span>
            {source.source_date ? <span className="text-stone-500">· {source.source_date}</span> : null}
          </div>
          {!compact && source.quote ? <blockquote className="mt-2 border-l border-amber-500/30 pl-3 text-stone-400">“{source.quote}”</blockquote> : null}
        </div>
      ))}
    </div>
  );
}

export function RecordMeta({ confidence, provenance }: { confidence: Parameters<typeof ConfidenceBadge>[0]["confidence"]; provenance: Provenance[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ConfidenceBadge confidence={confidence} />
      <span className="text-xs text-stone-500">{provenance.length} source{provenance.length === 1 ? "" : "s"}</span>
    </div>
  );
}

export function ProvenanceCard({ provenance }: { provenance: Provenance[] }) {
  return (
    <Card className="border-stone-800 bg-stone-950/80">
      <CardHeader>
        <CardTitle className="text-sm text-stone-200">Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ProvenanceList provenance={provenance} />
      </CardContent>
    </Card>
  );
}
