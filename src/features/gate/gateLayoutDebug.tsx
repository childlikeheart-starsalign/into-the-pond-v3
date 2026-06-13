import { createContext, useContext } from "react";

const GateLayoutDebugContext = createContext(false);

export const GateLayoutDebugProvider = GateLayoutDebugContext.Provider;

export function useGateLayoutDebug(): boolean {
  return useContext(GateLayoutDebugContext);
}
