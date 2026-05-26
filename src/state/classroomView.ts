import type { ClassroomView } from "@/src/constants/classroomAssets";

let currentView: ClassroomView = "open";
const listeners = new Set<(value: ClassroomView) => void>();

export function getClassroomView(): ClassroomView {
  return currentView;
}

export function setClassroomView(value: ClassroomView): void {
  if (currentView === value) return;
  currentView = value;
  listeners.forEach((listener) => listener(value));
}

export function subscribeClassroomView(listener: (value: ClassroomView) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
