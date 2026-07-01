import { settingsDoc } from "@/lib/firebase/refs";
import { settingsSchema } from "@/lib/firebase/schema";
import { getDocument, setDocument } from "@/services/firestore";
import type { UpsertSettingsInput } from "@/types";
import { validateInput } from "@/utils/validation";

export async function getSettings() {
  return getDocument(settingsDoc());
}

export async function upsertSettings(input: UpsertSettingsInput) {
  const data = validateInput(settingsSchema, input);
  return setDocument(settingsDoc(), data);
}
