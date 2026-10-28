export * from './scene-types';
export * from './scene-lookups';
export * from './scene-service';
// AI-16 (KAN-150) — the versioned approved representation/scene registry and
// structured action protocol.
//
// The checkpoint here is an APPROVED, VERSIONED scene registry with a
// STRUCTURED, BOUNDED, READ-ONLY action protocol — never raw execution:
//   - scenes register per version (conflicting redefinition refused) and
//     execute only after explicit server approval;
//   - every scene binds one concept + permitted source revision; every action
//     runs inside a durable run whose recorded revision must match — a moved
//     revision rejects the run as stale; a cancelled run rejects everything;
//   - allowlisted read-only operations with bounded parameters; NO generated
//     JavaScript, NO URLs, NO raw SCENE-token execution (refused at
//     registration and at the action boundary);
//   - synchronized approved narration/events replay deterministically from
//     any sequence position;
//   - keyboard + text fallbacks are the registration floor; 2D and
//     reduced-motion are declared per scene;
//   - 3D/voice are advertised ONLY for server-released scene/language
//     coverage — an unreleased capability is never advertised.
//
// Exit: synchronized approved representations with bounded read-only actions
// and honest released coverage.
