/**
 * Deterministic hash-shard for DynamoDB partition keys.
 *
 * Distributes items across N buckets to avoid hot partitions when all
 * items of a type would otherwise share a single static PK. The shard
 * is derived from the item's unique ID, so lookups only need the ID.
 *
 * @param prefix  Entity prefix (e.g., "TASK", "AGENT_LOG")
 * @param id      Item ID to shard on
 * @param buckets Number of shard buckets (default 16)
 * @returns       Partition key like "TASK#7"
 */
export function pkShard(prefix: string, id: string, buckets = 16): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return `${prefix}#${Math.abs(h) % buckets}`;
}
