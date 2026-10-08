# Engagement slice evidence · 2026-10-08

Fictional School administrator account, local workspaces. No real learner data or connected teaching service. Screenshots show the surrounding product shell; inner scrolling means a single image may not show an entire page.

## Compiled preview

- `ask-compiled-desktop.png`: learner Ask, 1440px, visual examples, compact mentor and recent conversation. Replaced after final history-row styling.
- `ask-compiled-default.png`: final rebuilt learner Ask at the browser's normal 862px width, viewport override reset.
- `ask-compiled-phone.png`: learner Ask, requested 320px (reported 321), horizontal visual rows. Lower choices continue below the visible viewport.
- `home-compiled-desktop.png`: learner's single current cube task, exact continuation and precise plan deferral.
- `cube-compiled-desktop.png`: authored curriculum cube, 1440px, grouped observe/change controls; prediction below the initial fold.
- `cube-compiled-phone.png`: 321px chapter/source header and wrapped stage navigation; representation continues below the viewport.
- `cube-prediction-compiled.png`: scrolled 1440px curriculum cube with optional unscored prediction explanation. Current model remains side 3; revealed hypothetical side 4 is 64 cubic units.

Cube/Home captures precede the final CSS-only recent-conversation row refinement; their relevant layouts are unchanged. Final preview uses the rebuilt output.

## Development captures

- `ask-before.png`: previous compiled entry, normal 862px browser; predates this slice and the test demo conversation.
- `ask-development.png`, `home-development.png`: normal 862px first implementation.
- `ask-phone-development.png`, `teacher-ask-phone.png`, `professional-ask-phone.png`: 390px role entry choices. Parent entry was measured, without a separate image.
- `organization-home-phone.png`: organization Home after removing the forbidden Ask entry. Organization Ask is blocked by existing permission policy; no Ask acceptance is claimed.
- `cube-prediction-development.png`, `cube-phone-development.png`, `cube-text-development.png`: early/scrolled interaction evidence. The first prediction image predates final disclosure styling; text image shows saved side 4 alongside the unchanged authored example about side 3. The original side 3/rotation 25/model view was restored afterward.

## Measurement and limitations

`layout-observations.json` retains focused measured samples and explicit organization Ask-link absence. All retained samples have no document horizontal overflow. It is a focused slice, not a complete route/subcategory matrix. A transient observation captured during server startup was removed from the accepted measurements. A reload racing the development-to-preview handoff briefly loaded old development assets and reached the error boundary. Reloading after preview startup restored compiled rendering; final errors are recorded separately.

Unsent fictional draft navigation/restore was verified then the draft cleared. One authored demo launch was verified and retained in history; New conversation returned to entry. Temporary prediction choices were not written as scores. Native-language review, physical devices, screen readers, zoom and real-user interest/retention remain open.
