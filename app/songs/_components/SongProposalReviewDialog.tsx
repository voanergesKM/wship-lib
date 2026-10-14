"use client";

import { useMemo, useState } from "react";
import {
  Check,
  X,
  GitPullRequest,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  User,
  Sparkles,
  FileText,
  Music2,
  MessageSquare,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SongProposalItem, SongVisibility } from "@/services/songs.service";
import { YouTubeLink } from "@/utils/youtubeLinks";
import { SongSheet } from "./SongSheet";

interface SongProposalReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: {
    _id: string;
    title: string;
    tags?: string[];
    authors?: string[];
    key?: string;
    bpm?: number;
    document: string;
    youtube?: YouTubeLink[];
    visibility?: SongVisibility;
  };
  proposals: SongProposalItem[];
  initialSelectedId?: string | null;
  onReview: (
    proposalId: string,
    action: "approve" | "reject",
    comment?: string,
  ) => Promise<void>;
  isReviewing?: boolean;
}

export function SongProposalReviewDialog({
  open,
  onOpenChange,
  song,
  proposals,
  initialSelectedId,
  onReview,
  isReviewing = false,
}: SongProposalReviewDialogProps) {
  // Select initial proposal or fallback to first pending or first proposal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectingMode, setRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);

  const pendingProposals = useMemo(
    () => proposals.filter((p) => p.status === "pending"),
    [proposals],
  );

  const activeProposal = useMemo(() => {
    if (selectedId) {
      const found = proposals.find((p) => p._id === selectedId);
      if (found) return found;
    }
    if (initialSelectedId) {
      const found = proposals.find((p) => p._id === initialSelectedId);
      if (found) return found;
    }
    return pendingProposals[0] || proposals[0] || null;
  }, [selectedId, initialSelectedId, proposals, pendingProposals]);

  const handleApprove = async () => {
    if (!activeProposal) return;
    await onReview(activeProposal._id, "approve");
    setConfirmApprove(false);
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!activeProposal) return;
    await onReview(activeProposal._id, "reject", rejectReason);
    setRejectingMode(false);
    setRejectReason("");
    onOpenChange(false);
  };

  if (!activeProposal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Запропоновані зміни</DialogTitle>
            <DialogDescription>
              Наразі немає жодних пропозицій змін для цієї пісні.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const proposer = activeProposal.user;
  const proposerName =
    [proposer?.firstName, proposer?.lastName].filter(Boolean).join(" ") ||
    (proposer?.username ? `@${proposer.username}` : "Користувач");

  const pData = activeProposal.proposedData;

  // Metadata diff check
  const metaDiffs = [
    {
      label: "Назва",
      oldVal: song.title,
      newVal: pData.title,
      changed: song.title !== pData.title,
    },
    {
      label: "Автори",
      oldVal: song.authors?.join(", ") || "—",
      newVal: pData.authors?.join(", ") || "—",
      changed:
        (song.authors?.join(", ") || "") !== (pData.authors?.join(", ") || ""),
    },
    {
      label: "Теги",
      oldVal: song.tags?.join(", ") || "—",
      newVal: pData.tags?.join(", ") || "—",
      changed:
        (song.tags?.join(", ") || "") !== (pData.tags?.join(", ") || ""),
    },
    {
      label: "Тональність",
      oldVal: song.key || "—",
      newVal: pData.key || "—",
      changed: (song.key || "") !== (pData.key || ""),
    },
    {
      label: "BPM",
      oldVal: song.bpm ? String(song.bpm) : "—",
      newVal: pData.bpm ? String(pData.bpm) : "—",
      changed: (song.bpm || "") !== (pData.bpm || ""),
    },
    {
      label: "YouTube",
      oldVal: song.youtube?.length ? `${song.youtube.length} посилання(ь)` : "—",
      newVal: pData.youtube?.length
        ? `${pData.youtube.length} посилання(ь)`
        : "—",
      changed:
        (song.youtube?.length || 0) !== (pData.youtube?.length || 0) ||
        JSON.stringify(song.youtube) !== JSON.stringify(pData.youtube),
    },
  ];

  const hasMetaChanges = metaDiffs.some((d) => d.changed);
  const isDocumentChanged = song.document !== pData.document;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[92dvh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <GitPullRequest className="size-5 text-primary" />
              Розгляд пропозиції змін
            </DialogTitle>

            <StatusBadge status={activeProposal.status} />
          </div>
          <DialogDescription>
            Порівняйте поточну версію пісні з запропонованою та прийміть рішення.
          </DialogDescription>
        </DialogHeader>

        {/* Proposals selector if more than 1 proposal exists */}
        {proposals.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b">
            <span className="font-semibold text-muted-foreground shrink-0">
              Пропозиції:
            </span>
            {proposals.map((p, idx) => {
              const isSelected = p._id === activeProposal._id;
              const dateStr = new Date(p.createdAt).toLocaleDateString("uk-UA");
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    setSelectedId(p._id);
                    setRejectingMode(false);
                    setConfirmApprove(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span>{dateStr}</span>
                  <StatusDot status={p.status} />
                </button>
              );
            })}
          </div>
        )}

        {/* Proposer Info Card */}
        <div className="rounded-xl border bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border">
                <AvatarImage src={proposer?.photoUrl} />
                <AvatarFallback>
                  <User className="size-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{proposerName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>
                    Надіслано{" "}
                    {new Date(activeProposal.createdAt).toLocaleString("uk-UA")}
                  </span>
                </div>
              </div>
            </div>

            {activeProposal.reviewedBy && (
              <div className="text-xs text-right text-muted-foreground">
                <p>
                  Розглянув(ла):{" "}
                  <span className="font-medium text-foreground">
                    {[
                      activeProposal.reviewedBy.firstName,
                      activeProposal.reviewedBy.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") ||
                      activeProposal.reviewedBy.username ||
                      "Адміністратор"}
                  </span>
                </p>
                {activeProposal.reviewedAt && (
                  <p>
                    {new Date(activeProposal.reviewedAt).toLocaleString("uk-UA")}
                  </p>
                )}
              </div>
            )}
          </div>

          {activeProposal.comment && (
            <div className="bg-muted/40 rounded-lg p-3 text-sm border-l-4 border-primary">
              <div className="flex items-center gap-1.5 font-medium text-xs text-muted-foreground mb-1">
                <MessageSquare className="size-3.5" />
                <span>Коментар ініціатора:</span>
              </div>
              <p className="text-foreground whitespace-pre-wrap">
                {activeProposal.comment}
              </p>
            </div>
          )}

          {activeProposal.reviewComment && (
            <div className="bg-destructive/10 text-destructive dark:text-red-400 rounded-lg p-3 text-sm border-l-4 border-destructive">
              <p className="font-medium text-xs mb-1">Причина / Коментар до рішення:</p>
              <p className="whitespace-pre-wrap">{activeProposal.reviewComment}</p>
            </div>
          )}
        </div>

        {/* Metadata Diff Section */}
        {hasMetaChanges && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="size-4 text-amber-500" />
              Зміни в метаданих
            </h3>
            <div className="rounded-xl border overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-left text-muted-foreground">
                    <th className="p-2.5 font-medium w-1/4">Поле</th>
                    <th className="p-2.5 font-medium w-3/8">Поточне значення</th>
                    <th className="p-2.5 font-medium w-3/8">Запропоновано</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metaDiffs
                    .filter((d) => d.changed)
                    .map((item) => (
                      <tr key={item.label} className="hover:bg-muted/20">
                        <td className="p-2.5 font-medium text-muted-foreground">
                          {item.label}
                        </td>
                        <td className="p-2.5 text-foreground/80 line-through decoration-destructive/50">
                          {item.oldVal}
                        </td>
                        <td className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.newVal}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Document Diff Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="size-4 text-primary" />
              Текст та акорди пісні
              {isDocumentChanged ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium ml-2">
                  Текст змінено
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal ml-2">
                  Без змін у тексті
                </span>
              )}
            </h3>
          </div>

          <Tabs defaultValue="proposed" className="w-full">
            <TabsList className="grid grid-cols-3 max-w-md">
              <TabsTrigger value="proposed">Запропонований</TabsTrigger>
              <TabsTrigger value="current">Поточний</TabsTrigger>
              <TabsTrigger value="preview">
                <Music2 className="size-3.5 mr-1" />
                SongSheet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="proposed" className="mt-2">
              <div className="rounded-xl border bg-muted/20 p-4 max-h-80 overflow-y-auto font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {pData.document}
              </div>
            </TabsContent>

            <TabsContent value="current" className="mt-2">
              <div className="rounded-xl border bg-muted/20 p-4 max-h-80 overflow-y-auto font-mono text-xs whitespace-pre-wrap leading-relaxed opacity-75">
                {song.document}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-2">
              <div className="rounded-xl border bg-card p-4 max-h-80 overflow-y-auto">
                <SongSheet
                  content={pData.document}
                  fontSize={14}
                  showChords={true}
                  chordColor="#22c55e"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Controls (Only if proposal is pending) */}
        {activeProposal.status === "pending" && (
          <div className="border-t pt-4 space-y-3">
            {confirmApprove ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Ви впевнені, що хочете прийняти ці зміни? Дані пісні будуть
                  оновлені одразу.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmApprove(false)}
                    disabled={isReviewing}
                  >
                    Скасувати
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleApprove}
                    disabled={isReviewing}
                  >
                    <Check className="size-4 mr-1" />
                    Так, прийняти зміни
                  </Button>
                </div>
              </div>
            ) : rejectingMode ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-3">
                <p className="text-sm font-medium text-destructive">
                  Вкажіть причину відхилення (буде надіслана ініціатору):
                </p>
                <Textarea
                  placeholder="Наприклад: 'Акорди не підходять для нашої версії' або 'Текст вже актуальний'..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="bg-background text-sm"
                  rows={2}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRejectingMode(false);
                      setRejectReason("");
                    }}
                    disabled={isReviewing}
                  >
                    Скасувати
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                    disabled={isReviewing}
                  >
                    <X className="size-4 mr-1" />
                    Підтвердити відхилення
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Закрити
                </Button>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                    onClick={() => setRejectingMode(true)}
                    disabled={isReviewing}
                  >
                    <X className="size-4 mr-1" />
                    Відхилити
                  </Button>

                  <Button
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setConfirmApprove(true)}
                    disabled={isReviewing}
                  >
                    <Check className="size-4 mr-1" />
                    Прийняти зміни
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeProposal.status !== "pending" && (
          <div className="border-t pt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Закрити
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: SongProposalItem["status"] }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          <Clock className="size-3.5" />
          Очікує розгляду
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="size-3.5" />
          Прийнято
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
          <XCircle className="size-3.5" />
          Відхилено
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
          <Ban className="size-3.5" />
          Скасовано
        </span>
      );
  }
}

function StatusDot({ status }: { status: SongProposalItem["status"] }) {
  switch (status) {
    case "pending":
      return <span className="size-2 rounded-full bg-amber-500 shrink-0" />;
    case "approved":
      return <span className="size-2 rounded-full bg-emerald-500 shrink-0" />;
    case "rejected":
      return <span className="size-2 rounded-full bg-rose-500 shrink-0" />;
    case "cancelled":
      return <span className="size-2 rounded-full bg-gray-400 shrink-0" />;
  }
}
