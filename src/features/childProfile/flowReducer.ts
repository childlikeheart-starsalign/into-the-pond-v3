import type { ChildCompanionId, ChildInterestId } from "@/shared/childProfile/tierAccess";
import type { ChildrenSummaryEntry } from "@/shared/childProfile/childrenSummary";
import type { ChildArchetype } from "@/src/constants/narrative/types";

export type { ChildrenSummaryEntry };

export type ChildProfileDoc = {
  name: string;
  dob: string;
  companionId: ChildCompanionId;
  interests: ChildInterestId[];
  profileLocked: boolean;
  childOrder: number;
  childProfileSealDraftId?: string;
  createdAt?: unknown;
  archetype?: ChildArchetype | null;
  hasCompletedDay1Narrative?: boolean;
  narrativeProgress?: {
    currentScene: number;
    archetype?: ChildArchetype;
    completedAt?: string;
    lastUpdated?: string;
  } | null;
};

export type ChildProfileDraft = {
  name: string;
  dob: string;
  companionId: ChildCompanionId | null;
  interests: ChildInterestId[];
};

type DraftWithCompanion = Required<ChildProfileDraft> & { companionId: ChildCompanionId };

/** draftId is fixed for the lifetime of one flow instance (plan §7 / Phase A fix). */
type WithDraftId = { draftId: string };

export type ChildProfileFlowState =
  | ({ step: "name"; draft: ChildProfileDraft } & WithDraftId)
  | ({ step: "age"; draft: ChildProfileDraft } & WithDraftId)
  | ({ step: "companion"; draft: ChildProfileDraft } & WithDraftId)
  | ({ step: "interests"; draft: ChildProfileDraft } & WithDraftId)
  | ({ step: "reviewing"; draft: DraftWithCompanion } & WithDraftId)
  | ({ step: "sealing"; draft: DraftWithCompanion; startedAt: number } & WithDraftId)
  | { step: "confirmed"; childId: string; childOrder: number; draftId: string }
  | ({
      step: "error";
      draft: DraftWithCompanion;
      reason: "network" | "validation";
    } & WithDraftId)
  | ({
      step: "limit_reached";
      draft: DraftWithCompanion;
    } & WithDraftId);

export type ChildProfileFlowAction =
  | { type: "PATCH"; patch: Partial<ChildProfileDraft> }
  | { type: "ADVANCE"; patch?: Partial<ChildProfileDraft> }
  | { type: "BACK" }
  | { type: "ENTER_REVIEW" }
  | { type: "SEAL"; startedAt: number }
  | { type: "SEAL_SUCCESS"; childId: string; childOrder: number }
  | { type: "SEAL_FAILURE"; reason: "network" | "validation" }
  | { type: "SEAL_LIMIT_REACHED" }
  | { type: "RETRY" };

export function createEmptyDraft(): ChildProfileDraft {
  return {
    name: "",
    dob: "",
    companionId: null,
    interests: [],
  };
}

export function createFlowDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** One draftId for the whole flow instance — generated at mount, never on Review re-entry. */
export function createInitialFlowState(
  entry: "first_run" | "add_child",
  draftId: string = createFlowDraftId(),
): ChildProfileFlowState {
  return {
    step: entry === "add_child" ? "companion" : "name",
    draft: createEmptyDraft(),
    draftId,
  };
}

function draftIdOf(state: ChildProfileFlowState): string {
  return state.draftId;
}

export function childProfileFlowReducer(
  state: ChildProfileFlowState,
  action: ChildProfileFlowAction,
): ChildProfileFlowState {
  switch (action.type) {
    case "PATCH": {
      if (
        state.step === "sealing" ||
        state.step === "confirmed" ||
        state.step === "reviewing" ||
        state.step === "error" ||
        state.step === "limit_reached"
      ) {
        return state;
      }
      return {
        step: state.step,
        draft: { ...state.draft, ...action.patch },
        draftId: state.draftId,
      };
    }
    case "ADVANCE": {
      if (
        state.step === "sealing" ||
        state.step === "confirmed" ||
        state.step === "reviewing" ||
        state.step === "error" ||
        state.step === "limit_reached"
      ) {
        return state;
      }
      const draft = { ...state.draft, ...(action.patch ?? {}) };
      const draftId = state.draftId;
      if (state.step === "name") return { step: "age", draft, draftId };
      if (state.step === "age") return { step: "companion", draft, draftId };
      if (state.step === "companion") return { step: "interests", draft, draftId };
      return { ...state, draft };
    }
    case "ENTER_REVIEW": {
      if (state.step !== "interests" && state.step !== "error" && state.step !== "reviewing") {
        return state;
      }
      const draft: ChildProfileDraft = { ...state.draft };
      const draftId = draftIdOf(state);
      // add_child may start at companion with empty name/dob — collect them before review.
      if (!draft.name.trim()) {
        return { step: "name", draft, draftId };
      }
      if (!draft.dob) {
        return { step: "age", draft, draftId };
      }
      if (!draft.companionId) return state;
      return {
        step: "reviewing",
        draft: {
          name: draft.name.trim(),
          dob: draft.dob,
          companionId: draft.companionId,
          interests: draft.interests,
        },
        draftId,
      };
    }
    case "BACK": {
      if (
        state.step === "sealing" ||
        state.step === "confirmed" ||
        state.step === "limit_reached"
      ) {
        return state;
      }
      const draftId = state.draftId;
      if (state.step === "age") return { step: "name", draft: state.draft, draftId };
      if (state.step === "companion") return { step: "age", draft: state.draft, draftId };
      if (state.step === "interests") return { step: "companion", draft: state.draft, draftId };
      if (state.step === "reviewing" || state.step === "error") {
        return { step: "interests", draft: state.draft, draftId };
      }
      return state;
    }
    case "SEAL": {
      if (state.step !== "reviewing") return state;
      return {
        step: "sealing",
        draft: state.draft,
        draftId: state.draftId,
        startedAt: action.startedAt,
      };
    }
    case "SEAL_SUCCESS": {
      if (state.step !== "sealing" && state.step !== "reviewing") return state;
      return {
        step: "confirmed",
        childId: action.childId,
        childOrder: action.childOrder,
        draftId: state.draftId,
      };
    }
    case "SEAL_FAILURE": {
      if (state.step !== "sealing") return state;
      return {
        step: "error",
        draft: state.draft,
        draftId: state.draftId,
        reason: action.reason,
      };
    }
    case "SEAL_LIMIT_REACHED": {
      if (state.step !== "sealing" && state.step !== "reviewing") return state;
      return {
        step: "limit_reached",
        draft: state.draft,
        draftId: state.draftId,
      };
    }
    case "RETRY": {
      if (state.step !== "error") return state;
      return {
        step: "reviewing",
        draft: state.draft,
        draftId: state.draftId,
      };
    }
    default:
      return state;
  }
}
