const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase().trim();

/** Multi-word, title-first matching. URLs, private bodies and identifiers are not search text. */
export function matchWorkspaceSearch(items, query, limit = 24) {
  const text = normalize(query), words = text.split(/\s+/).filter(Boolean);
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.to)) return false;
    seen.add(item.to);
    return words.every(word => normalize(item.label + ' ' + (item.detail || '')).includes(word));
  }).map((item, index) => ({item,index,rank: text && normalize(item.label) === text ? 0 : text && normalize(item.label).startsWith(text) ? 1 : 2}))
    .sort((a,b) => a.rank - b.rank || a.index - b.index).slice(0,limit).map(row => row.item);
}
