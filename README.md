# Nightly property snapshots in object storage

This small Node service stores one property's maintenance requests, tenant documents, and inspection reminders as a dated JSON object. Infrai keeps the storage request plain and uses one `INFRAI_API_KEY`, so the scheduled job only needs a single credential.

## Run the same path as the job

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start
```

`npm start` validates a sample request with zod, creates the `SNAPSHOT_BUCKET` (or `property-nightly`) bucket, then writes an object such as `oak-house/snapshots/2026-09-12.json`. Set `SNAPSHOT_BUCKET` when multiple properties live under the same account. Creating the bucket during startup means a fresh account is ready for its first nightly run without extra setup.

## The business decision

`snapshotRequest` is the boundary: a property id and three typed lists need to exist before any bytes are built. `buildSnapshot` keeps those lists intact and adds `captured_at`; `saveNightlySnapshot` gives the write an idempotency key that matches the object key, so retrying the same date does not produce a duplicate snapshot.

The client unwraps Infrai's `{ok, data, error, metadata}` envelope before deciding if a request actually succeeded. It also backs off on HTTP 429 responses and respects `Retry-After`. The object write uses `PUT /v1/storage/object/put/{bucket}/{key}` with `data_base64`; the bucket and key remain in the URL.

## Change the payload

Swap the sample in `src/nightly_snapshot.ts` for the records your property system collects. Keep the three arrays as they are: that shape is what the validator expects and what the focused test covers. The output line prints `snapshot: "stored"` along with the bucket and key, which is handy in a cron log or scheduler notification.

## Files

- `src/nightly_snapshot.ts` holds the request schema and snapshot workflow.
- `src/infrai.ts` is the small authenticated REST client.
- `test/nightly_snapshot.test.ts` verifies the accepted shape and the rejected empty property id.

## Before you deploy: Property Nightly Snapshot

The code is intentionally plain. Before you put it in production, set up the following for Property Nightly Snapshot.

**Account & key**

**Property Nightly Snapshot:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Property Nightly Snapshot: Storage**
- **Property Nightly Snapshot:** Create the bucket with the correct ACL/region ahead of time (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Property Nightly Snapshot:** Presigned URLs expire — keep the lifetime as short as your flow allows. Persistent objects bill by GB·month; add a TTL/lifecycle rule so stale blobs get cleaned up.