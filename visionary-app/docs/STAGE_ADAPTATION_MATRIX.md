# Stage Adaptation Matrix — one account, many products-of-one
Purpose: after onboarding each category enters ITS OWN product; inside Student (and analogous
contexts) the experience adapts by sub-stage. A primary child must never receive a
higher-education treatment; a competitive-exam learner sits between higher-secondary and
higher-education in abstraction and intensity.

## stageProfile (delivered by fixtures/services — never hard-coded per page)
{ stage, ageBand, abstraction(1-5), intensity(1-5), vocabularyLevel, sessionMinutes,
  checkFrequency, representationOrder, homeModules(ordered, ≤5), density, motionTone,
  illustrationTone, safetyTier, progressLanguage, transitionRule }

## Ladder
Primary 1/1 · Secondary 2/2 · Higher Secondary 3/3 · Competitive 3/4 ·
Vocational 3/3(applied) · Higher Education 4/5 · Independent adult = user-set (default 3/3)

## Primary (6–11)
Vocabulary: short concrete sentences, encouragement, read-aloud default. Home: 3 modules
(Continue big card · Today ≤2 · effort celebration from evidence, never streak-shame);
subjects as large illustrated tiles. Sessions 5–8 min, Explore-first, checks as playful
retrieval (no hearts/lives gimmicks); audio+picture+story defaults; 3D only manipulables.
Practice: 3–5 voice-enabled micro-reviews; errors → "let's see it another way."
Progress language: "You can now explain…" / "Not yet — see it again?" Never percent-led.
Safety tier child: guardian consent gate, ads never, sharing off, no marketplace, no public artifacts.
Transition: promotion only via org/parent/guardian confirmation.

## Secondary (11–16)
Everyday language + glossary chips. Home 4 modules. Sessions 8–12 min Explain→Explore→Try→Check;
diagram/simulation defaults; bilingual toggle visible. Spaced review queue + common-error cards.
Mastery stages lead; accuracy secondary with explanation. Safety tier minor: guardian summaries on,
private doubts hidden, no ads, no selling.

## Higher Secondary (16–18)
Subject-standard concise terms. Home 5 modules incl. Build opportunity. Sessions 12–18 min,
worked examples + simulation, prerequisite refresh prominent. Board-pattern practice with exam flags.
"Exam readiness" only with scope/date/uncertainty. Older-minor tier: sharing opt-in,
self-confirm transitions with guardian notice.

## Competitive Exams (goal-driven)
Intensity 4: check-heavy, optional timing, error-analysis first. Home: Continue · Mocks/review due ·
Weak-signal gaps · Coverage · Build(secondary). Sessions 10–15 min past-paper checks + solution anatomy.
Mocks with section analytics and honest denominators; no percentile claims without real cohort data.
Minor rules apply if under 18.

## Vocational & Skills
Applied-first: Build/Practice lead, Learn just-in-time. Home: Continue project · Skill gap ·
Practice due · Employer section if connected. Representations: tool workflows, diagrams, checklists,
code runner. Progress = demonstrated skill evidence + portfolio.

## Higher Education
Abstraction 5: paper/dataset/model representations; 20–30 min sessions with save-points;
citation-aware source placeholders. Home: Research continue · Course objectives · Recall ·
Artifact · Advisor/org. Progress = mastery + artifact rubrics.

## Independent Adult / Professional
User-set pace; adult contextual sponsorship eligible; career-evidence language.

## Analogous adaptation in other roles
Teacher: independent tutor (simple roster + minor-safety prompts) vs org teacher (classes, insights,
policy badges) vs both (context-preserving switch). Parent: early-years (plain digest, no metrics)
vs teen (summary-only, autonomy respect). Professional: job-seeker (interview/portfolio lead) vs
employed (employer-assigned marked) vs sponsored (boundary warnings). Org: school vs coaching vs
company vs NGO/govt — same screens, different vocabulary + policy defaults.

## Engineering rules
1. stageProfile flows from RoleProfile fixture via service; zero per-page hard-coding.
2. Variants are token-driven (density/type/illustration tone), not forked components.
3. QA includes one primary-child and one competitive-exam walkthrough every student wave.
4. Gate extension: wrong-stage treatment (vocabulary/density/safety) = PRODUCT_GATE fail (G2/G3).