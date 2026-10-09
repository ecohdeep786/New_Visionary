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
 const selected = books.find(item=>item.id===(requestedBook || chapter?.textbookId)) || (!requestedBook && books.length===1 ? books[0] : null);
 return {books,selected,chapters:selected ? syllabus.chapters.filter(item=>item.textbookId===selected.id && selected.chapterIds.includes(item.id)) : []};
}
