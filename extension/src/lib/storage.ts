export interface StoredDefaults {
  origin?: string;
  destination?: string;
  deviceId?: string;
}

const KEY = "zivo:defaults";

export async function loadDefaults(): Promise<StoredDefaults | null> {
  const v = await chrome.storage.sync.get(KEY);
  return (v[KEY] as StoredDefaults | undefined) ?? null;
}

export async function saveDefaults(patch: Partial<StoredDefaults>): Promise<void> {
  const current = (await loadDefaults()) ?? {};
  await chrome.storage.sync.set({ [KEY]: { ...current, ...patch } });
}

export async function getOrCreateDeviceId(): Promise<string> {
  const current = (await loadDefaults()) ?? {};
  if (current.deviceId) return current.deviceId;
  const id = crypto.randomUUID();
  await saveDefaults({ deviceId: id });
  return id;
}
