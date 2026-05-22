# Finance SOP V1 Defect Log

Date: 2026-05-20
Reviewer: Masala
Scope: First Laura & John's Money Gap Finance protocol run

## Critical defects reported

1. **Character visual consistency failed**
   - Laura/John changed race, age, and style throughout.
   - Character identity was not locked strongly enough.

2. **Overall visual style consistency failed**
   - Images switched generations/styles.
   - Desired style is one overarching cartoonish style, not drawn realism.

3. **Image generation / beat coverage failed catastrophically**
   - Images did not reliably follow the script.
   - Images did not change on beat throughout.
   - Same images looped/repeated.
   - All images must be generated with the top-tier linked GPT/ChatGPT frontier image model.

4. **Editing failed**
   - No meaningful editing pass.
   - No transitions.
   - No faint zooming/motion effect.

5. **Subtitle style failed**
   - Subtitles far too big.
   - Black highlighted background is wrong.
   - Required style: white text with thin black outline, one line only, on beat.

## V2 goal

Turn these defects into hard workflow gates, not subjective preferences. Future runs must fail QA and repair automatically if any of these conditions appear.
