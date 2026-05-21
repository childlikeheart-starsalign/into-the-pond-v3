import { ChildArchetype } from "./types";

// ============================================================
// SCENE 1: THE FINDING — universal
// ============================================================

export const SCENE_1_PARAGRAPHS: string[] = [
  "You find it at the edge of sleep—a door you didn't know was there. Not in your house. Somewhere quieter.",
  "The garden beyond is overgrown but not wild. Someone tended it once. Left tools behind. There is a pond, with ripples created by creatures underneath.",
  "The air smells like wet earth after rain.",
  "A figure sits near the gate. Old, but not frail. Watching the garden the way someone watches a fire.",
  '"You\'re here," the Spirit says. Not a question.',
  "You don't remember deciding to enter. But you're standing inside now, and the gate is already closing softly behind you.",
];

// ============================================================
// SCENE 2: THE CHILD WHO FOLLOWS — archetype-branched
// ============================================================

export const SCENE_2_PARAGRAPHS: Record<ChildArchetype, string[]> = {
  storm: [
    "A small shape moves at the edge of the path. Not hiding, exactly. Just… not coming closer.",
    "Your child.",
    "They're pacing near a puddle, kicking water with both feet. Small shockwaves ripple outward. Their jaw is tight.",
    'The Spirit stands. "They\'ve been waiting."',
    "You want to call out. But your voice doesn't work here. You can only watch.",
  ],
  wall: [
    "A small shape moves at the edge of the path. Not hiding, exactly. Just… not coming closer.",
    "Your child.",
    "They're sitting on a stone bench, knees pulled up, watching a leaf fall in slow spirals. They don't look at you.",
    'The Spirit stands. "They\'ve been waiting."',
    "You want to call out. But your voice doesn't work here. You can only watch.",
  ],
  spark: [
    "A small shape moves at the edge of the path. Not hiding, exactly. Just… not coming closer.",
    "Your child.",
    "They're standing with their arms crossed, staring at a locked gate in the garden wall. Testing the handle. Rattling it.",
    'The Spirit stands. "They\'ve been waiting."',
    "You want to call out. But your voice doesn't work here. You can only watch.",
  ],
};

// ============================================================
// SCENE 3: THE FIRST QUESTION — archetype-branched
// ============================================================

export const SCENE_3_PARAGRAPHS: Record<ChildArchetype, string[]> = {
  storm: [
    "The Spirit walks slowly toward your child. No hurry. Hands loose at their sides.",
    "They don't speak at first. Just sit nearby.",
    "After a long silence:",
    "\"The water's cold, isn't it?\"",
    "Your child stops kicking. Nods once.",
    '"It feels good to move something that moves back."',
    "The Spirit stands. Walks back toward you.",
    '"They don\'t need to be different," they say quietly. "They need to be understood."',
  ],
  wall: [
    "The Spirit walks slowly toward your child. No hurry. Hands loose at their sides.",
    "They don't speak at first. Just sit nearby.",
    "After a long silence:",
    '"That leaf took a long time to fall."',
    "Your child's eyes flick toward them, then away.",
    '"Sometimes it\'s easier to watch things than to be in them."',
    "The Spirit stands. Walks back toward you.",
    '"They don\'t need to be different," they say quietly. "They need to be understood."',
  ],
  spark: [
    "The Spirit walks slowly toward your child. No hurry. Hands loose at their sides.",
    "They don't speak at first. Just sit nearby.",
    "After a long silence:",
    '"Locked."',
    "Your child rattles the gate harder.",
    '"You want to see what\'s on the other side. Even if it means breaking something."',
    "Your child doesn't answer. But something in their shoulders drops. Just slightly.",
    "The Spirit stands. Walks back toward you.",
    '"They don\'t need to be different," they say quietly. "They need to be understood."',
  ],
};

// ============================================================
// SCENE 4: THE OTHERS — archetype-branched (Mei's line differs)
// ============================================================

