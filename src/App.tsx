import { useEffect, useMemo, useState } from "react";

const API_BASE = (() => {
  const env = import.meta.env.VITE_API_BASE;
  if (env) return env;
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    if (url.port === "5713") url.port = "4000";
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.origin;
  }
  return "";
})();

const faqItems = [
  {
    key: "design",
    question: "What exactly do I design?",
    answer: (
      <p>
        You design a <b>phone or tablet enclosure</b> — basically a case or
        cover. It can be protective, decorative, weird, chunky, minimal, or
        cursed. As long as it is an enclosure and printable, you are good.
      </p>
    ),
  },
  {
    key: "devices",
    question: "Which devices are allowed?",
    answer: (
      <p>
        Most phones and tablets are allowed. If your device is extremely huge or
        oddly shaped, we may ask you to tweak the design.
      </p>
    ),
  },
  {
    key: "printer",
    question: "Do I need a 3D printer?",
    answer: <p>Nope. You design it — we print it — we ship it to you.</p>,
  },
  {
    key: "hackatime",
    question: "Is Hackatime required?",
    answer: <p>No, Hackatime is not compulsory, although it is recommended.</p>,
  },
  {
    key: "format",
    question: "What file format do I submit?",
    answer: (
      <p>
        STP or STEP files are preferred. If you are unsure, export STP and you
        will be fine.
      </p>
    ),
  },
  {
    key: "free",
    question: "Is this actually free?",
    answer: (
      <p>
        Yes. This is a Hack Club You Ship, We Ship program. We cover printing
        and shipping.
      </p>
    ),
  },
  {
    key: "more",
    question: "More questions?",
    answer: (
      <p>
        If you have more questions, join{" "}
        <a
          href="https://hackclub.enterprise.slack.com/archives/C092D99G1RU"
          target="_blank"
          rel="noreferrer"
        >
          #enclosure
        </a>{" "}
        on Hack Club Slack, we have an amazing community to answer your
        questions!
      </p>
    ),
  },
];

const steps = [
  {
    title: "1. Measure 📏",
    body: "Measure your phone or tablet carefully. Button cutouts, camera bumps, ports — all that good stuff.",
    tag: "accuracy matters",
  },
  {
    title: "2. Design 🧠",
    body: "Design your enclosure in Fusion or Onshape. Add grip, texture, logos, chaos.",
    tag: "CAD time",
  },
  {
    title: "3. Submit ⬆️",
    body: "Upload your CAD file through the submission form. We will sanity-check it before printing.",
    tag: "STP / STEP",
  },
  {
    title: "4. Ship 📦",
    body: "We 3D print your enclosure and ship it straight to you. Yes, for real.",
    tag: "free plastic",
  },
];

const requirements = [
  {
    icon: "🧪",
    title: "Original design only",
    body: "Make something uniquely yours. No remixes of other people’s models.",
    tag: "keep it yours",
  },
  {
    icon: "🙅‍♂️",
    title: "No AI-generated CAD",
    body: "Hand-made in Fusion or Onshape. We want your brain, not a prompt.",
    tag: "human-made",
  },
  {
    icon: "🛠️",
    title: "Fusion or Onshape",
    body: "Submit native files or exports from these tools for the smoothest review.",
    tag: "supported CAD",
  },
  {
    icon: "🧱",
    title: "No supports needed",
    body: "Design so it prints cleanly without extra supports. Think about overhangs.",
    tag: "print-friendly",
  },
  {
    icon: "📏",
    title: "Stay within size",
    body: "Keep your enclosure within the posted build volume to avoid scaling.",
    tag: "fit the bed",
  },
  {
    icon: "🎒",
    title: "Age restriction",
    body: "Anyone can participate who is 13-18 years old.",
    tag: "play nice",
  },
];

