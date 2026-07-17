# Archetype Diagnostics — Quiz Bank (v2)

**Changed since v1:** added a clinical/developmental review (§0) — this
is the section most likely to change scope, read it first. Tightened
Deep Check's recency anchoring (§4). Folded the garden-map result
presentation and confirmed palette into the plan itself (§5) rather than
leaving it as chat-only context. Strengthened the "Quiet Tester"
recommendation based on developmental rationale, not just a scoring
artifact (§2, §9).

Two capture methods, both resolving to the existing three archetypes
(`storm` / `wall` / `spark` in `archetypes.ts`) for compatibility with
today's scene branching in `narrativeContent.ts`.

---

## 0. Clinical & developmental review

This section exists because a behavior-pattern tool aimed at children
under 12 carries real risks that a generic quiz-design pass wouldn't
catch. None of these are reasons not to build this — they're reasons to
build it carefully. Each item below is a specific design requirement,
not a general caution.

### 0.1 Labeling risk — the single biggest concern

Categorical labels applied to children have a documented tendency to
become self-fulfilling: a parent who comes to see their child as "a
Storm" may start interpreting ambiguous behavior through that lens and
responding in ways that reinforce it — a well-known dynamic in
parent-child coercive interaction patterns. The existing single-select
screen already gestures at this with _"which pattern do you recognise
most right now"_ and _"you can explore all paths later,"_ but that
framing needs to be a **hard rule applied everywhere an archetype name
appears**, not just the intro screen.

**Rule for all parent-facing copy, both quizzes, all future copy:**
never state a result as an identity claim. Always a contextual,
time-bound pattern.

- Not: _"Alex is a Storm."_
- Yes: _"Storm patterns are showing up most right now."_

This applies to result screens, trend copy, and any future scene
branching that surfaces the archetype name back to the parent.

### 0.2 Developmental appropriateness across a 4–12 age range

Boundary-testing, big reactions, and withdrawal all mean **different
things at different ages** — testing limits is a normal, healthy part
of autonomy development around ages 3–5, and again during
pre-adolescent individuation around 9–12. A Spark-leaning result at age
5 and the same result at age 11 aren't the same finding, and copy that
treats them identically risks pathologizing ordinary development.

**Recommendation:** don't fork the item bank by age — one instrument
keeps the tool simple and the questions comparable over time as a child
grows. Instead, **layer age-aware interpretive copy on top of the
existing result**, keyed to the same two age bands the app already uses
for Well content (4–6 and 6–12) — reuse that boundary rather than
inventing a third age model. Two illustrative examples of the pattern
(full copy needs its own content pass, this is not final):

- Spark result, age 4–6: _"Testing limits is common and expected at
  this age — it's part of how kids this young learn where boundaries
  are."_
- Spark result, age 6–12: _"Pushing on rules and wanting reasons often
  shows up more as kids build independence."_

### 0.3 Parent proxy-report bias — why the scenario design matters

Any parent-reported instrument about a child's behavior is vulnerable
to state-dependent bias — a parent's own stress, mood, or one
memorable-but-unrepresentative incident can skew a global impression far
more than it should. This is precisely why Deep Check anchors each
question to **one specific recent moment** rather than asking for an
overall impression — behaviorally anchored items are meaningfully more
reliable than trait-style ratings for exactly this reason. Keep this
design principle; don't simplify it toward abstract trait questions
later for the sake of shorter copy.

**Tightening this further:** the current scenario prompts say "think
about the last time..." with no recency bound, which risks a parent
anchoring on a dramatic but months-old incident. Bound it:

> "Think about a recent time (in the last week or two)..."

Applied to all 5 Deep Check scenarios in §4.

### 0.4 The Driver axis forces a binary that isn't always true

Axis B (Overwhelmed ↔ Testing) presents these as opposite ends of one
slider, but in real moments a child can be **both** — a dysregulated
meltdown that also functions to test a limit is common, not an edge
case. Forcing a single bipolar choice here is a real construct-validity
concern, not a nitpick.

