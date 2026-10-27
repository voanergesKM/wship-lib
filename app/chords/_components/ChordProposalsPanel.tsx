"use client";

import { can } from "@/lib/permissions/catalog";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthContext";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ChordDiagram } from "@/components/chords/ChordDiagram";
import { chordCatalogKey, chordRequest } from "@/hooks/useChordCatalog";
import type { ChordProposal, VoicingData } from "@/types/chords";
import { NOTE_NAMES } from "@/utils/guitarChords";

const STATUSES = {
  pending: "Очікує розгляду",
  approved: "Схвалено",
  rejected: "Відхилено",
  cancelled: "Скасовано",
};
export function ChordProposalsPanel() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["chordProposals", user?.id],
    queryFn: () =>
      chordRequest<{ proposals: ChordProposal[] }>("/api/chords/proposals"),
    enabled: !!user,
  });
  if (!user) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">
        {can(user, "chords.proposals.review")
          ? "Пропозиції до каталогу"
          : "Мої пропозиції"}
      </h2>
      {query.isPending && <p role="status">Завантаження пропозицій…</p>}
      {query.error && (
        <div role="alert">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Повторити
          </Button>
        </div>
      )}
      {query.data?.proposals.length === 0 && (
        <p className="text-sm text-muted-foreground">Пропозицій поки немає.</p>
      )}
      {query.data?.proposals.map((proposal) => (
        <ProposalItem
          key={proposal._id}
          proposal={proposal}
          isAdmin={can(user, "chords.proposals.review")}
          isAuthor={proposal.userId === user.id}
        />
      ))}
    </section>
  );
}
function VoicingSummary({
  voicing,
  name,
}: {
  voicing: VoicingData;
  name: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ChordDiagram name={name} voicing={voicing} />
      <p className="text-sm">
        Тоніка: {NOTE_NAMES[voicing.root]}; бас:{" "}
        {voicing.bass === null ? "не задано" : NOTE_NAMES[voicing.bass]}.
      </p>
      <p className="text-sm">
        {voicing.movable ? "Переносна" : "Фіксована"} форма
        {voicing.octaveVariants ? ", з октавними варіантами" : ""}.
      </p>
      <p className="text-sm">
        Пропущені інтервали: {voicing.omittedIntervals.join(", ") || "немає"}.
        Пальці: {voicing.fingers.join(" ")}.
      </p>
    </div>
  );
}
function ProposalItem({
  proposal,
  isAdmin,
  isAuthor,
}: {
  proposal: ChordProposal;
  isAdmin: boolean;
  isAuthor: boolean;
}) {
  const [comment, setComment] = useState("");
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (action: "approve" | "reject" | "cancel") =>
      chordRequest(`/api/chords/proposals/${proposal._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["chordProposals"] }),
        client.invalidateQueries({ queryKey: chordCatalogKey }),
      ]);
    },
  });
  const definition = proposal.definitionSnapshot;
  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer">
        {definition.name} · {proposal.authorName} · {STATUSES[proposal.status]}
      </summary>
      <div className="mt-4 flex flex-col gap-4">
        <p className="whitespace-pre-wrap text-sm">{proposal.input.comment}</p>
        {proposal.input.kind === "add-chord" && (
          <p className="text-sm">
            Новий тип: {definition.quality || "мажор"}; категорія:{" "}
            {definition.category}; альтернативи:{" "}
            {definition.aliases.join(", ") || "немає"}; інтервали:{" "}
            {definition.intervals.join(", ")}; дозволені пропуски:{" "}
            {definition.optionalIntervals.join(", ") || "немає"}.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {proposal.before && (
            <div>
              <h3 className="font-medium">
                До зміни (версія {proposal.before.version})
              </h3>
              <VoicingSummary name="До зміни" voicing={proposal.before} />
            </div>
          )}
          <div>
            <h3 className="font-medium">Запропоновано</h3>
            <VoicingSummary
              name="Запропоновано"
              voicing={proposal.input.voicing}
            />
          </div>
        </div>
        {proposal.reviewComment && (
          <p className="text-sm whitespace-pre-wrap">
            Коментар до рішення: {proposal.reviewComment}
          </p>
        )}
        {proposal.status === "pending" && (
          <>
            {isAdmin && (
              <Field>
                <FieldLabel htmlFor={`review-${proposal._id}`}>
                  Коментар до рішення
                </FieldLabel>
                <Textarea
                  id={`review-${proposal._id}`}
                  value={comment}
                  maxLength={1000}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Field>
            )}
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <>
                  <Button
                    disabled={mutation.isPending}
                    isLoading={
                      mutation.isPending && mutation.variables === "approve"
                    }
                    onClick={() => mutation.mutate("approve")}
                  >
                    Схвалити
                  </Button>
                  <Button
                    variant="outline"
                    disabled={mutation.isPending}
                    isLoading={
                      mutation.isPending && mutation.variables === "reject"
                    }
                    onClick={() => mutation.mutate("reject")}
                  >
                    Відхилити
                  </Button>
                </>
              )}
              {isAuthor && (
                <Button
                  variant="ghost"
                  disabled={mutation.isPending}
                  isLoading={
                    mutation.isPending && mutation.variables === "cancel"
                  }
                  onClick={() => mutation.mutate("cancel")}
                >
                  Скасувати пропозицію
                </Button>
              )}
            </div>
          </>
        )}
        {mutation.error && (
          <p role="alert" className="text-destructive">
            {mutation.error.message}
          </p>
        )}
      </div>
    </details>
  );
}
