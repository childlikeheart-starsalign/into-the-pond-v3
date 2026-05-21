export const narrativeAssets = {
  shared: {
    1: require("@/assets/video/narrative/scene-01-finding.mp4"),
    2: require("@/assets/video/narrative/scene-02-child.mp4"),
    3: require("@/assets/video/narrative/scene-03-question.mp4"),
    4: require("@/assets/video/narrative/scene-04-others.mp4"),
    5: require("@/assets/video/narrative/scene-05-path.mp4"),
    6: require("@/assets/video/narrative/scene-06-exit.mp4"),
  },
  archetype: {
    storm: [
      require("@/assets/video/narrative/storm-scene-01.mp4"),
      require("@/assets/video/narrative/storm-scene-02.mp4"),
      require("@/assets/video/narrative/storm-scene-03.mp4"),
      require("@/assets/video/narrative/storm-scene-04.mp4"),
      require("@/assets/video/narrative/storm-scene-05.mp4"),
      require("@/assets/video/narrative/storm-scene-06.mp4"),
      require("@/assets/video/narrative/storm-scene-07.mp4"),
      require("@/assets/video/narrative/storm-scene-08.mp4"),
      require("@/assets/video/narrative/storm-scene-09.mp4"),
      require("@/assets/video/narrative/storm-scene-10.mp4"),
    ],
    wall: [
      require("@/assets/video/narrative/wall-scene-01.mp4"),
      require("@/assets/video/narrative/wall-scene-02.mp4"),
      require("@/assets/video/narrative/wall-scene-03.mp4"),
      require("@/assets/video/narrative/wall-scene-04.mp4"),
      require("@/assets/video/narrative/wall-scene-05.mp4"),
      require("@/assets/video/narrative/wall-scene-06.mp4"),
      require("@/assets/video/narrative/wall-scene-07.mp4"),
      require("@/assets/video/narrative/wall-scene-08.mp4"),
      require("@/assets/video/narrative/wall-scene-09.mp4"),
    ],
    spark: [
      require("@/assets/video/narrative/spark-scene-01.mp4"),
      require("@/assets/video/narrative/spark-scene-02.mp4"),
      require("@/assets/video/narrative/spark-scene-03.mp4"),
      require("@/assets/video/narrative/spark-scene-04.mp4"),
      require("@/assets/video/narrative/spark-scene-05.mp4"),
      require("@/assets/video/narrative/spark-scene-06.mp4"),
      require("@/assets/video/narrative/spark-scene-07.mp4"),
      require("@/assets/video/narrative/spark-scene-08.mp4"),
      require("@/assets/video/narrative/spark-scene-09.mp4"),
    ],
  },
} as const;

export type SharedSceneNumber = keyof typeof narrativeAssets.shared;
export type ArchetypeKey = keyof typeof narrativeAssets.archetype;
