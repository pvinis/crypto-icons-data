// Frozen, append-only. Never reorder or remove an entry — extIndex values in
// already-published manifests depend on this exact order.
export const EXT_TABLE = ["png", "jpg", "jpeg", "svg", "ico"] as const
