const key = (step: number) => `veyro_onboarding_draft_step_${step}`;

export function saveDraft<T>(step: number, data: T): void {
  try {
    localStorage.setItem(key(step), JSON.stringify(data));
  } catch {
    // localStorage unavailable (private mode, quota exceeded)
  }
}

export function loadDraft<T>(step: number): T | null {
  try {
    const raw = localStorage.getItem(key(step));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(step: number): void {
  try {
    localStorage.removeItem(key(step));
  } catch {}
}

export function clearAllDrafts(): void {
  try {
    for (let i = 1; i <= 8; i++) {
      localStorage.removeItem(key(i));
    }
  } catch {}
}
