#!/usr/bin/env python3
"""Generate shared/sanctuary/well/catalog-*.ts from embedded question banks."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "shared" / "sanctuary" / "well"

THEME_LABELS: dict[str, str] = {
    "curiosity": "Wondering About...",
    "worries": "Carrying Quietly...",
    "excitement": "Bright Right Now...",
    "interests": "Drawn Toward...",
    "emotional": "Feeling Both Ways...",
    "social": "Between People...",
    "identity": "Becoming You...",
    "imagination": "What If...",
}

WHY_4_6: dict[str, str] = {
    "curiosity": "Young children reveal what fascinates them when questions feel playful, not like a quiz.",
    "worries": "Small worries named early are easier to carry together before they grow louder.",
    "excitement": "What lights them up today often becomes the thread you follow for years.",
    "interests": "Noticing what they gravitate toward helps you offer the right invitations, not more activities.",
    "emotional": "Naming feelings in the body builds the vocabulary they'll use for a lifetime.",
    "social": "How they experience fairness and friendship at four tells you what they need at six.",
    "identity": "Early self-stories are forming — your observations help them feel seen, not labeled.",
    "imagination": "Imaginative play is how young children rehearse values, rules, and who they might become.",
}

WHY_6_12: dict[str, str] = {
    "curiosity": "Children often reveal interests long before adults notice them. This teaches parents how to listen.",
    "worries": "Worries named without rush lose some of their power — and show you where support is needed.",
    "excitement": "What energizes them now often points toward strengths worth nurturing deliberately.",
    "interests": "Interests that feel 'random' to adults are often the earliest signal of identity forming.",
    "emotional": "Understanding their emotional patterns helps you respond to the feeling, not just the behavior.",
    "social": "Social choices at this age preview the relational skills they'll carry into adolescence.",
    "identity": "Identity questions get quieter as children age — asking now keeps the door open.",
    "imagination": "Imagination at this age is still a safe place to explore values before real-world stakes rise.",
}

DEPTH_4_6: dict[str, int] = {
    "curiosity": 2,
    "worries": 3,
    "excitement": 2,
    "interests": 2,
    "emotional": 3,
    "social": 2,
    "identity": 3,
    "imagination": 2,
}

DEPTH_6_12: dict[str, int] = {
    "curiosity": 3,
    "worries": 4,
    "excitement": 3,
    "interests": 3,
    "emotional": 4,
    "social": 3,
    "identity": 4,
    "imagination": 2,
}

QUESTIONS_6_12: dict[str, list[str]] = {
    "curiosity": [
        "If you could spend an entire week becoming an expert on one weird topic, what would you choose?",
        "Is there a question about how your own body works that you've never asked anyone?",
        "If you could secretly watch how something is made — any factory, kitchen, or workshop — which would you pick?",
        "What's something you've always wanted to try just once, even if it seems small?",
        "If you could ask a tree what it's seen over its lifetime, what do you think it would say?",
        "Is there a number, pattern, or rule you've noticed that seems to repeat everywhere once you start looking?",
        "If you could have a conversation with an animal for ten minutes, which animal would give you the most surprising answers?",
        "What's something adults say is 'just how it is' that you've always wanted to question?",
        "If you could time-travel to watch one historical event happen — not change it, just watch — what would you pick?",
        "Is there something you've taken apart, broken, or messed with just to understand it better?",
        "If you could ask one question to someone from a completely different country, what would you want to know about their life?",
        "What's a 'why' question you've had for a really long time without an answer?",
        "If you could shrink down to the size of an ant for a day, what would you want to explore first?",
    ],
    "worries": [
        "Is there something you've gotten better at hiding how you feel about?",
        "When you imagine next year, is there anything about it that feels uncertain or makes you wonder?",
        "Has there been a time you said 'I'm fine' when you weren't completely sure that was true?",
        "Is there a comparison you sometimes make between yourself and someone else that doesn't feel great?",
        "When you make a mistake in front of others, what's the hardest part about that moment?",
        "Is there something you used to be excited about that's started to feel like pressure instead?",
        "Has there been a moment where you felt like you had to grow up a little faster than you wanted to?",
        "Is there a topic that, if it comes up, makes you want to change the subject?",
        "When you think about things you can't control, is there one that's been on your mind lately?",
        "Has there been a time you felt responsible for something that maybe wasn't fully your job to fix?",
        "Is there a 'what people think of me' thought that sometimes gets loud in your head?",
        "When you're not sure how someone feels about you, what do you usually assume?",
        "Is there something you've decided not to try because you're worried how it might turn out?",
    ],
    "excitement": [
        "If you could design a perfect weekend with zero rules, what would the schedule look like?",
        "Is there a skill that, if you mastered it, would feel like a really big deal to you?",
        "What's something you've gotten genuinely better at this year, even if no one's pointed it out?",
        "If you could meet your future self at age 25, what's the first thing you'd want to ask them?",
        "Is there a place in the world that, if you saw a picture of it, would make you want to go there immediately?",
        "What's something you do that makes you forget to check the time?",
        "If you could create an event that happens once a year just for our family, what would it be?",
        "Is there something you've been quietly hoping will happen, even if it's a long shot?",
        "What's a compliment you received that you still think about?",
        "If you had unlimited resources to start a project — any size — what would you make?",
        "Is there a 'someday' goal you have that you haven't told many people about?",
        "What's something that, when it happens, instantly puts you in a good mood?",
        "If you could give a tour of your favorite place to someone who'd never been there, what would you show them first?",
    ],
    "interests": [
        "If you had to choose a topic to give a presentation about — something you actually find interesting — what would it be?",
        "Is there a type of puzzle, game, or challenge that you find satisfying to work through?",
        "What's something you'd want to get really good at, even if it took years?",
        "If you could shadow someone at their job for a day, what kind of work would you want to see?",
        "Is there a system or set of rules — like in a game, sport, or hobby — that you find genuinely interesting to understand?",
        "What's something you've researched on your own just because you wanted to know more?",
        "If you could redesign something that already exists to work better, what would you choose?",
        "Is there a craft, art form, or skill you've seen someone do that made you think 'I want to learn that'?",
        "What's a topic where you know more than most people your age?",
        "If you had to pick a 'specialty' — something you're known for — what would you want it to be?",
        "Is there something you do differently than how you were taught, because your way makes more sense to you?",
        "What's something you've taught yourself, even informally?",
    ],
    "emotional": [
        "Is there a feeling that's grown stronger as you've gotten older?",
        "When you're disappointed, how long does it usually take before you feel okay again?",
        "Has there been a time you felt proud of how you handled a hard feeling?",
        "Is there something that used to upset you that doesn't anymore — and do you know why that changed?",
        "When you feel overwhelmed, what does that actually feel like for you?",
        "Is there a difference between how you act when you're upset and how you feel inside?",
        "Has there been a moment where you felt calm in a situation that usually makes you anxious?",
        "When you think back on a hard day, what usually helped, even a little?",
        "Is there an emotion you wish you understood better — in yourself or in other people?",
        "Has there been a time your feelings surprised you — stronger or different than you expected?",
        "When you're feeling a lot of different things at once, how do you usually sort through it?",
        "Is there something that makes you feel instantly calmer when things feel chaotic?",
        "Has there been a time you felt proud of someone else's feelings — like seeing them handle something well?",
    ],
    "social": [
        "Is there a friendship that's changed a lot over the years — for better or different?",
        "When you're with different groups of friends, do you feel like a different version of yourself with each?",
        "Has there been a time you had to choose between what a friend wanted and what felt right to you?",
        "Is there someone you've never really talked to but think you might get along with?",
        "When conflicts happen between friends, what role do you usually end up playing?",
        "Has there been a time you misjudged someone before getting to know them?",
        "Is there a kind of person you find it easy to be around, even if you're not sure why?",
        "When you think about trust, is there something that makes you trust someone more quickly — or less?",
        "Has there been a moment where being kind to someone changed how you felt about yourself?",
        "Is there a group dynamic — at school, with friends, on a team — that you've noticed and thought about?",
        "When you disagree with a friend, what usually happens next?",
        "Is there someone you look out for, even if they don't know it?",
        "Has there been a time you felt like an outsider, even somewhere familiar?",
    ],
    "identity": [
        "Is there something about yourself that you've only recently figured out?",
        "When you think about the things that make you 'you,' is there one that feels most important?",
        "Has there been a time you did something that didn't feel like 'you' — and how did that feel?",
        "Is there a role you tend to play — in your family, with friends, at school — that you didn't choose but kind of fell into?",
        "When you imagine the kind of adult you might become, is there something you hope is true about them?",
        "Is there a value or belief you have that's different from what you were taught?",
        "Has there been a moment where you felt completely confident, even briefly?",
        "Is there something about how you think that feels different from how others seem to think?",
        "When you make decisions, do you usually go with your gut, think it through, or ask others first?",
        "Is there a part of your personality that's gotten stronger as you've grown?",
        "Has there been a time you changed your mind about something important to you?",
        "Is there something you do that, if you stopped doing it, would feel like losing a part of yourself?",
        "When you think about your reputation — how people see you — is there a gap between that and how you see yourself?",
    ],
    "imagination": [
        "If you could give every person in the world one piece of advice, what would it be?",
        "Is there a story you've imagined that you've never written down or told anyone?",
        "If you could combine two things that don't normally go together — any two things — what would you create?",
        "What would a day look like if everyone had to tell the complete truth, no matter what?",
        "If you could design a holiday that didn't exist yet, what would it celebrate?",
        "Is there a 'what if' scenario you think about — like what if something in history had gone differently?",
        "If you could give an object a personality — like your backpack or your bike — what do you think it would be like?",
        "What would you do if you woke up one day and everyone forgot something specific — like how to read, or how to lie?",
        "If you could ask your future self for one piece of advice about right now, what do you think they'd say?",
        "Is there a place that exists in your imagination that feels as real to you as anywhere actual?",
    ],
}

QUESTIONS_4_6_CORE: dict[str, list[str]] = {
    "curiosity": [
        "If you could ask the moon one question, what would you ask it?",
        "What's something you see every day that you still don't know how it works?",
        "If a bug could talk to you, what do you think it would want to tell you?",
    ],
    "worries": [
        "Is there something that feels a little scary right before you fall asleep?",
        "If you had a worry button, what's one thing you'd want to push away?",
        "Was there something today that felt bigger than you expected?",
    ],
    "excitement": [
        "What's something far away that you keep thinking about, even though it's not today?",
        "If you could practice one thing every day until you were amazing at it, what would you pick?",
        "What's a tiny thing that happened today that made you feel really good inside?",
    ],
    "interests": [
        "If you got to show someone how to do something, what would you teach them?",
        "Who do you like watching — like someone who does something cool or interesting?",
        "If you found a treasure box, what kind of things would you hope were inside?",
    ],
    "emotional": [
        "When you feel a big feeling, where does it feel like it's hiding in your body?",
        "Have you ever felt two feelings at the same time, like happy and a little sad together?",
        "When something doesn't go the way you wanted, what's the first thing that pops into your head?",
    ],
    "social": [
        "When something feels not fair, do you tell someone or keep it inside?",
        "Is there someone you know who doesn't get to go first very often?",
        "What's something a friend did that made you feel like they really know you?",
    ],
    "identity": [
        "Do you act a little different at school than you do at home? What's different?",
        "If someone watched you play for five minutes, what do you think they'd notice about you?",
        "Has there been a time you did something and surprised yourself?",
    ],
    "imagination": [
        "If you could make one new rule for our house, what would it be?",
        "Do you ever pretend you're somewhere else while you're doing something boring, like brushing your teeth?",
        "If you woke up tomorrow with a new superpower, what would you want it to help you do?",
    ],
}

QUESTIONS_4_6_ADDITIONAL: dict[str, list[str]] = {
    "curiosity": [
        "If you could shrink down and explore one ordinary object up close, what would you pick?",
        "What's a question about animals that nobody's ever been able to answer for you?",
        "If you could understand any language in the world for just one day, which would you choose and what would you want to hear?",
        "Is there a place near our home you've always wondered what's actually inside or behind?",
        "If scientists let kids vote on what to study next, what would you want them to figure out?",
        "What's something you've seen that made you think 'wait, how does that even work?'",
        "If you could follow one person around for a day just to see what they do, who would it be?",
        "What's a question you've been saving up to ask someone older than you?",
        "If you could take apart any machine just to see its insides, what would you choose?",
        "Is there something in nature you've watched closely enough to notice something most people miss?",
    ],
    "worries": [
        "Is there a sound or feeling that makes you feel uneasy, even if you can't explain why?",
        "When you imagine something going wrong, what does that usually look like in your head?",
        "Has there been a moment lately where you felt like you had to handle something on your own?",
        "Is there a part of your day that feels harder than the rest, even if it's small?",
        "If you could warn someone about something before it happens to them, what would it be?",
        "Has anyone ever said something that stuck with you longer than you think they realized?",
        "Is there something you've been waiting for someone to notice without having to say it out loud?",
        "When you think about getting older, is there anything about it that feels uncertain?",
        "Has there been a time you felt left out, even if just a little?",
        "Is there a 'what if' thought that comes back to you sometimes?",
    ],
    "excitement": [
        "What's something you'd want to do again and again if you could?",
        "If you could plan the perfect afternoon from start to finish, what would be in it?",
        "Is there a place you've never been but feel like you'd really love?",
        "What's something you're getting better at that makes you feel proud, even if no one's said anything about it?",
        "If you could spend a whole day with someone you admire, what would you want to do together?",
        "Is there a sound, smell, or feeling that instantly makes you happy?",
        "What's something you'd want to learn that feels just a little bit out of reach right now?",
        "If you could throw a party for any reason, what would the reason be?",
        "What's a moment from this year that you'd want to remember forever?",
        "Is there something you do that makes time feel like it goes by really fast?",
    ],
    "interests": [
        "If you had to organize a collection of something, what would you want to collect?",
        "Is there a job or role you've seen someone do that looks really satisfying?",
        "What's something you'd want to build if you had all the materials and tools you needed?",
        "If you could design your own room from scratch, what's the first thing you'd add?",
        "Is there a topic you'd want to read an entire book about, even if it's a strange one?",
        "What's something you've noticed that other people don't seem to pay attention to?",
        "If you could be really skilled at fixing one type of thing, what would you want it to be?",
        "Is there a type of story — adventure, mystery, funny, sad — that you're drawn to more than others?",
        "What's something you'd want to practice if practicing it didn't feel like work?",
        "If you could visit any kind of workplace just to see what happens there, where would you go?",
    ],
    "emotional": [
        "Is there a feeling you've had that you didn't have a name for?",
        "When you're upset, do you want someone close by, or do you want space? How do you usually know which?",
        "Has there been a time your feelings changed really fast, like from one thing to a totally different thing?",
        "When you feel proud of yourself, what does that feel like compared to when someone else is proud of you?",
        "Is there something that used to bother you a lot but doesn't anymore? What changed?",
        "When you feel nervous, is there anything that helps, even a little?",
        "Have you ever felt like crying but didn't know exactly why?",
        "Is there a feeling that's hard to talk about because it's hard to explain?",
        "When something makes you really angry, what usually happens right after the anger?",
        "Have you ever felt relieved about something you hadn't told anyone you were worried about?",
    ],
    "social": [
        "Is there someone you used to be close with but aren't as much anymore? What do you think happened?",
        "When you're in a group, do you usually end up leading, following, or somewhere in between?",
        "Has there been a time you stuck up for someone, or wished you had?",
        "Is there someone whose opinion of you matters more than you'd expect?",
        "When two people you know don't get along, how do you usually feel about it?",
        "Have you ever changed your mind about someone after getting to know them better?",
        "Is there a way you wish people understood you better?",
        "When someone's having a hard time, what do you usually do — or wish you knew how to do?",
        "Is there a group or place where you feel like you can really be yourself?",
        "Has there been a moment where you felt proud of how someone treated you?",
    ],
    "identity": [
        "If you had to describe yourself using something other than words — like a color, an animal, or a weather type — what would it be?",
        "Is there something about yourself that's changed a lot over the past year?",
        "When do you feel most like 'yourself'?",
        "Is there a version of you that only certain people get to see?",
        "If you could keep one thing about yourself exactly the same forever, what would it be?",
        "Has there been a moment where you felt like you were becoming more grown up?",
        "Is there something people think about you that isn't quite right?",
        "When you think about who you might be when you're older, is there something you hope stays the same?",
        "Is there a quality in someone else that you wish you had more of?",
        "Has there been a time you stood up for something you believed, even if it was small?",
    ],
    "imagination": [
        "If your thoughts had a shape or color, what do you think they'd look like?",
        "If you could turn any everyday object into something magical, what would you choose and what would it do?",
        "Is there a place that exists only in your imagination that you go to sometimes?",
        "If animals could read minds, which animal do you think would be best at it, and what would they notice about people?",
        "If you could make a rule that every adult had to follow, what would it be?",
        "Is there a character — from a book, show, or your own imagination — who feels like they understand you?",
        "If the world went completely silent for one hour, what do you think you'd do with that hour?",
        "If you could give one ordinary day a soundtrack, what would it sound like?",
        "Is there a dream you've had that felt so real you weren't sure it wasn't?",
        "If you could send a message to yourself five years from now, what's one thing you'd want to say?",
    ],
}


def merge_4_6() -> dict[str, list[str]]:
    merged: dict[str, list[str]] = {}
    for category in THEME_LABELS:
        merged[category] = (
            QUESTIONS_4_6_CORE.get(category, [])
            + QUESTIONS_4_6_ADDITIONAL.get(category, [])
        )
    return merged


def build_questions(
    age_band: str,
    by_category: dict[str, list[str]],
    why_map: dict[str, str],
    depth_map: dict[str, int],
) -> list[dict]:
    questions: list[dict] = []
    for category, prompts in by_category.items():
        for index, prompt in enumerate(prompts, start=1):
            questions.append(
                {
                    "questionId": f"{category}-{age_band}-{index:03d}",
                    "category": category,
                    "ageBand": age_band,
                    "themeLabel": THEME_LABELS[category],
                    "prompt": prompt,
                    "depthRating": depth_map[category],
                    "whyThisMatters": why_map[category],
                }
            )
    return questions


def emit_catalog_file(path: Path, age_band: str, questions: list[dict]) -> None:
    const_name = f"WELL_QUESTIONS_{age_band.replace('-', '_').upper()}"
    lines = [
        "/** Auto-generated by scripts/generate_well_catalog.py — do not edit by hand. */",
        "",
        'import type { WellBankQuestion } from "./types";',
        "",
        f"export const {const_name}: WellBankQuestion[] = ",
        json.dumps(questions, indent=2, ensure_ascii=False) + ";",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def emit_catalog_index() -> None:
    content = """/** Merged Well question catalog indices. */

