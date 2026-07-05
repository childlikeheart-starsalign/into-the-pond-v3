# Fishing outcome messages

**Voice:** Field-journal, past tense, calm, max **2 sentences**. No game jargon. Variable: `{creatureName}`.

---

## 1. New catch (5 variants)

Used when `outcome: catch` and creature not previously caught.

### Variant A

_(write here)_

### Variant B

### Variant C

### Variant D

### Variant E

---

## 2. Duplicate catch (5 variants)

Used when `outcome: duplicate`. Include `{creatureName}`.

### Variant A

### Variant B

### Variant C

### Variant D

### Variant E

---

## 3. Miss — wonder gate (5 variants)

Used when pool empty (`metadata.reason: wonder_gate`). No creature name. Invite reflection, not punishment.

### Variant A

### Variant B

### Variant C

### Variant D

### Variant E

---

## 4. Miss — chance (5 variants)

Used when roll failed but pool was eligible. Patient tone.

### Variant A

### Variant B

### Variant C

### Variant D

### Variant E

---

## 5. First cast with this rod (10 messages — one per rod)

Reference the rod’s **element** and **module theme** (see `moduleRodMap.ts`). Past tense, 1–2 sentences.

| Domain rod ID   | Module theme                             | Message |
| --------------- | ---------------------------------------- | ------- |
| `basic`         | Starter                                  |         |
| `rare_fire`     | Regulate emotions together               |         |
| `rare_water`    | Cooperate and set limits with connection |         |
| `rare_wind`     | Support intrinsic motivation             |         |
| `rare_electric` | Grow through failure and discomfort      |         |
| `rare_wildcard` | Pond opens wider (journey gift)          |         |
| `epic_fire`     | Deeper fire pool                         |         |
| `epic_water`    | Deeper water pool                        |         |
| `epic_wind`     | Deeper wind pool                         |         |
| `epic_electric` | Deeper electric pool                     |         |

---

## Submission checklist

- [ ] 5 variants × 4 outcome types = 20 messages
- [ ] 10 first-cast messages
- [ ] Every new/duplicate message uses `{creatureName}` where appropriate
- [ ] No message exceeds 2 sentences