export const SCENE_4_PARAGRAPHS: Record<ChildArchetype, string[]> = {
  storm: [
    "Two figures appear on the path ahead.",
    "A man in his forties, sleeves rolled up, carrying firewood. He sets it down near a bench and wipes his hands. Looks at your child, then at you. Nods once. No smile. Just acknowledgment.",
    '"David," the Spirit says. "He used to shout a lot."',
    'David\'s mouth twitches. "Still do, sometimes."',
    "A woman with greying hair approaches from the opposite direction, carrying a watering can. She moves slowly, like someone who has learned not to rush. She kneels near a planted bed and runs her hand over the soil.",
    '"Jia," the Spirit says. "She thought she could think her way through everything."',
    'Jia glances up. "I still try."',
    "And then—footsteps. Fast, light.",
    "A girl, maybe eight or nine, running toward your child. Not with urgency. With curiosity.",
    "She stops a few feet away. Crouches down.",
    '"I used to break things too," she says.',
    "Your child looks at her.",
    '"Not because I was bad. Because I didn\'t have words yet."',
    '"Mei," the Spirit says. "She remembers what it was like."',
  ],
  wall: [
    "Two figures appear on the path ahead.",
    "A man in his forties, sleeves rolled up, carrying firewood. He sets it down near a bench and wipes his hands. Looks at your child, then at you. Nods once. No smile. Just acknowledgment.",
    '"David," the Spirit says. "He used to shout a lot."',
    'David\'s mouth twitches. "Still do, sometimes."',
    "A woman with greying hair approaches from the opposite direction, carrying a watering can. She moves slowly, like someone who has learned not to rush. She kneels near a planted bed and runs her hand over the soil.",
    '"Jia," the Spirit says. "She thought she could think her way through everything."',
    'Jia glances up. "I still try."',
    "And then—footsteps. Fast, light.",
    "A girl, maybe eight or nine, running toward your child. Not with urgency. With curiosity.",
    "She stops a few feet away. Crouches down.",
    "\"It's okay if you don't want to talk,\" she says.",
    "Your child's fingers uncurl slightly.",
    '"I\'ll just sit here."',
    '"Mei," the Spirit says. "She remembers what it was like."',
  ],
  spark: [
    "Two figures appear on the path ahead.",
    "A man in his forties, sleeves rolled up, carrying firewood. He sets it down near a bench and wipes his hands. Looks at your child, then at you. Nods once. No smile. Just acknowledgment.",
    '"David," the Spirit says. "He used to shout a lot."',
    'David\'s mouth twitches. "Still do, sometimes."',
    "A woman with greying hair approaches from the opposite direction, carrying a watering can. She moves slowly, like someone who has learned not to rush. She kneels near a planted bed and runs her hand over the soil.",
    '"Jia," the Spirit says. "She thought she could think her way through everything."',
    'Jia glances up. "I still try."',
    "And then—footsteps. Fast, light.",
    "A girl, maybe eight or nine, running toward your child. Not with urgency. With curiosity.",
    "She stops a few feet away. Crouches down.",
    '"I know a way through," she says.',
    "Your child's eyes widen.",
    '"But you have to wait until the garden is ready."',
    '"Mei," the Spirit says. "She remembers what it was like."',
  ],
};

// ============================================================
// SCENE 5: THE PATH FORWARD — universal
// ============================================================

export const SCENE_5_PARAGRAPHS: string[] = [
  "The Spirit gestures to a stone bench near the gate. You sit.",
  "They hand you something. A small book. Handwritten. Pages soft with age.",
  '"This garden was built by people who struggled," the Spirit says. "They left lessons behind. Not rules. Just... what they learned."',
  "You open the first page.",
  '"Lesson 1.1: Why reasoning fails during emotional flooding."',
  "The words are simple. But they sit heavy in your chest.",
  '"You don\'t have to read it now," the Spirit says. "It will be here when you\'re ready."',
  "Your child is still near the water. Mei is sitting beside them now, not speaking. Just present.",
  "David is stacking firewood. Jia is watering a row of seedlings.",
  "The garden is quiet.",
  '"Come back tomorrow," the Spirit says. "The path gets clearer."',
];

// ============================================================
// SCENE 6: THE QUIET EXIT — universal
// ============================================================

export const SCENE_6_PARAGRAPHS: string[] = [
  "You stand to leave.",
  "As you walk toward the gate, your child looks up. Just for a second. Eye contact.",
  "They don't follow you. But they don't look away either.",
  "The Spirit opens the gate.",
  '"They\'ll be here when you return," they say.',
  "The door closes softly.",
  "You're back in your own room. The house is quiet. Your real child is asleep down the hall.",
  "But something has shifted.",
  "You're not sure what.",
  "Just… something.",
];
