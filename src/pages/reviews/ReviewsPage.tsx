import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { appToast } from "@/lib/toast";
import { reviewsApi, type Review } from "@/lib/api/collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, ListRowsSkeleton, PageHeader } from "@/components/common/product-ui";
import { ActionCard, DataRow, Field, JsonBlock, TextAreaField } from "@/components/common/api-panels";

export function ReviewsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Review | null>(null);
  const [comparison, setComparison] = useState<unknown>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [sourceType, setSourceType] = useState("report_version");
  const [sourceId, setSourceId] = useState("");
  const [title, setTitle] = useState("Report review");
  const [reviewers, setReviewers] = useState("");
  const [message, setMessage] = useState("");

  const reviewsQuery = useQuery({ queryKey: ["reviews"], queryFn: reviewsApi.list });

  const createReview = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        workspace_id: workspaceId,
        source_type: sourceType,
        source_id: sourceId,
        title,
        reviewer_emails: reviewers.split(",").map((email) => email.trim()).filter(Boolean),
        notes: "Created from frontend.",
      }),
    onSuccess: (review) => {
      appToast.success("Review created");
      setSelected(review);
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const action = useMutation({
    mutationFn: async ({ reviewId, kind }: { reviewId: string; kind: "comment" | "changes" | "approve" | "reject" | "comparison" }) => {
      if (kind === "comment") return reviewsApi.comment(reviewId, { message, section_key: "executive-summary" });
      if (kind === "changes") return reviewsApi.requestChanges(reviewId, message || "Please update the draft.");
      if (kind === "approve") return reviewsApi.approve(reviewId);
      if (kind === "reject") return reviewsApi.reject(reviewId);
      return reviewsApi.comparison(reviewId);
    },
    onSuccess: (result, variables) => {
      if (variables.kind === "comparison") setComparison(result);
      appToast.success("Review action completed");
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Review and approval"
        title="Review queue"
        description="Create reviews, route comments, request changes, approve/reject, and inspect comparison output."
        actions={
          <Button variant="outline" onClick={() => void reviewsQuery.refetch()}>
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ActionCard
          title="Create review"
          description="Maps to POST /reviews."
          action={{ label: "Create review", onClick: () => createReview.mutate() }}
          pending={createReview.isPending}
        >
          <Field id="review-workspace" label="Workspace ID" value={workspaceId} onChange={setWorkspaceId} />
          <Field id="review-source-type" label="Source type" value={sourceType} onChange={setSourceType} />
          <Field id="review-source-id" label="Source ID" value={sourceId} onChange={setSourceId} />
          <Field id="review-title" label="Title" value={title} onChange={setTitle} />
          <Field id="reviewers" label="Reviewer emails" value={reviewers} onChange={setReviewers} placeholder="one@example.com, two@example.com" />
        </ActionCard>

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>POST action buttons map to comment, changes, approval, rejection, and comparison endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <TextAreaField id="review-message" label="Comment or change reason" value={message} onChange={setMessage} rows={3} />
            {reviewsQuery.isError && <ErrorState message="Unable to load reviews." retry={() => void reviewsQuery.refetch()} />}
            {reviewsQuery.isLoading ? (
              <ListRowsSkeleton rows={4} />
            ) : (reviewsQuery.data ?? []).length === 0 ? (
              <EmptyState icon={<ClipboardCheck />} title="No reviews yet" />
            ) : (
              reviewsQuery.data?.map((review) => (
                <DataRow
                  key={review.id}
                  title={review.title || review.id}
                  detail={`${review.source_type || "source"}: ${review.source_id || "not set"}`}
                  status={review.status}
                  action={
                    <span className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(review)}>
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => action.mutate({ reviewId: review.id, kind: "comment" })}>
                        Comment
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => action.mutate({ reviewId: review.id, kind: "changes" })}>
                        Changes
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => action.mutate({ reviewId: review.id, kind: "comparison" })}>
                        Compare
                      </Button>
                      <Button size="sm" onClick={() => action.mutate({ reviewId: review.id, kind: "approve" })}>
                        Approve
                      </Button>
                    </span>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected review</CardTitle>
          </CardHeader>
          <CardContent>
            <JsonBlock value={selected} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <JsonBlock value={comparison} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