import { WELL_QUESTIONS_4_6 } from "./catalog-4-6";
import { WELL_QUESTIONS_6_12 } from "./catalog-6-12";
import type { AgeBand, DiscoveryCategory, WellBankQuestion } from "./types";

export { WELL_QUESTIONS_4_6 } from "./catalog-4-6";
export { WELL_QUESTIONS_6_12 } from "./catalog-6-12";

export const WELL_QUESTIONS: WellBankQuestion[] = [...WELL_QUESTIONS_4_6, ...WELL_QUESTIONS_6_12];

export const WELL_QUESTION_BY_ID: Record<string, WellBankQuestion> = Object.fromEntries(
  WELL_QUESTIONS.map((question) => [question.questionId, question]),
);

export const QUESTIONS_BY_AGE_BAND: Record<AgeBand, WellBankQuestion[]> = {
  "4-6": WELL_QUESTIONS_4_6,
  "6-12": WELL_QUESTIONS_6_12,
};

export const QUESTIONS_BY_CATEGORY: Record<DiscoveryCategory, WellBankQuestion[]> = WELL_QUESTIONS.reduce(
  (acc, question) => {
    if (!acc[question.category]) acc[question.category] = [];
    acc[question.category].push(question);
    return acc;
  },
  {} as Record<DiscoveryCategory, WellBankQuestion[]>,
);

export function getWellQuestionById(questionId: string): WellBankQuestion | undefined {
  return WELL_QUESTION_BY_ID[questionId];
}

export function isValidWellQuestionId(questionId: string, ageBand?: AgeBand): boolean {
  const question = WELL_QUESTION_BY_ID[questionId];
  if (!question) return false;
  if (ageBand && question.ageBand !== ageBand) return false;
  return true;
}
"""
    (OUT_DIR / "catalog.ts").write_text(content, encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    q_6_12 = build_questions("6-12", QUESTIONS_6_12, WHY_6_12, DEPTH_6_12)
    q_4_6 = build_questions("4-6", merge_4_6(), WHY_4_6, DEPTH_4_6)

    emit_catalog_file(OUT_DIR / "catalog-6-12.ts", "6-12", q_6_12)
    emit_catalog_file(OUT_DIR / "catalog-4-6.ts", "4-6", q_4_6)
    emit_catalog_index()

    print(f"Generated {len(q_4_6)} questions for 4-6")
    print(f"Generated {len(q_6_12)} questions for 6-12")
    print(f"Total: {len(q_4_6) + len(q_6_12)}")


if __name__ == "__main__":
    main()
