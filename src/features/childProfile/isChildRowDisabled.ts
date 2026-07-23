export type ChildRowDisabledArgs = {
  accessible: boolean;
  switchingBlocked: boolean;
  isActive: boolean;
  childResultPeekEnabled: boolean;
};

/**
 * Flag off → byte-identical to production: isActive still disables.
 * Flag on → isActive no longer disables (peek allowed).
 */
export function isChildRowDisabled({
  accessible,
  switchingBlocked,
  isActive,
  childResultPeekEnabled,
}: ChildRowDisabledArgs): boolean {
  return !accessible || switchingBlocked || (isActive && !childResultPeekEnabled);
}
