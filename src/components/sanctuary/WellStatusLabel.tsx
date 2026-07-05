import type { WellCardStatus } from "@/src/features/well/wellCardStatus";

type WellStatusLabelProps = {
  status: WellCardStatus;
};

/** Dev/status labels are hidden on the garden artboard — no raw enums on scenery. */
export function WellStatusLabel({ status: _status }: WellStatusLabelProps) {
  return null;
}
