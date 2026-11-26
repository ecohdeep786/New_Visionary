import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowDown, ArrowRight, ChevronRight, Maximize2, Plus, X } from "lucide-react";
import { useSignedIn } from "@/components/landing/AuthAwareLink";
import "./category-story.css";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी" },
  { code: "bn", name: "বাংলা" },
];

function Opening({ story }) {
  const { opening } = story;
  return (
    <section className="cs-opening cs-width" aria-labelledby="situation-title">
      <div className="cs-opening-copy">
        <header>
          <p className="cs-label">For {story.audience.toLowerCase()}s</p>
          <h2 id="situation-title" data-type="section">{opening.title}</h2>
        </header>
        <p className="cs-body">{opening.body}</p>
        <a className="cs-link" href="#workspace">{opening.link}<ArrowDown size={16} aria-hidden="true" /></a>
      </div>
      <div className="cs-portrait">
        <img src={opening.image} alt={opening.alt} width="700" height="700" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}

function ScreenPicture({ step }) {
  return (
    <picture>
      <source media="(max-width: 599px)" srcSet={step.phone.src} width={step.phone.width} height={step.phone.height} />
      <img src={step.desktop.src} width={step.desktop.width} height={step.desktop.height}
        loading="lazy" decoding="async" alt={step.alt} />
    </picture>
  );
}

function WorkspaceStory({ story }) {
  const [active, setActive] = useState(story.steps[0].id);
  const dialog = useRef(null);
  const selected = story.steps.find((step) => step.id === active);
  return (
    <section id="workspace" tabIndex={-1} aria-labelledby="workspace-title" className="cs-workspace">
      <div className="cs-width">
        <header className="cs-heading">
          <p className="cs-label">{story.workspace}</p>
          <h2 id="workspace-title" data-type="section">{story.title}</h2>
          <div>
            <p className="cs-intro">{story.introduction}</p>
            <p className="cs-caption">Preview of the {story.audience === "Student" ? "learner" : story.audience.toLowerCase()} workspace in development. Records shown are examples.</p>
          </div>
        </header>
        <Tabs.Root value={active} onValueChange={setActive}>
          <Tabs.List aria-label={story.workspace} className="cs-steps">
            {story.steps.map((step) => (
              <Tabs.Trigger key={step.id} value={step.id} className="cs-step">{step.label}</Tabs.Trigger>
            ))}
          </Tabs.List>
          {story.steps.map((step) => (
            <Tabs.Content key={step.id} value={step.id} className="cs-panel">
              <div className="cs-panel-copy">
                <h3 data-type="feature">{step.title}</h3>
                <p className="cs-body">{step.body}</p>
              </div>
              <div className="cs-screen">
                <ScreenPicture step={step} />
                <button type="button" className="cs-enlarge" onClick={() => dialog.current?.showModal()}>
                  <Maximize2 size={15} aria-hidden="true" /> Enlarge screenshot
                </button>
              </div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
      <dialog ref={dialog} aria-labelledby="screen-title" className="cs-dialog"
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close(); }}>
        <div className="cs-dialog-inner">
          <div className="cs-dialog-header">
            <h3 id="screen-title" data-type="feature-heading">{selected.title}</h3>
            <button type="button" className="cs-close" aria-label="Close screenshot" onClick={() => dialog.current.close()}>
              <X size={21} aria-hidden="true" />
            </button>
          </div>
          {/* Keep the original pixels available for reading small interface text. */}
          <div className="cs-dialog-view" tabIndex={0} role="region" aria-label="Full-size screenshot">
            <ScreenPicture step={selected} />
          </div>
        </div>
      </dialog>
    </section>
  );
}

function LanguageExample({ language }) {
  const [current, setCurrent] = useState("en");
  return (
    <section className="cs-language" aria-labelledby="language-title">
      <div className="cs-width cs-language-layout">
        <div>
          <header><h2 id="language-title" data-type="section">{language.title}</h2></header>
          <p className="cs-body">{language.introduction}</p>
          <div className="cs-languages" role="group" aria-label="Example language">
            {languages.map(({code, name}) => (
              <button key={code} lang={code} type="button" aria-pressed={current === code}
                onClick={() => setCurrent(code)}>{name}</button>
            ))}
          </div>
        </div>
        <div className="cs-sample">
          <p className="cs-question" aria-live="polite" aria-atomic="true">
            <span lang={current}>{language.examples[current]}</span>
          </p>
        </div>
      </div>
      <p className="cs-width cs-language-note">English, Hindi, and Bengali are supported. More languages are on the roadmap.</p>
    </section>
  );
}

function RoleDetails({ support }) {
  return (
    <section className={"cs-details cs-width cs-details-" + support.kind} aria-labelledby="details-title">
      <header>
        <p className="cs-label">{support.label}</p>
        <h2 id="details-title" data-type="section">{support.title}</h2>
      </header>
      {support.kind === "questions" && (
        <div className="cs-questions">
          {support.items.map(({title, body}) => (
            <details key={title} name="role-questions">
              <summary>{title}<Plus size={19} aria-hidden="true" /></summary>
              <p className="cs-body">{body}</p>
            </details>
          ))}
        </div>
      )}
      {support.kind === "boundaries" && (
        <div className="cs-boundaries">
          {support.items.map(({title, points}) => (
            <div key={title}>
              <h3 data-type="feature-heading">{title}</h3>
              <ul>{points.map((text) => <li key={text}>{text}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {support.kind === "decisions" && (
        <dl className="cs-decisions">
          {support.items.map(({title, body}) => (
            <div key={title}><dt>{title}</dt><dd>{body}</dd></div>
          ))}
        </dl>
      )}
      {support.link && <Link to={support.link.to} className="cs-link">{support.link.label}<ChevronRight size={17} aria-hidden="true" /></Link>}
    </section>
  );
}

function NextStep({ story }) {
  const signedIn = useSignedIn();
  const organization = story.role === "organization";
  return (
    <section className="cs-next" aria-labelledby="next-title">
      <div className="cs-width">
        <header><h2 id="next-title" data-type="section">{story.closing.title}</h2></header>
        <p className="cs-body">{signedIn && !organization ? "Continue in your own workspace with the account you’re using." : story.closing.body}</p>
        <div className="cs-actions">
          {organization ? (
            <Link className="cs-action" to="/contact#organization-enquiries">Discuss a rollout<ArrowRight size={17} aria-hidden="true" /></Link>
          ) : (
            <Link className="cs-action" to={signedIn ? "/dashboard/home" : "/register"}>
              {signedIn ? "Open Visionary" : "Create a free account"}<ArrowRight size={17} aria-hidden="true" />
            </Link>
          )}
          <Link className="cs-link" to="/#audiences">Explore the five roles<ChevronRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}

export default function CategoryStory({ story }) {
  // A guardian needs the sharing boundary before seeing anybody's report.
  const permissionFirst = story.role === "parent";
  const applicationFirst = story.role === "organization" || story.role === "teacher";
  return (
    <div className="category-story" data-audience={story.role}>
      <Opening story={story} />
      {permissionFirst && <RoleDetails support={story.support} />}
      <WorkspaceStory story={story} />
      {applicationFirst && <RoleDetails support={story.support} />}
      <LanguageExample language={story.language} />
      {!permissionFirst && !applicationFirst && <RoleDetails support={story.support} />}
      <NextStep story={story} />
    </div>
  );
}
