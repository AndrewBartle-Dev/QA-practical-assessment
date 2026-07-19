# AI Usage

I used two AI assistants for this assessment, split by phase — not because either couldn't do the whole thing, but as a personal preference for this exercise.

**Story analysis & writeups — ChatGPT.** I read the RWA-142 story and formed my own view of what was ambiguous before bringing ChatGPT in. From there I collaborated with it to draft and refine `01-story-feedback.md`, the `## QA Annotations` section, `02-manual-test-script.md`, and `03-technical-criteria.md`. I directed the content — which ACs were weak, what data dependencies mattered, what to verify at the API vs. UI layer — and used it to help structure and word the writeups.

**Automated Playwright suite & bug report — Claude.** Claude scaffolded the Playwright project, built the page objects against the app's real `data-test` selectors, and wrote the test specs, iteratively rather than in one pass. A few concrete examples of verifying and correcting its output rather than accepting it as-is:

- I had it build a session-caching approach for login, based on a pattern from another project of mine. When I asked it to verify that against this app's actual auth code, it found the pattern didn't apply here and we reverted to driving the real UI login in every test rather than keep something that only looked like it worked.
- A couple of the screenshots for the intentionally-failing defect tests looked like they showed the button in the *correct* (non-buggy) state, which didn't match what I found testing manually. I flagged the mismatch; Claude traced it to a rendering-lag timing issue and fixed the capture so the screenshot reflects the real, final state instead of a stale frame.
- The confirmed defect (amount validation accepting zero/negative values; note required despite the AC calling it optional) was root-caused by reading the actual frontend/backend validation code. I confirmed both manually in the running app before they went into `bug-report.md`.

**Verification, generally:** every AC-to-test mapping and every claimed defect was checked by hand against the running app before I accepted it — nothing was written as a "failure" without a manual repro first. Selectors were checked against component source, not guessed. Scope calls (which edge cases to automate, what was too ambiguous to test — e.g., AC6's undefined privacy rules — and what "done" looked like for the timebox) were mine throughout.
