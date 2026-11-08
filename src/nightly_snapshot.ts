import { z } from "zod";
import { infrai } from "./infrai.js";

export const snapshotRequest = z.object({
  property_id: z.string().min(1),
  maintenance_requests: z.array(z.object({ id: z.string(), title: z.string(), status: z.string() })),
  tenant_documents: z.array(z.object({ id: z.string(), name: z.string() })),
  inspection_reminders: z.array(z.object({ id: z.string(), due_on: z.string() }))
});
export type SnapshotRequest = z.infer<typeof snapshotRequest>;

export function buildSnapshot(input: SnapshotRequest): string {
  return JSON.stringify({ captured_at: new Date().toISOString(), ...input });
}

export async function saveNightlySnapshot(input: SnapshotRequest): Promise<{ bucket: string; key: string }> {
  const data = snapshotRequest.parse(input);
  const bucket = process.env.SNAPSHOT_BUCKET ?? "property-nightly";
  await infrai.storage.bucket.create({ name: bucket });
  const key = `${data.property_id}/snapshots/${new Date().toISOString().slice(0, 10)}.json`;
  await infrai.storage.object.put(bucket, key, { data_base64: Buffer.from(buildSnapshot(data)).toString("base64"), content_type: "application/json", idempotency_key: key });
  return { bucket, key };
}

if (process.argv[1]?.endsWith("nightly_snapshot.ts")) {
  const sample = { property_id: "oak-house", maintenance_requests: [{ id: "m-17", title: "Leaky tap", status: "open" }], tenant_documents: [{ id: "d-4", name: "lease.pdf" }], inspection_reminders: [{ id: "i-2", due_on: "2026-09-20" }] };
  saveNightlySnapshot(sample).then((result) => console.log(JSON.stringify({ snapshot: "stored", ...result }))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