function Hero({
  authed,
  authMessage,
}: {
  authed: boolean;
  authMessage?: string;
}) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <a target="_blank" rel="noreferrer" href="https://cad.hackclub.com">
          <div className="ysws-badge">Hack Club · CAD YSWS</div>
        </a>
        <div className="hero-visual">
          <img
            className="hero-logo"
            src="assets/logo.png"
            alt="Enclosure logo"
          />
          <div className="covers-wrap">
            <img
              className="cover-img cover-1"
              src="assets/covers/Case.png"
              alt="Enclosure cover example 1"
            />
            <img
              className="cover-img cover-2"
              src="assets/covers/case1.png"
              alt="Enclosure cover example 2"
            />
            <img
              className="cover-img cover-3"
              src="assets/covers/Case2png.png"
              alt="Enclosure cover example 3"
            />
            <img
              className="cover-img cover-4"
              src="assets/covers/Case3-.png"
              alt="Enclosure cover example 4"
            />
          </div>
        </div>
        <p>
          <b>
            Design your cover, we 3D-print and ship it! Make it protective,
            weird, minimal, chunky, or cursed.
          </b>
        </p>
        <div className="sub">
          You design it → we 3D print it → we ship it to you.
        </div>

        {authMessage ? (
          <div
            style={{
              marginTop: 12,
              marginBottom: 8,
              color: "#fca5a5",
              fontWeight: 600,
            }}
          >
            {authMessage}
          </div>
        ) : null}

        <div className="buttons-wrap">
          <div className="buttons">
            <div className="buttons-row top">
              {authed ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                >
                  Go to Dashboard →
                </button>
              ) : (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    window.location.href = `${API_BASE}/api/auth/login`;
                  }}
                >
                  Log in with Hack Club
                </button>
              )}
            </div>
            <div className="buttons-row bottom">
              <a
                target="_blank"
                rel="noreferrer"
                href="https://docs.google.com/presentation/d/e/2PACX-1vQpmTW_T9md56kegOqOYb9zAVv_upZSIxsNc59ueinncyolm_nHDyLXihWIRhBKb71LDOq6W_snMWBX/pub?start=false&loop=false&delayms=3000"
              >
                <button className="btn secondary" type="button">
                  Design Guide ✏️
                </button>
              </a>
              <a href="#workshop">
                <button className="btn secondary" type="button">
                  Join Slack🛠️
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="container">
        <h2>How Enclosure Works?</h2>
        <div className="section-note">
          aka: how plastic ends up at your door
        </div>
        <div className="grid">
          {steps.map((step) => (
            <div key={step.title} className="card">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <span className="tag">{step.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section className="section" id="gallery">
      <div className="container">
        <h2>Things Other People Made</h2>
        <div className="section-note">expect questionable design choices</div>
        <div className="gallery-locked">
          <div className="grid">
            <div className="gallery-box" />
            <div className="gallery-box" />
            <div className="gallery-box" />
            <div className="gallery-box" />
          </div>
          <div className="lock-overlay">🔒 Coming soon</div>
        </div>
      </div>
    </section>
  );
}

function Requirements() {
  return (
    <section className="section" id="rules">
      <div className="container">
        <h2>REQUIREMENTS</h2>
        <div className="section-note">
          we do not like them either, but printers do
        </div>
        <div className="rules">
          {requirements.map((req) => (
            <div key={req.title} className="rule-card">
              <div className="rule-icon" aria-hidden>
                {req.icon}
              </div>
              <div className="rule-body">
                <h3>{req.title}</h3>
                <p>{req.body}</p>
                <span className="rule-tag">{req.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [activeKey, setActiveKey] = useState<string>(faqItems[0]?.key ?? "");
  const activeItem = useMemo(
    () => faqItems.find((item) => item.key === activeKey) ?? faqItems[0],
    [activeKey],
  );

  return (
    <section className="section" id="faq">
      <div className="container">
        <h2>FAQS</h2>
        <div className="section-note">Questions you keep asking</div>
      </div>
      <div className="faq">
        <div className="faq-questions">
          {faqItems.map((item) => (
            <div
              key={item.key}
              className={`faq-q${item.key === activeKey ? " active" : ""}`}
              onClick={() => setActiveKey(item.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setActiveKey(item.key);
              }}
            >
              {item.question}
            </div>
          ))}
        </div>
        <div className="faq-answers">
          <h3>{activeItem?.question}</h3>
          <div>{activeItem?.answer}</div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      Enclosure is a Hack Club YSWS • made with plastic, patience, and poor life
      choices
    </footer>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("msg") === "auth_required") {
      setAuthMessage("Cannot access dashboard. Please authenticate.");
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          setAuthed(true);
        }
      } catch (_err) {
        setAuthed(false);
      }
    })();
  }, []);

  return (
    <>
      <a href="https://hackclub.com/">
        <img
          style={{
            position: "absolute",
            top: 0,
            left: 80,
            border: 0,
            width: 220,
            zIndex: 999,
          }}
          src="https://assets.hackclub.com/flag-orpheus-top.svg"
          alt="Hack Club"
        />
      </a>
      <Hero authed={authed} authMessage={authMessage} />
      <HowItWorks />
      <Gallery />
      <Requirements />
      <FAQ />
      <Footer />
    </>
  );
}
