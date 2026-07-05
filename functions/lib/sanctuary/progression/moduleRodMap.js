"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WILDCARD_ROD_ID =
  exports.EPIC_ELEMENT_ROD_IDS =
  exports.RARE_ELEMENT_ROD_IDS =
  exports.MODULE_ROD_ASSIGNMENTS =
  exports.TOTAL_LESSON_COUNT =
  exports.ALL_LESSON_IDS =
  exports.MODULE_LESSON_IDS =
    void 0;
exports.moduleIdForRareRod = moduleIdForRareRod;
exports.rareRodForEpic = rareRodForEpic;
exports.clusterLessonIdsForRod = clusterLessonIdsForRod;
exports.assignmentForRareRod = assignmentForRareRod;
/** Lesson IDs aligned with `src/features/classroom/lessonCatalog.ts`. */
exports.MODULE_LESSON_IDS = {
  1: ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"],
  2: ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"],
  3: ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7"],
  4: ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"],
  5: ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"],
};
exports.ALL_LESSON_IDS = Object.values(exports.MODULE_LESSON_IDS).flat();
exports.TOTAL_LESSON_COUNT = exports.ALL_LESSON_IDS.length;
exports.MODULE_ROD_ASSIGNMENTS = [
  {
    moduleId: 1,
    rodId: "rare_fire",
    element: "fire",
    theme: "Regulate emotions together",
    clusterLessonIds: exports.MODULE_LESSON_IDS[1],
  },
  {
    moduleId: 2,
    rodId: "rare_water",
    element: "water",
    theme: "Cooperate and set limits with connection",
    clusterLessonIds: exports.MODULE_LESSON_IDS[2],
  },
  {
    moduleId: 3,
    rodId: "rare_wind",
    element: "wind",
    theme: "Support intrinsic motivation",
    clusterLessonIds: exports.MODULE_LESSON_IDS[3],
  },
  {
    moduleId: 4,
    rodId: "rare_electric",
    element: "electric",
    theme: "Grow through failure and discomfort",
    clusterLessonIds: exports.MODULE_LESSON_IDS[4],
  },
];
exports.RARE_ELEMENT_ROD_IDS = ["rare_fire", "rare_water", "rare_wind", "rare_electric"];
exports.EPIC_ELEMENT_ROD_IDS = ["epic_fire", "epic_water", "epic_wind", "epic_electric"];
exports.WILDCARD_ROD_ID = "rare_wildcard";
const ROD_TO_MODULE = new Map(
  exports.MODULE_ROD_ASSIGNMENTS.map((assignment) => [assignment.rodId, assignment.moduleId]),
);
const EPIC_TO_RARE = {
  epic_fire: "rare_fire",
  epic_water: "rare_water",
  epic_wind: "rare_wind",
  epic_electric: "rare_electric",
};
function moduleIdForRareRod(rodId) {
  return ROD_TO_MODULE.get(rodId) ?? null;
}
function rareRodForEpic(rodId) {
  return EPIC_TO_RARE[rodId] ?? null;
}
function clusterLessonIdsForRod(rodId) {
  const moduleId = moduleIdForRareRod(rodId);
  if (moduleId == null) return [];
  return exports.MODULE_LESSON_IDS[moduleId] ?? [];
}
function assignmentForRareRod(rodId) {
  return exports.MODULE_ROD_ASSIGNMENTS.find((row) => row.rodId === rodId) ?? null;
}
