/** Static geometry reserves space; no indefinite shimmer or invented content. */
export default function WorkspaceSkeleton({label, cards = 3}) {
 return <div className="v-workspace-skeleton" role="status" aria-busy="true"><span className="sr-only">{label}</span><div className="v-skeleton-line" aria-hidden="true"/><div className="v-skeleton-grid" aria-hidden="true">{Array.from({length:cards},(_,index)=><div className="v-skeleton-card" key={index}><div className="v-skeleton-cover"/><div className="v-skeleton-line"/><div className="v-skeleton-line short"/></div>)}</div></div>;
}
