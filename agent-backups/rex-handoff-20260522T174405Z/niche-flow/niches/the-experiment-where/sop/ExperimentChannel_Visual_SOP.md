# THE EXPERIMENT CHANNEL — Visual SOP
*For scene extraction agent + ChatGPT image generation*

---

VISUAL_IDENTITY:
  Channel: The Experiment Channel
  Niche_taxonomy: Dark Psychology / Historical Experiments / Human Nature
  Overall_aesthetic: |
    Sparse, melancholic 2D hand-drawn doodle animation. Feels like a thoughtful
    sketchbook — rough lines, deliberate compositions, nothing polished or clinical.
    The world of this channel is almost empty. Characters exist in minimalist
    environments. The emptiness is the point — it reflects the isolation at the
    heart of every story. It feels intimate and handmade, like someone is drawing
    the story for you personally, late at night.

---

THUMBNAIL_TEMPLATES:

  Template_1:
    Name: "The Hollow Subject"
    Layout: Single figure centred, large negative space on both sides
    Subject: One character (infant, person, animal) with disproportionately large,
             hollow, dark-circled eyes — staring directly at camera
    Background: Flat muted colour — pale tan, grey, or faded blue. No texture, no detail.
    Text: None on image, or 3–5 words maximum in handwritten-style font
    Colour_palette: #E8E0D0 (pale tan), #2A2A2A (near black for lines), #8FA8B8 (muted blue)
    Emotional_trigger: Dread, pity, morbid curiosity
    Eye_contact: Yes — always
    Contrast_technique: Dark hollow eyes against pale empty background. Emotional contrast, not colour contrast.
    When_to_use: Any video where the subject is a vulnerable individual (infant, child, patient, animal)

  Template_2:
    Name: "The Authority vs The Subject"
    Layout: Split composition — authority figure left, small vulnerable subject right
    Subject: Powerful figure (emperor, scientist, guard) shown larger in silhouette
             or sketch form, looking toward/down at smaller figure
    Background: Minimal — a single architectural element (archway, door, cage bars)
                to suggest context without detail
    Text: None, or title text only in pale colour below composition
    Colour_palette: #D4C5B0 (warm tan), #3D3D3D (dark charcoal), #B5C4C1 (muted sage)
    Emotional_trigger: Power imbalance, horror, injustice
    Eye_contact: Authority figure does NOT make eye contact with viewer. Subject sometimes does.
    When_to_use: Videos where the perpetrator/authority is central to the concept
                 (Milgram, Stanford, Frederick II)

  Template_3:
    Name: "The Isolated Environment"
    Layout: Full bleed sparse environment — a room, a cell, an empty space
    Subject: Single small figure in the far distance or corner, surrounded by emptiness
    Background: Muted interior or exterior — grey walls, pale floor, minimal lines
    Text: 5 words max, positioned top or bottom, never centre
    Colour_palette: #DDDBD5 (off-white), #1C1C1C (near black), #A0956E (muted warm)
    Emotional_trigger: Loneliness, desolation, scale of suffering
    Eye_contact: No
    When_to_use: Videos about sensory deprivation, isolation, or confinement

---

SCENE_VISUAL_STYLE:
  Footage_type: Custom 2D animation — hand-drawn doodle / sketch style
  Colour_grade: Muted sepia + pastel. Pale blues, tans, warm greys. No saturation. No brightness.
  Primary_shot_types (ordered by frequency):
    1. Character close-up — expressive hollow eyes, minimal facial detail
    2. Empty room / sparse environment — the subject is small against the space
    3. Symbolic metaphor — language as scaffolding, the self as a house being built
    4. Simple hand-drawn graph or timeline with handwritten labels
    5. Two-figure composition — power imbalance clearly shown through scale
  Lighting_style: Flat — no dramatic shadows, no highlights, no golden hour.
                  The flatness is intentional and matches the sketchbook aesthetic.
  Text_overlays:
    Style: Handwritten-style font (rough, not clean sans-serif)
    Usage: Sparingly — key terms, dates, names only
    Max_words_per_overlay: 3
    Examples: "1211", "HOSPITALISM", "CRITICAL PERIOD", "GENIE"
    Colour: Near-black (#1C1C1C) or very dark navy on pale background
  Cut_pacing: Slow and deliberate. Cuts match the narrative beat of the voiceover,
              not a music grid. Fades used for emotional transitions.
              Never jump cuts. Never fast edits.
  Music_mood: Understated, sparse, melancholic instrumental.
              Piano or minimal ambient. Never swells. Never dramatic builds.
              Music supports silence, it does not fill it.
  Unique_visual_signature: The hollow, dark-circled eyes on every character.
                           Whether infant, emperor, or scientist — the eyes are
                           the same. Everyone is a subject. Everyone is observed.

---

CHATGPT_IMAGE_PROMPT_DEFAULTS:
  Tool: ChatGPT image generation (GPT-4o / DALL-E 3)
  Aspect_ratio: 16:9 (1280x720) for thumbnails, 9:16 for Shorts scenes
  Quality: high
  Style: vivid (use "natural" only for scenes requiring extra restraint)

  Base_style: |
    "2D hand-drawn doodle illustration, minimalist character design,
    expressive hollow dark-circled eyes, muted sepia and pale blue-grey colour palette,
    sparse empty composition, melancholic sketchbook aesthetic, rough pencil line art,
    flat lighting with no shadows or highlights, wide negative space, single isolated subject,
    no text in image, no watermarks"

  Colour_instruction: |
    "Muted restricted palette only — pale tan (#E8E0D0), warm grey (#C8C4B8),
    muted blue-grey (#8FA8B8), near-black lines (#2A2A2A). No bright or saturated colours.
    Saturation below 30% throughout. Background always lighter than subject."

  Subject_instruction: |
    "Character in minimal doodle style — simplified face with only 2-4 lines,
    disproportionately large hollow eyes with heavy dark circles, small or absent mouth.
    All emotion conveyed through eyes and body posture only. No detailed anatomy.
    No realistic proportions."

  Environment_instruction: |
    "Near-empty space. Maximum one or two environmental elements, drawn with minimal lines.
    Subject should appear small relative to the frame. Emptiness carries the emotional weight."

  Consistency_note: |
    When generating multiple images for the same video, paste the first successful image
    back into the chat and instruct ChatGPT: 'Generate the next scene in the exact same
    illustration style, line weight, colour palette, and character design as this image.'
    This is the primary method for maintaining visual consistency across a video.

  Avoid: |
    "Realistic or photographic rendering, 3D style, detailed anatomy, bright colours,
    colour saturation, dramatic lighting, shadows, crowded compositions, cheerful cartoon
    aesthetics, speech bubbles, logos, text, modern graphic design aesthetics, anime style"

---

THUMBNAIL_CREATION_GUIDE:

  Step_1: Generate base subject image
    → Use Template_1 (Hollow Subject) as default
    → ChatGPT prompt: [Base_style] + [Colour_instruction] + [Subject_instruction]
    → Subject should be centred, eyes forward, background flat pale colour

  Step_2: Select text treatment (if any)
    → 5 words maximum
    → Handwritten-style font, near-black, positioned at top or bottom third
    → Never overlap with subject's eyes

  Step_3: Verify emotional trigger
    → Does the thumbnail make you feel something uncomfortable?
    → Is the composition sparse enough? Remove any unnecessary elements.
    → Do the eyes have the hollow quality?

  Font_style: Rough handwritten or imperfect serif — not clean sans-serif
  Text_colour: #1C1C1C (near black) or #FAFAF5 (near white) depending on background
  Text_position: Top third or bottom third. Never centre.
