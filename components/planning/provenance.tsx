import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/dates";
import type { Provenance } from "@/lib/types";
import { ConfidenceBadge } from "./badges";

export function ProvenanceList({ provenance, compact = false }: { provenance: Provenance[]; compact?: boolean }) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      {provenance.map((source, index) => (
        <div key={`${source.source_type}-${source.source_ref}-${index}`} className="rounded-lg border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span className="font-mono uppercase tracking-[0.16em] text-muted-foreground">{source.source_type.replace("_", " ")}</span>
            <span>{source.source_ref}</span>
            {source.source_date ? <span className="text-muted-foreground">· {formatDisplayDate(source.source_date)}</span> : null}
          </div>
          {!compact && source.quote ? <blockquote className="mt-2 border-l pl-3 text-muted-foreground">“{source.quote}”</blockquote> : null}
        </div>
      ))}
    </div>
  );
}

export function RecordMeta({ confidence, provenance }: { confidence: Parameters<typeof ConfidenceBadge>[0]["confidence"]; provenance: Provenance[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ConfidenceBadge confidence={confidence} />
      <span className="text-xs text-muted-foreground">{provenance.length} source{provenance.length === 1 ? "" : "s"}</span>
    </div>
  );
}

export function ProvenanceCard({ provenance }: { provenance: Provenance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-foreground">Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ProvenanceList provenance={provenance} />
      </CardContent>
    </Card>
  );
}
