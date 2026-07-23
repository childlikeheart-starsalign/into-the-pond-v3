# Fishing outcome messages

**Voice:** Field-journal, past tense, calm, max **2 sentences**. No game jargon. Variable: `{creatureName}`.

**Note on continuity:** Variant A of both miss categories reuses the existing placeholder copy from `CURRENT_ENGINE_SUMMARY.md` ("The pond is still..." / "Not this time...") rather than replacing it outright, since that copy may already be live. Variants B–E are new.

---

## 1. New catch (5 variants)

Used when `outcome: catch` and creature not previously caught.

### Variant A

Something new surfaced today. {creatureName} came up quietly, as if it had been waiting for the right moment.

### Variant B

The line pulled gently, and {creatureName} rose into the light. It was the first time I had seen one like it.

### Variant C

{creatureName} appeared at the surface today, unhurried and curious. I noted it carefully before it slipped back under.

### Variant D

There was a small splash, then {creatureName}. It felt like the pond had been keeping it as a secret.

### Variant E

Today the water gave up {creatureName}. It lingered just long enough to be remembered.

---

## 2. Duplicate catch (5 variants)

Used when `outcome: duplicate`. Include `{creatureName}`.

### Variant A

{creatureName} again — I recognized it right away. It seemed to know me too.

### Variant B

The same visitor returned today: {creatureName}. Some friendships settle into rhythm.

### Variant C

{creatureName} surfaced once more, familiar as an old page in the journal. I let it go with a nod.

### Variant D

I had met {creatureName} before, and today it found me again. There was comfort in that.

### Variant E

{creatureName} came back to the line today. Not every visit needs to be new to matter.

---

## 3. Miss — wonder gate (5 variants)

Used when pool empty (`metadata.reason: wonder_gate`). No creature name. Invite reflection, not punishment.

### Variant A

The pond is still. Reflect, and return when you are ready.

### Variant B

Nothing stirred today, and that felt alright. Some days the pond simply asks for patience.

### Variant C

The water stayed quiet, holding its secrets a little longer. I sat with that instead of pushing past it.

### Variant D

There was nothing to find here yet, only stillness. I made a note to come back after some reflection.

### Variant E

The pond didn't answer today. It felt less like absence and more like an invitation to wait.

---

## 4. Miss — chance (5 variants)

Used when roll failed but pool was eligible. Patient tone.

### Variant A

Not this time. The water remembers your patience.

### Variant B

The line came back empty today, but the water still felt full of possibility.

### Variant C

Nothing bit this time, though I sensed something moving just out of reach. Tomorrow felt worth trying again.

### Variant D

The pond stayed quiet on this cast. I didn't mind, patience has its own rhythm.

### Variant E

I felt a tug that came to nothing. Still, the waiting itself felt worthwhile.

---

## 5. First cast with this rod (10 messages — one per rod)

Reference the rod's **element** and **module theme** (see `moduleRodMap.ts`). Past tense, 1–2 sentences.

| Domain rod ID   | Module theme                             | Message                                                                                                                                                                          |
| --------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `basic`         | Starter                                  | The first cast went out plain and unadorned, just wood and line meeting water. It felt like the beginning of something patient.                                                  |
| `rare_fire`     | Regulate emotions together               | The fire rod warmed in my hand before the line even left it. Casting it felt like tending a flame we were learning to hold steady together.                                      |
| `rare_water`    | Cooperate and set limits with connection | The water rod slipped in smooth, like it already knew the give and take of the pond. Some things go better when two are working with the current, not against it.                |
| `rare_wind`     | Support intrinsic motivation             | The wind rod carried the line further than I expected, like it wanted to go on its own. I let it lead a little today.                                                            |
| `rare_electric` | Grow through failure and discomfort      | The electric rod crackled faintly at the first cast, unpredictable in a way that felt honest. Some days the pond teaches best through the mistakes.                              |
| `rare_wildcard` | Pond opens wider (journey gift)          | The pond felt wider the moment this rod touched water, like a gift I hadn't asked for. Every element seemed to answer at once.                                                   |
| `epic_fire`     | Deeper fire pool                         | This cast went deeper than the others, past the shallow fire pool into something older. It felt like returning to a flame we'd already learned to tend, now asked to go further. |
| `epic_water`    | Deeper water pool                        | The line sank further than before, into a stiller, deeper water. It felt like continuing a conversation we'd only started.                                                       |
| `epic_wind`     | Deeper wind pool                         | The wind rod pulled the line out past where I'd cast before. Something about going further felt like trusting what we'd already built.                                           |
| `epic_electric` | Deeper electric pool                     | This cast reached past the familiar current into deeper, less certain water. Growth, it turned out, kept asking for one more try.                                                |

---

## Submission checklist

- [x] 5 variants × 4 outcome types = 20 messages
- [x] 10 first-cast messages
- [x] Every new/duplicate message uses `{creatureName}` where appropriate
- [x] No message exceeds 2 sentences
