import fs from 'node:fs';
const p='src/pages/dashboard/ProfessionalCareer.jsx';let s=fs.readFileSync(p,'utf8');
s=s.replace('      <form onSubmit={save}',`      {recovered && <p className="v-notice mt-4" role="status">Unsaved career edits recovered on this device. Save direction to keep them.</p>}
      {backupError && <p className="v-notice v-error mt-4" role="alert">{backupError} Your current fields remain available to export.</p>}
      {conflict && <section className="v-notice mt-4" aria-label="Career target conflict"><h3 className="font-medium">A newer direction is saved</h3><p className="v-muted mt-2">Your current edits are retained. Review the saved version before discarding them.</p><details className="mt-3"><summary>Latest saved direction</summary><p className="mt-2">{path?.goal?.title || 'No active direction'}</p><p className="whitespace-pre-wrap mt-2">{path?.goal?.body}</p></details></section>}
      <form onSubmit={save}`);
s=s.replace('onChange={event => setTitle(event.target.value)}',"onChange={event => edit('title', event.target.value)}").replace('onChange={event => setBody(event.target.value)}',"onChange={event => edit('body', event.target.value)}").replace('onChange={event => setConceptId(event.target.value)}',"onChange={event => edit('conceptId', event.target.value)}");
s=s.replace('<button className="v-button primary">Save direction</button>','<button className="v-button primary" disabled={!ready || conflict}>Save direction</button><button className="v-button" type="button" onClick={exportEdits}>Export current edits</button><button className="v-button" type="button" onClick={loadLatest}>Load saved direction and discard edits</button>');
s=s.replace('<option value="">Not linked yet</option>','<option value="">Not linked yet</option>{conceptId && !path?.capabilities.some(item => item.conceptId === conceptId) && <option value={conceptId}>Previously linked capability unavailable</option>}');
fs.writeFileSync(p,s);
