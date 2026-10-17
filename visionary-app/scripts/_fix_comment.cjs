const fs = require('fs');
const filePath = 'frontend/src/pages/Landing.jsx';
let c = fs.readFileSync(filePath, 'utf8');

const oldComment = `/* ═══════════════════════ PAGE ═══════════════════════
   The Vision Pro anatomy: the family stage pins to the viewport, the story
   glides over it on frosted glass (problem), the thesis fades up
   (promise), the product meets its five audiences (meet), the language
   chapter, the journey on the one dark scene, trust, and the blue closer.
   Sections stay direct children of main — the bridge's chapter contract
   (hairlines, transparent joins, the dark scene) keys on that shape — each
   carrying z-10 above the pinned hero. Routing lives in the nav and the
   hero's audience row; depth lives on the pages those links open. */`;

const newComment = `/* ═══════════════════════ PAGE ═══════════════════════
   The Vision Pro anatomy: the family stage pins to the viewport, the
   story glides over it on frosted glass (problem), the thesis fades up
   (promise), the category grid (line-up), the journey, the language
   chapter, trust, and the blue closer. */`;

if (c.includes(oldComment)) {
  c = c.replace(oldComment, newComment);
  console.log('Updated page composition comment');
} else {
  console.log('Page comment not found - checking partial');
  // Try to find the key phrases
  if (c.includes('the product meets its five audiences (meet)')) {
    console.log('Found reference to meet in comment');
  }
}

fs.writeFileSync(filePath, c);
console.log('Done');