**Considered and rejected:** splitting this into two independent
unipolar ratings (how overwhelmed, how much testing — both 0–10,
independently). This is the more accurate instrument, but it roughly
doubles Deep Check's item count and breaks the 3-minute budget along
with the clean single-coordinate result.

**Recommendation instead:** keep the single bipolar slider for
practicality, but the interpretation layer must explicitly correct for
this rather than staying silent about it. Required line in Deep Check
result copy, every time:

> "Most moments include a bit of both — this shows which one seemed to
> lead."

This resolves the honesty problem without adding instrument complexity.
If real usage data later shows this matters more than expected (e.g. a
lot of borderline slider placements clustering at the midpoint),
revisit the two-slider design then — don't build it preemptively.

### 0.5 "Quiet Tester" — upgrading this from an artifact to a real finding

v1 flagged the fourth quadrant (quiet + testing) as something the
scoring math happened to surface. Worth being more direct: **this is a
real, recognized pattern in child development, not a mapping side
effect.** Quiet, controlled resistance — calm refusal, passive
non-compliance, stubbornness without visible distress or open
confrontation — is a genuine and distinct style from both Wall's
shutdown (which is driven by overwhelm) and Storm/Spark's visible
pushback. It's also commonly **under-noticed by parents and by tools
like this one**, precisely because it doesn't present as disruptive.

This strengthens the recommendation from v1: rather than treating
`wall`-mapping as an acceptable permanent default, product should treat
"Quiet Tester" as a strong candidate for becoming a real fourth
archetype, informed by how often `quadrantLabel` actually lands there in
practice (see §7's data model — this is exactly why that field exists
separately from the collapsed `mappedArchetype`).

### 0.6 Non-diagnostic disclaimer

This needs to exist somewhere in the product, stated once, not
repeated intrusively on every screen:

> "This is a reflection tool, not a diagnosis. If patterns feel
> intense, frequent, or worrying, a pediatrician or child psychologist
> can help in ways this can't."

**Placement recommendation:** shown once on a parent's first Deep Check
result, and reachable afterward from a small persistent "about this
tool" affordance rather than repeated on every result screen — repeating
it every time would itself start to feel alarming, which undercuts the
calm tone this is meant to protect.

---

## 1. Why two versions, and why sliders for one of them

**Quick Check** is a more reliable version of today's exact model —
same three-bucket output, just asked via five concrete moments instead
of one abstract self-description.

**Deep Check** is a genuinely different tool. A category re-picked every
few days either stays the same (uninformative) or flips abruptly
(alarming, and probably noise, not signal). A continuous two-axis score,
re-taken periodically, can show gradual movement — which is what
re-testing is actually for.

---

## 2. The two-axis model (Deep Check only)

| Axis               | Low end                              | High end                                    |
| ------------------ | ------------------------------------ | ------------------------------------------- |
| **A — Expression** | Turns inward — goes quiet, withdraws | Turns outward — loud, visible reaction      |
| **B — Driver**     | Overwhelmed — seeking calm or safety | Testing — seeking autonomy or understanding |

See §0.4 for why Axis B is a deliberate simplification, and the
required interpretation-copy mitigation for it.

### Corner mapping

| Corner              | Axis A | Axis B | Maps to                     |
| ------------------- | ------ | ------ | --------------------------- |
| Quiet + overwhelmed | Low    | Low    | **Wall**                    |
| Loud + overwhelmed  | High   | Low    | **Storm**                   |
| Loud + testing      | High   | High   | **Spark**                   |
| Quiet + testing     | Low    | High   | **Quiet Tester** — see §0.5 |

**Near-center results:** if both axes land close to the midpoint, show
a blended description rather than forcing whichever corner is nearest —
consistent with §0.1's rule against overclaiming a clean label.

---

## 3. Quick Check — 1 minute

**Intro copy:**

> Tell us about your child
> Which pattern do you recognise most right now?
> You can explore all paths later. This just helps us start in the
> right place.

**Format:** 5 questions, one tap each. Tally whichever archetype is
picked most; ties resolve to a blended result.

### Q1 — When something doesn't go their way

