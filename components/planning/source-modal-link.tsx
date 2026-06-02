"use client";

import { useState } from "react";
import { X } from "lucide-react";

import type { Provenance } from "@/lib/types";
import { ProvenanceList } from "./provenance";

export function SourceModalLink({ provenance }: { provenance: Provenance[] }) {
  const [open, setOpen] = useState(false);
  const sourceCount = provenance.length;

  return (
    <>
      <button
        type="button"
        className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        data-source-modal-trigger="true"
        onClick={() => setOpen(true)}
      >
        {sourceCount} source{sourceCount === 1 ? "" : "s"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="source-modal-title" data-source-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            aria-label="Close source citations"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 flex max-h-[80vh] w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 id="source-modal-title" className="font-serif text-xl font-semibold text-foreground">Source citations</h2>
                <p className="mt-1 text-sm text-muted-foreground">Evidence attached to this planning item.</p>
              </div>
              <button
                type="button"
                className="ring-focus inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close source citations"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <ProvenanceList provenance={provenance} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
