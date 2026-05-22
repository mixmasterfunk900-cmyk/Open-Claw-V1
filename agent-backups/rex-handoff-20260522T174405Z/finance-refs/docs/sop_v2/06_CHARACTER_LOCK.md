# 06 — Character Lock

This gate fixes V1's character drift failure.

## Must do

- Create or load fixed Laura and John reference locks before scene generation.
- Store exact character descriptions and reference images/sheets.
- Every image prompt must include the full relevant locked character description, not shorthand.
- Every generated character scene must be audited against the lock.

## Laura lock

- Mid-20s woman.
- Dark brown shoulder-length slightly wavy hair.
- Round face, large dark brown expressive eyes.
- Natural light brown skin tone.
- Casual-smart hoodie/crewneck, jeans, sneakers.
- Muted colours only.
- Cartoon explainer proportions; not realistic portrait.

## John lock

- Early-60s man.
- Salt-and-pepper short neat hair, slightly receding hairline.
- Square jaw, clean-shaved.
- Warm medium skin tone.
- Light blue/beige/white polo, khakis/chinos, sensible shoes.
- Slightly stocky/broad-shouldered.
- Cartoon explainer proportions; not realistic portrait.

## Required files

- `config/character_lock/laura.md`
- `config/character_lock/john.md`
- `config/character_lock/laura_reference.png` if generated
- `config/character_lock/john_reference.png` if generated
- `${VIDEO_DIR}/qa/character_consistency_report.md`

## Hard fail conditions

- Race/skin tone changes.
- Age changes.
- Hair or face identity changes substantially.
- John/Laura swap roles or visual identities.
- A prompt uses shorthand instead of full locked description.

## Pass criteria

`CHARACTER_LOCK_QA_PASS` must be true before rendering.