- **Storm:** Big reaction right away — tears, yelling, or a meltdown
- **Wall:** Goes quiet, walks away, or seems to shut the moment out
- **Spark:** Immediately asks "why not?" or tries to negotiate

### Q2 — When it's time to stop something fun

- **Storm:** Protests loudly, can escalate fast
- **Wall:** Ignores you, or pretends not to hear
- **Spark:** Wants the reason, or bargains for more time

### Q3 — In a new or unfamiliar situation

- **Storm:** Gets overwhelmed, reacts big
- **Wall:** Holds back, watches quietly from the edge
- **Spark:** Jumps in, starts exploring or asking questions

### Q4 — When they're corrected or told "no"

- **Storm:** The moment can spiral fast
- **Wall:** Goes still, sometimes hard to reach for a while after
- **Spark:** Pushes back, wants to understand the rule itself

### Q5 — At the end of a long or tiring day

- **Storm:** Small things set them off
- **Wall:** Withdraws, wants to be left alone
- **Spark:** Gets restless, tests limits more than usual

_(Q5 is intentionally fatigue-anchored, not a flaw — stress-response
style is often most visible under fatigue, so this item is chosen
deliberately, not despite the confound.)_

**Scoring:** simple majority across the 5 picks. Tie → blended result,
no forced tiebreaker.

---

## 4. Deep Check — 3 minutes

**Intro copy:**

> A closer look
> Think through five recent moments — for each, you'll place two quick
> sliders. There's no wrong answer, and you can retake this any time
> things feel like they're shifting.

**Format:** 5 short scenarios, two slider placements each (Axis A,
Axis B). Slider labels are fixed across all 5 scenarios — don't vary
wording per scenario, that breaks the aggregation math in §4.1.

**Slider A copy (every scenario):** "In that moment, did they turn
inward or outward?" — left _"Went quiet / withdrew,"_ right _"Got loud
/ visible."_

**Slider B copy (every scenario):** "What was underneath it?" — left
_"Overwhelmed — needed to calm down,"_ right _"Testing — wanted to
understand or negotiate."_

All five scenario prompts now carry the recency bound from §0.3:

### Scenario 1 — Told "no"

"Think about a recent time (in the last week or two) you told them no
to something they really wanted."

### Scenario 2 — A change in plans

"Think about a recent time (in the last week or two) their routine or
plans changed suddenly, without warning."

### Scenario 3 — A hard transition

"Think about a recent transition that was tough — leaving somewhere
fun, bedtime, getting off a screen."

### Scenario 4 — A social moment

"Think about a recent time they were around new people, or in a group
setting."

### Scenario 5 — After a mistake

"Think about a recent time they made a mistake, or you had to correct
something they did."

### 4.1 Scoring

- Axis A score = average of the 5 Expression slider values (0–100)
- Axis B score = average of the 5 Driver slider values (0–100)
- Plot (Axis A, Axis B) as a single point, map to nearest corner per §2
- Store the raw coordinate + timestamp for trending, not just the
  mapped label

### 4.2 Required result copy (both new, per §0)

Every Deep Check result must include, alongside the mapped
label/description:

1. The both-can-be-true line from §0.4
2. The age-band-aware note from §0.2 (content pass needed, see §9)
3. On first-ever Deep Check only: the disclaimer from §0.6

---

## 5. Result presentation — the garden map

Confirmed direction: **not a literal X/Y chart.** Axis lines, gridlines,
and numeric coordinates read as a measurement tool, which both
undercuts the calm tone and overclaims precision a 5-item slider average
doesn't actually have. Instead, an illustrated space with four soft
regions and a single marker — no axis labels, no numbers shown to the
parent.

### Confirmed palette

| Element                      | Color                     | Hex       |
| ---------------------------- | ------------------------- | --------- |
| Storm region                 | Dusk Rose                 | `#A87878` |
| Wall region                  | Pond Sage                 | `#6F7D68` |
| Spark region                 | Lamp Amber                | `#C4A35A` |
| Quiet Tester region          | _unconfirmed placeholder_ | `#8E7C93` |
| Marker, trail, region labels | Bark Umber                | `#7A5C45` |

