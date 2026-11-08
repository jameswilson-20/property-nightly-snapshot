import assert from "node:assert/strict";
import { buildSnapshot, snapshotRequest } from "../src/nightly_snapshot.js";

const input = { property_id: "oak-house", maintenance_requests: [], tenant_documents: [], inspection_reminders: [] };
assert.equal(snapshotRequest.parse(input).property_id, "oak-house");
assert.match(buildSnapshot(input), /"property_id":"oak-house"/);
assert.throws(() => snapshotRequest.parse({ ...input, property_id: "" }));
console.log("snapshot request validation: ok");
