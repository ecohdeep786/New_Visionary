import fs from 'node:fs'

const WT = 'C:/Users/Administrator/nv-worktrees/fap-83-public-language-truth/visionary-app/frontend'
const PAGES = ['StudentPage', 'TeacherPage', 'ParentPage', 'CollegePage', 'OrganizationPage']

const chipsRe = /\r?\n\s*\{ code: "ta", label: "Tamil" \},\r?\n\s*\{ code: "kn", label: "Kannada" \},\r?\n\s*\{ code: "pa", label: "Punjabi" \},/
const qRe = /,\s*ta:\s*"(?:[^"\\]|\\.)*",\s*kn:\s*"(?:[^"\\]|\\.)*",\s*pa:\s*"(?:[^"\\]|\\.)*"/g

let totalChips = 0, totalQ = 0
for (const p of PAGES) {
  const path = `${WT}/src/pages/landing/${p}.jsx`
  let src = fs.readFileSync(path, 'utf8')
  const before = src

  src = src.replace(chipsRe, '')
  const chipsRemoved = (before.match(chipsRe) || []).length

  const qBefore = (src.match(qRe) || []).length
  src = src.replace(qRe, '')

  fs.writeFileSync(path, src)
  totalChips += chipsRemoved
  totalQ += qBefore
  console.log(`${p}: chips-removed=${chipsRemoved} question-rows-trimmed=${qBefore}`)
}
console.log(`TOTAL chips arrays fixed=${totalChips}, question rows trimmed=${totalQ}`)
