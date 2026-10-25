# KAN-36 local product verification

25 October 2026. Tested source/report head: `ab91f07a3fd3b14325a600b89cf34023e296d118`; implementation: `5297f4621ad69c0d0d8dfd55227000b7560411d5`.

The real Vite frontend and Firebase-connected Nest product backend were started from the existing KAN-36 worker checkout at localhost:5173 and port 3001. Existing ignored local Firebase configuration was used. No fake account, auth bypass, password entry, new feature route or shared SQL migration was introduced.

The user's signed-in in-app browser initially showed an account-unavailable message because the local API was stopped. Starting the candidate services and selecting Retry recovered the existing Professional session. Home, Learn, Ask, Practice, Build and Privacy rendered their expected headings and existing authenticated navigation. Home survived a full reload. The 390 by 844 mobile Home view showed readable content and the bottom navigation without visible horizontal clipping. The temporary viewport override was reset. Browser error logs returned no entries after recovery.

Expected headings were Welcome back, Visionary.; Your learning outline; Visionary Guide; Your next practice; Build something of your own; and Privacy & consent. Read-only navigation was used: no project, invitation, payment, privacy setting or learning record was created or changed. Screenshots and the route receipt remain outside Git at `C:/Users/Administrator/Visionary-local/kan36-rework/browser/`; account/session data is not published.

These checks establish bounded regression evidence for the existing authenticated product. Existing local learning previews remain previews. The new workspace repository/schema is disconnected preparation and was separately exercised against disposable PostgreSQL, as documented in the independent review. Full DATA-01 scope, connected workspace journeys, policy/source decisions and hosted/release acceptance remain open. KAN-36 remains Testing; this receipt does not authorize Done or completed-worktree removal.

The exact prior report head passed GitHub CI run [40172068727](https://github.com/ecohdeep786/New_Visionary/actions/runs/40172068727). Final documentation publication and dev integration require their own checked receipt; this document does not assert a future merge or CI result.
