export type FieldJournalView = "cover" | "reader";

let currentView: FieldJournalView = "cover";
const listeners = new Set<(value: FieldJournalView) => void>();

export function getFieldJournalView(): FieldJournalView {
  return currentView;
}

export function setFieldJournalView(value: FieldJournalView): void {
  if (currentView === value) return;
  currentView = value;
  listeners.forEach((listener) => listener(value));
}

export function subscribeFieldJournalView(listener: (value: FieldJournalView) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