**Why the marker is neutral, not region-colored:** the marker shows
_where an observation sits_, independent of which region it's currently
closer to. A region-colored marker would visually claim a label before
the parent has even read the result — Bark Umber keeps that reveal
sequenced through the surrounding regions instead.

### Structure

- Regions render as soft, flat, overlapping washes (no gradients or
  blur — flat fills only, consistent with the rest of the illustrated
  material language)
- No axis lines, tick marks, or numeric labels anywhere in the parent-
  facing view
- First-ever Deep Check: single marker, no trail
- Second and later: a thin, faint connecting line back to 1–2 prior
  marker positions — this is what carries the "movement over time"
  value that a chart would otherwise need numbers to convey

### Framing requirements

- **Private, for-you framing.** This is sensitive personal reflection
  about a parent's own child — result screens should read as something
  found only in the parent's own space, not surfaced anywhere the child
  could encounter it, and not accompanied by notification-badge-style
  UI that implies urgency or something to check on.
- **Re-test invitation, not a reminder.** Cadence guidance from §6 stays
  a gentle, optional nudge — never phrased as a check-in the parent is
  behind on. "Anxious tracking behavior" (§6) is exactly what a
  poorly-worded reminder would produce.

### Not yet resolved

- Quiet Tester's real color, pending §0.5 / §9's product decision
- Whether the illustrated regions need real paper-texture treatment
  (matching the brand's hand-painted material language) rather than the
  flat mockup washes used for this planning pass — likely yes, flagged
  as its own small design task

---

## 6. Re-test cadence

- **Soft floor:** don't prompt or allow re-testing more than roughly
  every 3–4 days. Testing daily risks tipping into anxious tracking
  behavior. A gentle "you last checked in 2 days ago" note is enough —
  don't hard-block, just don't invite more frequent use.
- **Trend copy describes direction, not a number** — "leaned a bit more
  toward X over the last two weeks," never a percentage or delta.

---

## 7. Relationship to the existing single-screen capture

**Quick Check replaces** the current one-question screen outright.
**Deep Check is additive** — offered as an optional path, not required.
Existing `archetypes.ts` and scene-branching need no changes for either.

---

## 8. Data model

```
users/{uid}.childArchetype                  // unchanged — 'storm' | 'wall' | 'spark'

users/{uid}/archetypeChecks/{checkId}
  type: 'quick' | 'deep'
  completedAt: timestamp
  mappedArchetype: 'storm' | 'wall' | 'spark'
  ageBandAtCheck: '4-6' | '6-12'   // NEW — snapshot at check time, drives §0.2 interpretive copy;
                                    // snapshot, not live-computed, so past results don't silently
                                    // reinterpret themselves as a child ages into the next band
  // deep only:
  axisA: number   // 0-100, inward-outward
  axisB: number   // 0-100, overwhelmed-testing
  quadrantLabel: 'storm' | 'wall' | 'spark' | 'quiet_tester'
```

`ageBandAtCheck` is new in v2 — without it, a result taken at age 5 and
re-read after a birthday would silently get relabeled with the older
band's interpretive copy, which is exactly the kind of quiet drift that
should be a deliberate choice, not an accident of a live join against
current age.

---

## 9. Open items for product / content / clinical review

- [ ] Confirm "Quiet Tester" should actively move toward becoming a real
      fourth archetype (§0.5 strengthens this case) vs. staying permanently
      `wall`-mapped
- [ ] Quiet Tester's region color (§5) — pick once the above is decided
- [ ] Full age-band interpretive copy pass (§0.2) — only 2 illustrative
      examples exist today, needs real content development, ideally
      reviewed by someone with child-development content experience, not
      just drafted from general principles
- [ ] Confirm 3–4 day re-test floor
- [ ] Copy pass on all quiz items for tone consistency with final
      onboarding voice
- [ ] Confirm disclaimer copy (§0.6) and placement with whoever owns
      legal/compliance review, not just product — this is closer to a
      liability question than a content one
- [ ] Decide whether Deep Check is offered at first onboarding alongside
      Quick Check, or introduced later
- [ ] Illustrated region texture treatment for the garden map (§5)
