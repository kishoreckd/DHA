import type { ToolRun } from "../types";

export function ToolRunTimeline({ run }: { run: ToolRun }) {
  const events = [
    { label: "Queued", value: run.queued_at },
    { label: "Started", value: run.started_at },
    { label: "Completed", value: run.completed_at },
  ].filter((event) => event.value);

  return (
    <ol className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.label} className="rounded-md border px-4 py-3 text-sm">
          <strong>{event.label}</strong>
          <span className="mt-1 block text-muted-foreground">
            {new Date(event.value as string).toLocaleString()}
          </span>
        </li>
      ))}
    </ol>
  );
}
