/** Current stage facts are authoritative; old activities retain their own source. */
export function learningProfileSelection(profile, legacy = {}) {
 const current = profile || {board:legacy.board,classLevel:legacy.grade_level,subjects:legacy.subjects};
 return {board:current.board || current.exam || current.institution || '',classLevel:current.classLevel || '',subject:Array.isArray(current.subjects) ? current.subjects[0] || '' : ''};
}

export function catalogueSelection(saved, profile) {
 if (!saved) return profile;
 // Explicit alternate outlines carry their context in the URL. Fresh browsing follows the profile.
 if (saved.board !== profile.board || saved.classLevel !== profile.classLevel) return profile;
 return saved;
}

export function booksForOutline(syllabus, requestedBook, chapterId) {
 const books = syllabus?.textbooks || [];
 const chapter = syllabus?.chapters.find(item=>item.id===chapterId);
 // A fresh visit never opens even a single book. Chapter links retain their explicit parent.
 const selected = books.find(item=>item.id===(requestedBook || chapter?.textbookId)) || null;
 return {books,selected,chapters:selected ? syllabus.chapters.filter(item=>item.textbookId===selected.id && selected.chapterIds.includes(item.id)) : []};
}

/** Completion belongs to this exact curriculum version, never to a similarly named book. */
export function bookCompletion(syllabus, book, graphs, units) {
 const source = syllabus.provenance;
 const graph = graphs.find(item => item.syllabus.id === syllabus.id && (!source || ['provider','sourceId','version'].every(key => item.syllabus.provenance?.[key] === source[key])));
 const chapters = syllabus.chapters.filter(item => item.textbookId === book.id && book.chapterIds.includes(item.id));
 const completed = chapters.filter(chapter => {
  const concepts = graph?.topics.filter(topic => chapter.topicIds.includes(topic.id)).flatMap(topic => topic.conceptIds) || [];
  return concepts.length > 0 && concepts.every(id => units.some(unit => unit.conceptId === id && unit.stage === 'completed' && !unit.classId && (!source || ['provider','sourceId','version'].every(key => unit.sourceContext?.provenance[key] === source[key]))));
 }).length;
 return {completed,total:chapters.length};
}

export function filterCatalogueBooks(groups, query, status = 'all', sort = 'catalog') {
 const words = query.trim().normalize('NFKC').toLocaleLowerCase().split(/\s+/).filter(Boolean);
 return groups.map(group => ({...group, books:group.books.filter(book => {
  const haystack = `${book.title} ${group.subject} ${group.board} ${group.classLevel}`.normalize('NFKC').toLocaleLowerCase();
  const done = book.progress.total > 0 && book.progress.completed === book.progress.total;
  return words.every(word => haystack.includes(word)) && (status === 'all' || status === 'completed' && done || status === 'started' && book.started && !done);
 }).sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title) : 0)})).filter(group => group.books.length);
}
