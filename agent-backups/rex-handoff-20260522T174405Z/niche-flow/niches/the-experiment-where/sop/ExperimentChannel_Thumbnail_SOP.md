# THE EXPERIMENT CHANNEL — Thumbnail SOP

---

THUMBNAIL_FORMULA:
  Series_title_format: "The/An Experiment Where [subject] [past-tense verb]"
  Most_effective_template: "The Hollow Subject" (Template 1)
  Emotion_target: Morbid curiosity + dread + "I need to know what happened"
  Core_visual_rule: One subject. Hollow eyes. Empty space. Nothing else competes.
  Text_rule: 5 words maximum, or no text at all. The image must work without text.
  Colour_rules:
    - Background: Pale tan (#E8E0D0), muted grey (#C8C4B8), or faded blue (#B8C8D4)
    - Lines: Near-black (#2A2A2A)
    - No bright colours. No saturation. No red accents. No yellow highlights.
  Contrast_technique: Emotional contrast — dark hollow eyes against pale empty background.
                      Not colour contrast. Not brightness contrast.

---

TITLE_FORMULA (thumbnail text if used):
  Format: "The Experiment Where [verb phrase]" — but shortened to 5 words max
  Examples:
    - "Where Babies Learned Nothing" (5 words)
    - "Where No One Spoke" (4 words)
    - "Where Silence Killed" (3 words — most powerful)
  Rule: Never use the full video title on the thumbnail.
        Extract the most disturbing 3–5 word fragment.

---

CHATGPT_THUMBNAIL_PROMPTS:
  Tool: ChatGPT image generation (GPT-4o / DALL-E 3)
  How_to_use: Paste the full prompt below directly into ChatGPT. If the output drifts
              from style on subsequent generations, paste the first good image back
              into the chat and say: "Generate a new image in the exact same illustration
              style, line weight, and colour palette as this image, but with [new subject]."

  ## TEMPLATE 1 — The Hollow Subject (default)
  Use for: Any video where the experimental subject is a person or child

  ```
  Create a 2D hand-drawn doodle illustration of a single [SUBJECT DESCRIPTION] centred
  in the frame. The character has disproportionately large hollow eyes with heavy dark
  circles, staring directly at the viewer. Minimal facial detail — only a few lines for
  the face. Small simple body. The background is a flat, textureless pale [BACKGROUND COLOUR]
  with wide empty negative space on all sides. The overall aesthetic is melancholic and
  sketchbook-like, with rough pencil line art and a muted sepia colour palette. Near-black
  lines (#2A2A2A). No text, no props, no environment detail. The figure is completely
  isolated in the frame. Aspect ratio 16:9. The mood is [EMOTION].
  ```

  Placeholders to fill per video:
  - [SUBJECT DESCRIPTION]: e.g. "swaddled infant", "young child", "adult male figure", "elderly patient"
  - [BACKGROUND COLOUR]: e.g. "pale tan", "muted warm grey", "faded blue-grey"
  - [EMOTION]: e.g. "dread and pity", "morbid curiosity", "profound sadness"

  ---

  ## TEMPLATE 2 — The Authority vs The Subject
  Use for: Videos where the authority figure (scientist, ruler, guard) is central

  ```
  Create a 2D hand-drawn doodle illustration with a split composition. On the left,
  a large silhouetted [AUTHORITY FIGURE] — featureless or in shadow, no detail —
  looking toward the right side of the frame. On the right, a small vulnerable
  [SUBJECT] with hollow dark-circled expressive eyes. The authority figure is
  approximately 3 times taller than the subject. The setting is suggested minimally
  by a single [SETTING ELEMENT] drawn with 2-3 lines only. Flat muted palette
  (#D4C5B0 background, #3D3D3D lines). Melancholic sketchbook aesthetic, rough
  pencil lines, wide negative space above both figures. No text. Aspect ratio 16:9.
  Mood: power imbalance and dread.
  ```

  Placeholders:
  - [AUTHORITY FIGURE]: e.g. "emperor in robes", "scientist in coat", "uniformed guard"
  - [SUBJECT]: e.g. "infant", "chimpanzee", "prisoner", "patient"
  - [SETTING ELEMENT]: e.g. "stone archway", "laboratory table", "cage bars"

  ---

  ## TEMPLATE 3 — The Isolated Environment
  Use for: Videos about isolation, confinement, deprivation

  ```
  Create a 2D hand-drawn doodle illustration showing a wide view of a near-empty
  [ENVIRONMENT]. A single small [SUBJECT FIGURE] is positioned in the far distance
  or the bottom corner of the frame, surrounded by vast empty space. The walls and
  floor are muted off-white (#DDDBD5). Near-black rough pencil lines (#1C1C1C).
  The figure has hollow dark-circled eyes visible even at small scale. Flat lighting
  with no shadows. No other objects or people in the frame. Desolate and sparse.
  Melancholic sketchbook aesthetic. No text. Aspect ratio 16:9.
  Mood: profound loneliness and scale of suffering.
  ```

  Placeholders:
  - [ENVIRONMENT]: e.g. "stone room", "sterile hospital ward", "sparse cage interior"
  - [SUBJECT FIGURE]: e.g. "infant", "adult crouching", "chimpanzee", "child"

---

VIDEO-SPECIFIC CHATGPT IMAGE PROMPTS:

  ## "The Experiment Where Babies Were Raised With No Language"
  Template: 1 — The Hollow Subject
  ```
  Create a 2D hand-drawn doodle illustration of a single swaddled infant centred in
  the frame. The infant has disproportionately large hollow eyes with heavy dark circles,
  staring directly at the viewer. Minimal facial detail. Simple wrapped bundle body.
  Flat pale tan (#E8E0D0) background with no texture or detail. Wide empty negative
  space on all sides. Melancholic sketchbook aesthetic, rough pencil line art, muted
  sepia palette, near-black lines. No text, no props. Completely isolated figure.
  Aspect ratio 16:9. Mood: dread and profound sadness.
  ```

  ## "The Experiment Where Children Were Taught to Fear" (Little Albert)
  Template: 2 — Authority vs Subject
  ```
  Create a 2D hand-drawn doodle illustration with a split composition. On the left,
  a large silhouetted scientist figure in a simple coat, holding an object, featureless.
  On the right, a small toddler with hollow dark-circled eyes wide in fear. Figure
  scale approximately 3:1. Flat muted grey background (#C8C4B8). A single line
  suggests the edge of a laboratory table. Melancholic sketchbook aesthetic, rough
  pencil lines. No text. Aspect ratio 16:9. Mood: power imbalance and childhood dread.
  ```

  ## "The Experiment Where Soldiers Were Ordered to Electrocute Strangers" (Milgram)
  Template: 2 — Authority vs Subject
  ```
  Create a 2D hand-drawn doodle illustration with a split composition. On the left,
  a featureless authority figure in silhouette pointing toward the right. On the right,
  an ordinary person with hollow dark-circled eyes seated at a simple desk, one hand
  raised over an implied button or lever. Flat muted blue-grey background (#B8C8D4).
  Sparse composition. Melancholic sketchbook aesthetic, rough pencil lines. No text.
  Aspect ratio 16:9. Mood: moral horror and complicity.
  ```

  ## "The Experiment Where A Man Was Kept Awake For 11 Days"
  Template: 1 — The Hollow Subject
  ```
  Create a 2D hand-drawn doodle illustration of a single adult male figure centred
  in the frame, standing or slightly hunched. Disproportionately large hollow dark-circled
  eyes with heavy bags beneath. Minimal body detail. Flat muted warm grey background
  (#C8C4B8). Wide empty negative space. Melancholic sketchbook aesthetic, rough pencil
  lines. No text, no environment. Aspect ratio 16:9. Mood: exhaustion and dread.
  ```

  ## "The Experiment Where Prisoners Became Guards" (Stanford Prison)
  Template: 3 — Isolated Environment
  ```
  Create a 2D hand-drawn doodle illustration showing a wide view of a sparse corridor
  or cell interior, suggested with minimal lines. One small prisoner figure crouching
  in the far bottom corner with hollow dark-circled eyes just visible. One larger guard
  silhouette standing in the far distance on the left. Vast empty muted space between
  them. Off-white (#DDDBD5) background, near-black rough pencil lines. No text.
  Desolate and sparse. Aspect ratio 16:9. Mood: powerlessness and institutional dread.
  ```

---

QUALITY CHECKLIST (run before finalising any thumbnail):
  ✓ Does the composition work with ONLY the image (no text)?
  ✓ Do the eyes have the hollow, dark-circled quality?
  ✓ Is the background pale and flat — no gradients, no texture?
  ✓ Is the composition sparse — nothing unnecessary in frame?
  ✓ Would this make someone uncomfortable enough to click?
  ✓ Is there a clear single focal point?
  ✓ No bright colours anywhere in the frame?
