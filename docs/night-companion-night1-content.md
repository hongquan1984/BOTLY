# Night Companion Night 1 content

This is a free beta wellness experience. It does not diagnose, treat, promise sleep, or replace clinical care. The rule engine remains deterministic: the existing Night Pattern is combined with the selected Tonight State and operational context, then capped at three modules.

## Evidence boundary

### Checked content

- NHS guidance supports regular routines, a calm wind-down, writing worries or a next-day list, calming music/background sound, and not forcing sleep. If awake and unable to sleep, NHS suggests getting up for a relaxing activity and returning when sleepy.
- NHS breathing guidance uses comfortable breathing, optional counting, and returning to natural breathing if counting is not useful.
- NHLBI describes healthy sleep habits and describes stimulus control/CBT-I as clinical treatment territory; this beta does not implement sleep restriction or CBT-I.
- NCCIH describes relaxation as generally safe for healthy people but notes limited/low-quality evidence for relaxation alone and occasional negative experiences. The scripts therefore use modest language and clear stop options.

### Marketing or UX references, not efficacy evidence

- Afterhush demonstrates one calm choice at a time, a small plan, honest boundaries, and a source record for sound layers.
- Sleep.coach packages a personalized seven-day plan, but its marketing language is not evidence for any Night Companion claim.
- Sleep Reset OS packages “Tonight Mode,” selective modules, explicit exclusions, and a non-guarantee boundary. Those are product/UX observations only.

### Decisions to test

- Keep the plan to three modules maximum, but let the person complete, skip, or stop after any module.
- Use the Tonight State to choose the first action; keep Pattern and Tonight State visibly separate.
- Use real background audio only for the calming-audio module. Guided text is the fallback until a permitted voice is produced.
- Keep short writing inputs local to the current screen. They are not persisted and never enter analytics.

## Content matrix

| Tonight State | First module/rule | Optional follow-up | Audio choice | Still Awake branch |
| --- | --- | --- | --- | --- |
| `MIND_WONT_STOP` | `mental_unload`; label one open loop | `tomorrow_list`, then optional audio | Optional ocean sound; no voice required | Park one loop, then choose quiet activity or stop |
| `SLEEP_ANXIETY` | `reduce_sleep_pressure` | `guided_downshift`, then optional audio | Text-guided breathing; ocean sound optional | Do not force sleep; quiet activity if frustrated |
| `NOT_SLEEPY` | `quiet_activity` | Pattern/context may add transition or routine cue | Usually no audio; optional quiet sound only if useful | Leave bed for low-stimulation activity and return when sleepy |
| `WOKE_UP` | `back_to_sleep` | `quiet_activity`, then optional audio | Text reset first; sound optional | Avoid time-checking and forcing; quiet activity branch |
| `STRESS_CARRYOVER` | `decompression` / Body Unwind | `mental_unload`, then optional audio | Text-guided body attention; sound optional | Stop body attention if uncomfortable; choose neutral quiet activity |

Bedtime Procrastination and Sleep Rhythm remain Pattern-level mappings. Existing `screen_transition`, `routine_cue`, and `guided_downshift` modules are reused; no new scoring or Pattern IDs are added.

## Script inventory

Runtime scripts live in `src/lib/night-companion-content.ts`.

- `gentle_breathing_v1`: comfortable breathing, optional count, no breath-hold, return to natural breathing, stop if uncomfortable.
- `reduce_sleep_pressure_v1`: reframe the demand to sleep without claiming an effect.
- `body_unwind_v1`: small body-attention cues without forced stretching or trauma recall.
- `back_to_rest_v1`: small attention anchor and a clear quiet-activity branch.
- Mental Unload and Tomorrow List are short, optional text interactions rather than voice scripts.

Voice audio was not generated in this environment. The guided modules ship with complete on-screen transcripts and pause directions in the content source; a voice recording/TTS pass still needs a provider/model rights record and expert review.

## Sources

- NHS: https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/
- NHS: https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/
- NHLBI: https://www.nhlbi.nih.gov/health/insomnia/treatment
- NCCIH: https://www.nccih.nih.gov/health/providers/digest/psychological-and-physical-approaches-for-sleep-disorders-science
- NCCIH: https://www.nccih.nih.gov/health/relaxation-techniques-what-you-need-to-know
- UX reference: https://afterhush.com/
- Sound provenance UX reference: https://afterhush.com/sounds
- UX reference: https://sleep.coach/
- UX/reference boundaries: https://tipsforinsomnia.com/sleep-reset/
