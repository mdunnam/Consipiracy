'use strict';
const fs = require('fs');

const NAV = `  <nav class="site-nav" role="navigation" aria-label="Main navigation">
    <a href="index.html" class="nav-logo">
      <span class="eye-symbol">&#x1F441;</span>
      Truth Archive
    </a>
    <button class="nav-toggle" aria-expanded="false" aria-label="Toggle menu">&#x2630;</button>
    <ul class="nav-links">
      <li class="nav-group">
        <button class="nav-group-toggle" aria-expanded="false" aria-label="Browse all chapters">
          <span class="nav-rail-icon" aria-hidden="true">&#x25A6;</span><span class="nav-rail-label">Chapters &#x25BE;</span>
        </button>
        <ul class="nav-sub">
          <li><a href="flat-earth.html">Ch 01 &middot; Flat Earth</a></li>
          <li><a href="great-awakening.html">Ch 02 &middot; Great Awakening</a></li>
          <li><a href="deep-state.html">Ch 03 &middot; Deep State</a></li>
          <li><a href="secret-societies.html">Ch 04 &middot; Secret Societies</a></li>
          <li><a href="banking-control.html">Ch 05 &middot; Banking Control</a></li>
          <li><a href="media-control.html">Ch 06 &middot; Media Control</a></li>
          <li><a href="space-deception.html">Ch 07 &middot; Space Deception</a></li>
          <li><a href="big-pharma.html">Ch 08 &middot; Big Pharma</a></li>
          <li><a href="tech-control.html">Ch 09 &middot; Tech &amp; Control</a></li>
          <li><a href="false-flags.html">Ch 10 &middot; False Flags</a></li>
          <li><a href="suppressed-history.html">Ch 11 &middot; Suppressed History</a></li>
          <li><a href="metaphysical.html">Ch 12 &middot; Metaphysical</a></li>
          <li><a href="ufo-disclosure.html">Ch 13 &middot; UFO Disclosure</a></li>
          <li><a href="ancient-civilisations.html">Ch 14 &middot; Ancient Civilisations</a></li>
          <li><a href="anomalous-zones.html">Ch 15 &middot; Anomalous Zones</a></li>
          <li><a href="elite-networks.html">Ch 16 &middot; Elite Networks</a></li>
          <li><a href="internet-control.html">Ch 17 &middot; Internet Control</a></li>
          <li><a href="mandela-effect.html">Ch 18 &middot; Mandela Effect</a></li>
          <li><a href="forensic-mysteries.html">Ch 19 &middot; Forensic Mysteries</a></li>
          <li><a href="secret-science.html">Ch 20 &middot; Secret Science</a></li>
        </ul>
      </li>
      <li><a href="rabbit-hole.html">Rabbit Hole</a></li>
      <li><a href="tier-list.html">Tier List</a></li>
      <li><a href="map.html">Connection Map</a></li>
      <li><a href="ebook.html" class="ebook-link">eBook</a></li>
    </ul>
  </nav>`;

const FOOTER = `  <footer class="site-footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <h3>The Truth Archive</h3>
        <p>An independent research network dedicated to exposing the hidden architecture of power.</p>
        <p style="margin-top:1rem;font-family:var(--font-mono);font-size:0.68rem;color:var(--text-muted);letter-spacing:0.1em;">
          &ldquo;Once you see it, you cannot unsee it.&rdquo;
        </p>
      </div>
      <div class="footer-links">
        <h5>New Chapters</h5>
        <ul>
          <li><a href="ufo-disclosure.html">UFO Disclosure</a></li>
          <li><a href="ancient-civilisations.html">Ancient Civilisations</a></li>
          <li><a href="anomalous-zones.html">Anomalous Zones</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h5>Core Routes</h5>
        <ul>
          <li><a href="deep-state.html">Deep State</a></li>
          <li><a href="flat-earth.html">Flat Earth</a></li>
          <li><a href="secret-societies.html">Secret Societies</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h5>Interactive</h5>
        <ul>
          <li><a href="rabbit-hole.html">Rabbit Hole</a></li>
          <li><a href="tier-list.html">Tier List</a></li>
          <li><a href="ebook.html">eBook</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&#9670; &nbsp; THE TRUTH ARCHIVE &nbsp; &#9670; &nbsp; RESEARCH &amp; EDUCATION &nbsp; &#9670; &nbsp; QUESTION EVERYTHING &nbsp; &#9670;</p>
    </div>
  </footer>`;

/**
 * Builds a full chapter HTML page.
 * @param {Object} cfg - chapter configuration
 * @returns {string} full HTML
 */
function buildPage({ file, chNum, title, titleRaw, subtitle, desc, toc, sections }) {
  const tocItems = toc.map(([id, label]) =>
    `          <li><a href="#${id}">${label}</a></li>`
  ).join('\n');

  const sectionBlocks = sections.map(({ id, heading, body }) => `
    <section class="section" id="${id}">
      <div class="container-narrow">
        <div class="chapter-content fade-in">
          <h2>${heading}</h2>
          ${body}
        </div>
      </div>
    </section>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} \u2014 Truth Archive</title>
  <meta name="description" content="${desc}" />
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="https://thetrutharchive.org/${file}" />
  <meta property="og:title"       content="${title} \u2014 Truth Archive" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image"       content="https://thetrutharchive.org/images/og-preview.jpg" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:url"         content="https://thetrutharchive.org/${file}" />
  <meta name="twitter:title"       content="${title} \u2014 Truth Archive" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image"       content="https://thetrutharchive.org/images/og-preview.jpg" />
  <link rel="stylesheet" href="css/style.css" />
  <link rel="stylesheet" href="css/enhancements.css" />
  <style>
    .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.35s ease, transform 0.35s ease; }
    .fade-in.visible { opacity: 1; transform: none; }
    .chapter-content h2 { font-family: var(--font-heading); font-size: clamp(1.1rem,2.5vw,1.4rem); color: var(--gold); letter-spacing: 0.06em; text-transform: uppercase; margin: 2.5rem 0 0.8rem; border-left: 3px solid var(--red-bright); padding-left: 0.8rem; }
    .chapter-content p  { color: var(--text-secondary); line-height: 1.9; margin-bottom: 1.1rem; }
    .chapter-content ul { color: var(--text-secondary); line-height: 1.9; padding-left: 1.4rem; margin-bottom: 1.1rem; }
    .chapter-content li { margin-bottom: 0.4rem; }
    blockquote { border-left: 3px solid var(--border-gold); padding: 1rem 1.25rem; margin: 1.5rem 0; background: rgba(201,162,39,0.04); color: var(--text-secondary); font-style: italic; }
    blockquote strong { color: var(--gold); font-style: normal; display: block; margin-top: 0.5rem; font-size: 0.82rem; font-family: var(--font-mono); }
    .fact-box { background: rgba(201,162,39,0.06); border: 1px solid rgba(201,162,39,0.25); padding: 1.1rem 1.25rem; margin: 1.5rem 0; }
    .fact-label { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.2em; color: var(--gold); text-transform: uppercase; display: block; margin-bottom: 0.4rem; }
    .alert-box { background: rgba(139,20,20,0.08); border: 1px solid rgba(139,20,20,0.35); padding: 1.1rem 1.25rem; margin: 1.5rem 0; }
    .alert-label { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.2em; color: var(--red-bright); text-transform: uppercase; display: block; margin-bottom: 0.4rem; }
    .classified-stamp { font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.3em; color: var(--red-bright); border: 1px solid var(--red-bright); display: inline-block; padding: 0.3rem 0.8rem; margin-top: 2rem; opacity: 0.6; text-transform: uppercase; }
    .toc { background: rgba(201,162,39,0.04); border: 1px solid var(--border-gold); padding: 1.25rem 1.5rem; margin-bottom: 2.5rem; }
    .toc h3 { font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.2em; color: var(--gold); text-transform: uppercase; margin-bottom: 0.75rem; }
    .toc ol { padding-left: 1.25rem; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.9; }
    .toc a { color: var(--text-secondary); text-decoration: none; }
    .toc a:hover { color: var(--gold); }
  </style>
</head>
<body>

${NAV}

  <div id="reading-progress"></div>

  <header class="page-header">
    <div class="container-narrow">
      <span class="chapter-label">Chapter ${chNum.toString().padStart(2,'0')}</span>
      <h1 class="glitch" data-text="${titleRaw}">${titleRaw}</h1>
      <div class="divider"></div>
      <p class="subtitle">${subtitle}</p>
    </div>
  </header>

  <main>
    <div class="section">
      <div class="container-narrow">
        <nav class="toc fade-in" aria-label="Page contents">
          <h3>Contents</h3>
          <ol>
${tocItems}
          </ol>
        </nav>
      </div>
    </div>
${sectionBlocks}

    <section class="section" style="text-align:center;">
      <div class="container-narrow">
        <div class="divider"></div>
        <p style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);letter-spacing:0.1em;margin:1rem 0 0.5rem;">CONTINUE THE INVESTIGATION</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:1rem;">
          <a href="rabbit-hole.html" class="btn btn-outline">&#x21AF; Generate Rabbit Hole</a>
          <a href="ebook.html" class="btn btn-primary">&#x25B6; Read Complete eBook</a>
        </div>
      </div>
    </section>
  </main>

${FOOTER}

  <script src="js/app.js"></script>
  <script src="js/enhancements.js"></script>
</body>
</html>`;
}

// ── Chapter definitions ──────────────────────────────────────────────────────

const CHAPTERS = [
  {
    file: 'ufo-disclosure.html',
    chNum: 13,
    title: 'UFO Disclosure & Non-Human Intelligence',
    titleRaw: 'UFO DISCLOSURE',
    subtitle: 'The most significant cover-up in human history is not about money, politics, or ideology. It is about who else is here — and who has known for decades.',
    desc: 'Sworn congressional testimony, Roswell witnesses, the Tic-Tac incident, Rendlesham binary code, and the architecture of managed disclosure.',
    toc: [
      ['congress-2023','The Congressional Threshold — 2023'],
      ['roswell','Roswell — 600+ Affidavits, Still Classified'],
      ['rendlesham','Rendlesham Forest 1980 — The UK\'s Roswell'],
      ['tictac','The Tic-Tac Incident — USS Nimitz, 2004'],
      ['phoenix','The Phoenix Lights — 10,000 Witnesses'],
      ['ariel','The Ariel School Contact — Zimbabwe, 1994'],
      ['malmstrom','Malmstrom Air Force Base — ICBMs Disabled'],
      ['disclosure','The Disclosure Architecture'],
    ],
    sections: [
      { id:'congress-2023', heading:'The Congressional Threshold — 2023',
        body:`<p>On July 26, 2023, former intelligence official David Grusch testified under oath before the House Oversight Committee that the US government has operated "a multi-decade UAP crash retrieval and reverse engineering programme" and that it has recovered "non-human biologics" from crash sites. This is sworn congressional testimony — not a podcast claim, not a book, not anonymous sourcing. Grusch named specific individuals who corroborated his account. He described facing illegal retaliation for bringing this information to the Inspector General through official whistleblower channels. The Intelligence Community Inspector General assessed his complaint as "credible and urgent." None of this was reported as the lead story by any major US network.</p>
        <div class="fact-box"><span class="fact-label">Sworn Testimony — Congress, July 2023</span><p>"I was informed in the course of my official duties of a multi-decade UAP crash retrieval and reverse engineering programme to which I was denied access." — David Grusch, former NGA and NRO intelligence officer, under oath before the House Oversight Subcommittee on National Security.</p></div>` },
      { id:'roswell', heading:'Roswell — 600+ Affidavits, Still Classified',
        body:`<p>The July 1947 Roswell incident is the most documented UFO event in history — not because of sensationalism but because of the sheer volume of on-the-record testimony from military personnel, medical staff, and civilians who handled the debris and remains. The initial Army Air Force press release confirmed a "flying disc" had been recovered. This was retracted within hours, replaced by the "weather balloon" explanation — an explanation that required the Army to claim their intelligence officers could not distinguish a weather balloon from the most advanced aircraft of the era. By 2023, researchers had compiled over 600 signed affidavits from first and second-hand witnesses. Relevant documents remain classified under national security exemptions with no published declassification schedule.</p>` },
      { id:'rendlesham', heading:'Rendlesham Forest 1980 — The UK\'s Roswell',
        body:`<p>Over three nights in December 1980, US Air Force personnel at RAF Bentwaters/Woodbridge in Suffolk, England, encountered a structured craft landing in Rendlesham Forest. Lt. Col. Charles Halt — the deputy base commander — filed an official memorandum to the Ministry of Defence describing craft with coloured lights, radiation readings above normal background, and physical ground trace evidence. Most remarkably, Staff Sergeant Jim Penniston reported making physical contact with the craft's hull and later — under hypnotic regression — produced a 16-page binary code from memory which, when decoded, produced geographical coordinates for significant global sites and the phrase "EYES OF YOUR WORLD."</p>` },
      { id:'tictac', heading:'The Tic-Tac Incident — USS Nimitz, 2004',
        body:`<p>In November 2004, naval aviator Commander David Fravor encountered an unidentified aerial object approximately 40 feet long, white, shaped like a "Tic Tac," with no visible exhaust, no wings, and no discernible propulsion system. It was tracked on ATFLIR targeting pods and by Princeton's SPY-1 radar, which had been tracking objects descending from 80,000 feet to sea level in under a second — velocities exceeding any known aircraft by orders of magnitude. The object demonstrated instantaneous acceleration and deceleration physically impossible for any aerodynamic vehicle. Fravor testified before the Senate Intelligence Committee and stated: "It was not from this world."</p>` },
      { id:'phoenix', heading:'The Phoenix Lights — 10,000 Witnesses',
        body:`<p>On March 13, 1997, a formation of lights spanning an estimated one mile was observed in a northward-to-southward transit across Nevada, Arizona, and Sonora, Mexico. In the Phoenix metropolitan area alone, an estimated 10,000 witnesses reported a massive, silent, V-shaped structure that blocked out stars as it passed overhead. Arizona Governor Fife Symington held a press conference the following day mocking the sightings. In 2007, Symington publicly admitted he personally witnessed the craft: "It was enormous and it just drifted silently over the desert. I was absolutely stunned." He stated the government's response was a cover-up.</p>` },
      { id:'ariel', heading:'The Ariel School Contact — Zimbabwe, 1994',
        body:`<p>On September 16, 1994, 62 children aged 8–12 at the Ariel School in Ruwa, Zimbabwe, reported that during morning break a craft landed near the school's perimeter. Children described beings in black suits who communicated through eye contact — conveying images of environmental destruction and an urgent warning about the direction of human civilisation. Dr. John Mack of Harvard University interviewed the children over several weeks and found their accounts consistent, independently corroborated, and evidencing no signs of group suggestion or fabrication. The children — now adults — have maintained their accounts unchanged for 30 years.</p>` },
      { id:'malmstrom', heading:'Malmstrom Air Force Base — ICBMs Disabled',
        body:`<p>On March 16, 1967, Captain Robert Salas was on duty underground at Malmstrom AFB, Montana, when a security guard reported a glowing red object hovering over the front gate. Within seconds, all ten Minuteman nuclear-tipped missiles in his flight went offline simultaneously. An identical shutdown occurred at a neighbouring flight the same morning. Salas has testified under oath before Congress: "These were missiles carrying nuclear warheads pointed at the Soviet Union. The fact that these were disabled — and a completely unknown craft was involved — should be the most important national security story in American history." The Air Force has never provided a technical explanation for the simultaneous shutdown.</p>` },
      { id:'disclosure', heading:'The Disclosure Architecture — Managing the Reveal',
        body:`<p>The pattern of UAP disclosure since 2017 follows what researchers term "managed disclosure": a carefully graduated release designed to prepare public psychology for a reality the controlling institutions have suppressed for 70+ years, without triggering a collapse of institutional authority. The key question is not whether non-human intelligences exist and interact with Earth — sworn testimony, official government confirmation, and declassified documents make denial impossible. The questions are: what has been the nature of that relationship, who within the national security state has managed it, what technology has been back-engineered, and what agreements — if any — have been made with non-human entities on behalf of a humanity that was never consulted?</p><div class="classified-stamp">EYES ONLY</div>` },
    ]
  },

  {
    file: 'ancient-civilisations.html',
    chNum: 14,
    title: 'Ancient Civilisations & Suppressed Archaeology',
    titleRaw: 'ANCIENT CIVILISATIONS',
    subtitle: 'The timeline of human history is wrong. The evidence has been buried, dismissed, and in some cases destroyed by the institutions tasked with preserving it.',
    desc: 'The Younger Dryas impact, Göbekli Tepe, Baalbek\'s 1,500-tonne stones, the Richat Structure as Atlantis, Paracas skull DNA, and the Smithsonian destruction programme.',
    toc: [
      ['younger-dryas','The Younger Dryas Impact — The Reset Nobody Teaches'],
      ['baalbek','Baalbek — The 1,500-Tonne Question'],
      ['gobekli','Göbekli Tepe — The Pre-Flood Sanctuary'],
      ['gunung-padang','Gunung Padang — A 25,000-Year-Old Pyramid'],
      ['richat','The Richat Structure — Atlantis Located'],
      ['sacsayhuaman','Sacsayhuamán — Precision Masonry Without Tools'],
      ['paracas','Paracas Skulls — The DNA That Changed Everything'],
      ['smithsonian','The Smithsonian Destruction Programme'],
    ],
    sections: [
      { id:'younger-dryas', heading:'The Younger Dryas Impact — The Reset Nobody Teaches',
        body:`<p>Approximately 12,900 years ago, a catastrophic cooling event — the Younger Dryas — halted the warming proceeding since the last ice age maximum. In 2018, <em>Science Advances</em> published a peer-reviewed paper by 27 researchers from 10 countries documenting a platinum anomaly — the signature of an extraterrestrial impact — at the Younger Dryas boundary layer on six continents and three continental shelves. Microscopic diamonds, spherules, and melt glass consistent with impact ejecta appear in this same layer worldwide. A major cometary impact reset civilisation 12,900 years ago. This does not appear in any standard history curriculum. It directly explains Göbekli Tepe, the flood myths of every culture on Earth, and the abrupt transition in civilisation levels.</p>` },
      { id:'baalbek', heading:'Baalbek — The 1,500-Tonne Question',
        body:`<p>In the foundations of the Roman temple complex at Baalbek, Lebanon, lie the largest worked stones on Earth. The Trilithon — three stones at the base of the Temple of Jupiter — each weigh approximately 800 tonnes. In the adjacent quarry, the Stone of the Pregnant Woman weighs an estimated 1,000 tonnes; a stone discovered in 1996 weighs approximately 1,650 tonnes. The most powerful heavy-lift crane currently in service has a maximum lift capacity of 1,200 tonnes under ideal conditions. How these stones were transported over hilly terrain and precisely fitted remains genuinely unexplained. The Roman engineers who built the temple above simply used what was already there — they did not place the foundation stones. Who did, and when, is the question mainstream archaeology studiously avoids.</p>` },
      { id:'gobekli', heading:'Göbekli Tepe — The Pre-Flood Sanctuary',
        body:`<p>Göbekli Tepe, at 12,000 years old, predates the supposed beginning of agriculture, cities, writing, and organised religion by thousands of years. Its builders — by the orthodox timeline, hunter-gatherers — mobilised the resources to quarry, transport, and precisely carve 20-tonne limestone pillars, erect them in precise geometric arrangements, and build at least 20 separate enclosures. Then, around 8,200 BC, the entire site was deliberately and carefully buried. This burial was preservational. The builders entombed their own temple, as if knowing something was coming. The encrypted star map encoded in the pillar arrangements — decoded by researchers at Edinburgh University in 2017 — points to the Younger Dryas impact date: a memorial to the event that ended their world.</p>` },
      { id:'gunung-padang', heading:'Gunung Padang — A 25,000-Year-Old Pyramid',
        body:`<p>The Gunung Padang megalithic site in West Java, Indonesia, has been excavated since 2012. Core drilling found structured columns of rock at depths consistent with construction dates of 14,000–25,000 years ago — the last ice age maximum. The deeper layers show signs of deliberate volcanic rock construction, not natural formation. This would make it the oldest known man-made structure on Earth by over 15,000 years. The Indonesian government initially supported the excavations, then abruptly withdrew support and expelled the team in 2014 following intervention from academic archaeologists. The official objection: the findings were "too controversial." The site has not been independently excavated since.</p>` },
      { id:'richat', heading:'The Richat Structure — Atlantis Located',
        body:`<p>Plato described Atlantis in precise detail: a circular city of concentric rings of land and water, located beyond the Pillars of Hercules, sunk approximately 11,600 years ago. The Richat Structure in Mauritania — a 40-kilometre-diameter bull's-eye formation visible from space — matches Plato's dimensions with extraordinary precision. At the time of the Younger Dryas impact, the Sahara was a fertile grassland. Geologists have confirmed the Richat area experienced catastrophic flooding consistent with a Younger Dryas impact tsunami. Stone tools, human remains, and stone circles have been found at the site. The mainstream explanation — geological dome erosion — does not account for the concentric ring morphology matching Plato's description to within 5%.</p>` },
      { id:'sacsayhuaman', heading:'Sacsayhuamán — Precision Masonry Without Tools',
        body:`<p>The walls of Sacsayhuamán above Cusco, Peru, are assembled from interlocking stones weighing up to 125 tonnes, cut with precision so exact that a piece of paper cannot be inserted between stones, with no mortar. The stones' interlocking angles — many with 12 or more sides fitting into adjacent stones with sub-millimetre accuracy — cannot be reproduced by modern stonemasonry. Experimental archaeology attempting to replicate the construction using only tools available to the Inca has consistently failed to produce even a fraction of the original precision. The Inca themselves, when asked by Spanish conquistadors how these walls were built, stated: "The giants before us built them."</p>` },
      { id:'paracas', heading:'Paracas Skulls — The DNA That Changed Everything',
        body:`<p>The Paracas culture of coastal Peru produced elongated skulls found in burial sites beginning in the 1920s. Mainstream archaeology attributes these to deliberate cranial binding in infancy. The problem: the volume of the elongated skulls is 25–40% greater than the maximum capacity of a normal modern human skull. Binding changes shape; it cannot increase volume. In 2018, DNA analysis of five Paracas skulls returned results showing mitochondrial DNA with mutations unknown in any human population or primate. The haplogroups found had no match in any database. The conclusion — that these skulls represent a separate humanoid species or hybridised population — has not been refuted on scientific grounds; it has simply been suppressed by not receiving academic publication.</p>` },
      { id:'smithsonian', heading:'The Smithsonian Destruction Programme',
        body:`<p>A 1991 court case (Smithsonian Institution v. American Institutions for Archaeological Research) confirmed that the Smithsonian had systematically destroyed giant skeletal remains collected in the 19th and early 20th centuries. Thousands of newspaper records from the 1800s — including the <em>New York Times</em>, local press across 37 US states, and the Smithsonian's own publications — documented the excavation of human skeletons ranging from 7 to 12 feet in height. The physical evidence no longer exists because it was destroyed by the institution tasked with preserving it. What was found, who ordered its destruction, and why remain the most important unanswered questions in American archaeology.</p><div class="classified-stamp">ARCHIVE SEALED</div>` },
    ]
  },

  {
    file: 'anomalous-zones.html',
    chNum: 15,
    title: 'Anomalous Zones & Vanishing Points',
    titleRaw: 'ANOMALOUS ZONES',
    subtitle: 'There are places on Earth where the rules change. Where people disappear without trace, compasses fail, and official explanations collapse on inspection.',
    desc: 'Missing 411 clustering data, Skinwalker Ranch classified DIA research, Bermuda Triangle documented cases, Hessdalen Lights, Bennington Triangle, and Oak Island.',
    toc: [
      ['missing-411','Missing 411 — The Pattern David Paulides Found'],
      ['skinwalker','Skinwalker Ranch — The DIA Studied It'],
      ['bermuda','The Bermuda Triangle — The Real Cases'],
      ['hessdalen','Hessdalen Lights — 40 Years, Still Unexplained'],
      ['bennington','The Bennington Triangle — Five Vanished, No Trace'],
      ['oak-island','Oak Island — The Money Pit and Its Dead'],
      ['what-are-these','What Are These Zones?'],
    ],
    sections: [
      { id:'missing-411', heading:'Missing 411 — The Pattern David Paulides Found',
        body:`<p>Former police detective David Paulides spent years filing FOIA requests with the US National Park Service seeking statistics on missing persons in national parks. The NPS refused, claiming no such database existed — an extraordinary claim for a federal agency managing public land. Paulides compiled the data himself. His findings identified clusters of disappearances with shared characteristics distinguishing them from ordinary lost hiker cases: victims found miles from last known location in areas already searched, tracking dogs unable to find scent trails, bodies found in near-perfect condition with no cause of death, victims found without shoes, and disappearances in specific geographical clusters regardless of how remote or well-patrolled. No credible conventional explanation has been offered.</p>` },
      { id:'skinwalker', heading:'Skinwalker Ranch — The DIA Studied It',
        body:`<p>Skinwalker Ranch in Utah's Uintah Basin has been the site of documented anomalous phenomena for decades: cattle mutilations with surgical precision, orbs of light entering and exiting the ground, poltergeist phenomena, and multiple UFO sightings. Between 1996 and 2004, billionaire Robert Bigelow purchased the property and installed a scientific research team through the National Institute for Discovery Science. The NIDS team documented multiple anomalous events but was consistently unable to study phenomena directly — objects appeared to respond to observation by ceasing activity. Most significantly: the ranch's anomalies appear to originate from a specific location, now the focus of AAWSAP — the Advanced Aerospace Weapon System Application Program — a classified DIA programme partly designed around investigating Skinwalker Ranch.</p>` },
      { id:'bermuda', heading:'The Bermuda Triangle — The Real Cases',
        body:`<p>The Bermuda Triangle's mythology was embellished by Charles Berlitz's 1974 book, but the core anomaly is real. Flight 19 — five US Navy TBM Avenger torpedo bombers that disappeared in December 1945 with 14 crew — is documented. The rescue aircraft sent to find them also disappeared. The USS Cyclops, carrying 309 crew, vanished in 1918 with no distress signal, no wreckage, and no trace — the largest peacetime loss of US Navy personnel in history. Carbon dating of debris, documented disappearance clusters, and multiple unresolved mechanical anomalies suggest the zone has genuine statistical anomalies compared to equivalent oceanic zones of comparable traffic density. The US Navy officially does not recognise the Triangle's existence.</p>` },
      { id:'hessdalen', heading:'Hessdalen Lights — 40 Years, Still Unexplained',
        body:`<p>Since the 1930s, and intensively since the 1980s, the Hessdalen valley in central Norway has been the site of persistent unexplained light phenomena. The lights — varying from white to yellow to red — appear at all hours, move at varying speeds, and have been photographed, filmed, and measured by scientific instruments from 22 countries as part of Project Hessdalen, established in 1983. Spectral analysis confirms they emit light beyond the visible spectrum. Radar confirms their presence is physical, not optical. Electromagnetic measurements confirm unusual field patterns preceding appearances. After 40 years of continuous study, no scientific consensus exists on their origin. "Unexplained natural phenomenon" is a categorisation, not an explanation.</p>` },
      { id:'bennington', heading:'The Bennington Triangle — Five Vanished, No Trace',
        body:`<p>Between November 1945 and October 1950, five people disappeared without trace in a small area of southwestern Vermont near Glastenbury Mountain: Middie Rivers (74), Paula Welden (18), James Tedford (68), Paul Jepson (8), and Frieda Langer (53). Four were never found. Langer was found dead seven months later in a visible location that had already been searched multiple times. The medical examiner could not determine cause of death. Five disappearances in five years from a defined geographical area with a combined 1,700 square miles of wilderness and a permanent population under 100 represents a statistical impossibility under ordinary circumstances.</p>` },
      { id:'oak-island', heading:'Oak Island — The Money Pit and Its Dead',
        body:`<p>Since 1795, over 30 treasure-hunting operations have attempted to excavate what became known as the Money Pit on Oak Island, Nova Scotia. Every operation has encountered the same obstacle: a series of flood tunnels that fill the pit with seawater at a rate that overwhelms any pumping system. Dye tests confirmed the flood tunnels connect to multiple ocean inlets, suggesting sophisticated pre-engineering. Carbon dating of wood found at depth indicates construction between 1626 and 1700 — before the island was known to be settled. Objects found include gold chain links, parchment fragments, coconut fibre (not native to Nova Scotia), and cut stone with an inscription translated as "forty feet below, two million pounds are buried." Six people have died in excavation attempts.</p>` },
      { id:'what-are-these', heading:'What Are These Zones?',
        body:`<p>Anomalous zones cluster around specific types of geology: areas with high concentrations of magnetite, quartz, or limestone; sites near underground water systems; locations at specific intersections of ley lines mapped independently by multiple researchers. The convergence suggests a mechanism — possibly related to piezoelectric effects in quartz-bearing geology, electromagnetic anomalies associated with specific mineral compositions, or proximity to whatever structures generate the phenomena observed at Hessdalen, Skinwalker, and similar locations globally. The alternative — that these zones represent thin points between dimensional layers of reality — is not testable with current instrumentation but is the working hypothesis of researchers who have spent decades at these sites.</p>` },
    ]
  },

  {
    file: 'elite-networks.html',
    chNum: 16,
    title: 'Elite Networks & Organised Crime',
    titleRaw: 'ELITE NETWORKS',
    subtitle: 'The people running the world do not trust democracy to keep them in power. They built parallel structures that do not appear on any ballot or in any public record.',
    desc: 'WEF Young Global Leaders, Rhodes Scholar pipeline, NGO soft power and regime change, Panama Papers, think tank capture, and the private island meeting architecture.',
    toc: [
      ['wef','The WEF — Decisions Made in Davos'],
      ['rhodes','The Rhodes Scholar Pipeline'],
      ['ngo','NGO Soft Power — Regime Change in Plain Sight'],
      ['panama','Panama Papers — The Offshore Architecture'],
      ['think-tanks','Think Tank Capture — Laundering Policy'],
      ['private-islands','Private Island Meetings'],
    ],
    sections: [
      { id:'wef', heading:'The WEF — Decisions Made in Davos',
        body:`<p>The World Economic Forum's annual Davos meeting brings together approximately 3,000 of the world's most powerful political and corporate figures for closed bilateral meetings that constitute Davos's actual function: the coordination of global policy between heads of government, central bank governors, and corporate executives whose decisions collectively affect every human alive. Klaus Schwab, the WEF's founder, has openly described his Young Global Leaders programme — through which the WEF trains and advances politicians, civil servants, and executives in WEF-aligned thinking — as "penetrating governments." Alumni include Justin Trudeau, Emmanuel Macron, Jacinda Ardern, Angela Merkel, Tony Blair, and hundreds of current senior officials across 100+ nations.</p>` },
      { id:'rhodes', heading:'The Rhodes Scholar Pipeline',
        body:`<p>The Rhodes Scholarship — founded by Cecil Rhodes in 1902 — selects approximately 100 scholars annually to study at Oxford. The explicit purpose, stated in Rhodes's will, was to train a class of leaders who would work toward the establishment of a world government under Anglo-American dominance. Alumni include Bill Clinton, Strobe Talbott (Deputy Secretary of State, architect of NATO expansion), Susan Rice (National Security Advisor), Pete Buttigieg, and hundreds of senior politicians, intelligence officials, and policy-makers across Western nations. Rhodes's will specified the scholarship's purpose was to cultivate "the extension of British rule throughout the world." The ideological content of the programme has updated; the goal has not.</p>` },
      { id:'ngo', heading:'NGO Soft Power — Regime Change in Plain Sight',
        body:`<p>The National Endowment for Democracy — funded by the US Congress — was created in 1983 to do openly what the CIA had previously done covertly: fund civil society organisations, political parties, and media outlets in foreign countries to advance US foreign policy interests. NED-funded organisations were active in Ukraine before the 2014 Maidan revolution. The US government confirmed $5 billion in "democracy support" funding to Ukraine in the decade before 2014. The Colour Revolutions — Rose Revolution Georgia 2003, Orange Revolution Ukraine 2004, Tulip Revolution Kyrgyzstan 2005, the Arab Spring 2010–12 — all followed the same model: external funding of civil society NGOs, media training, protest infrastructure, and post-revolution governments with policy alignment to US and globalist interests regardless of popular mandate.</p>` },
      { id:'panama', heading:'Panama Papers — The Offshore Architecture',
        body:`<p>The 2016 Panama Papers leak from Mossack Fonseca revealed 11.5 million documents detailing offshore financial structures of approximately 215,000 entities across 200 countries. Among those named: 140 politicians including 12 sitting heads of state, 29 billionaires in the Forbes 400, and representatives of sanctioned countries including North Korea, Russia, and Syria. Over $10 trillion in private wealth is held offshore in jurisdictions with banking secrecy laws that prevent taxation, legal accountability, and transparency. The offshore system is not a loophole. It was designed by the same banking and legal infrastructure whose architects rotate between government regulatory positions and the financial institutions they regulate.</p>` },
      { id:'think-tanks', heading:'Think Tank Capture — Laundering Policy',
        body:`<p>Policy in modern Western democracies is not made in parliaments. It is made in think tanks — the Council on Foreign Relations, Rand Corporation, Brookings Institution, Atlantic Council, Heritage Foundation, Chatham House — and presented to legislatures as "independent research" by "experts." The funding behind these institutions is not independent: major foundations funding Western think tanks include Rockefeller, Carnegie, Open Society (Soros), Gates, MacArthur, and major financial institutions whose policy preferences the research consistently endorses. Think tanks produce the intellectual framework that makes inevitable what powerful funders have already decided.</p>` },
      { id:'private-islands', heading:'Private Island Meetings — The Unrecorded Gatherings',
        body:`<p>Jeffrey Epstein's private island Little Saint James, the Bohemian Grove, Bilderberg hotels, and the private estates of the Rothschild, Rockefeller, and Soros families serve a common function: spaces where the world's most surveilled individuals can meet with no cameras, no records, no press, and no oversight. Every researcher who has attempted to fill the gap between what can be documented and what occurred in these spaces has faced the same experience: sources retract, evidence disappears, careers end, and in a statistically anomalous number of cases, individuals involved in investigating these networks die under circumstances classified as accidental or suicidal.</p>` },
    ]
  },

  {
    file: 'internet-control.html',
    chNum: 17,
    title: 'The Internet as a Weapon',
    titleRaw: 'INTERNET CONTROL',
    subtitle: 'The most powerful information distribution system in history was handed to the people for approximately fifteen years, then systematically re-conquered.',
    desc: 'Cicada 3301, Dead Internet Theory, Google election manipulation, the memory-holing infrastructure, Elsagate, and AI trained to steer opinion.',
    toc: [
      ['cicada','Cicada 3301 — The Impossible Puzzle'],
      ['dead-internet','Dead Internet Theory — Most of It Is Bots'],
      ['google','Search Engine Suppression — What Google Buries'],
      ['memory-hole','Memory-Holing — The Systematic Deletion Record'],
      ['elsagate','Elsagate — Algorithmic Trauma at Scale'],
      ['max-headroom','The Max Headroom Signal Intrusion — Still Unsolved'],
      ['ai-manipulation','AI Narrative Manipulation — The New Mockingbird'],
    ],
    sections: [
      { id:'cicada', heading:'Cicada 3301 — The Impossible Puzzle',
        body:`<p>On January 4, 2012, a post appeared on 4chan: "Hello. We are looking for highly intelligent individuals. To find them, we have devised a test." What followed was the most sophisticated puzzle ever placed on the internet — a multi-layer sequence requiring expertise in cryptography, steganography, number theory, ancient languages, medieval literature, philosophy, and on-the-ground action across multiple continents. The puzzle ran for three years across 2012, 2013, and 2014. Its solutions required decoding messages hidden in image files, decrypting text with ancient and custom prime-number ciphers, and collecting QR codes from physical locations in Warsaw, Paris, Seoul, Sydney, and Dallas simultaneously. No organisation has claimed responsibility. Researchers who have studied the puzzle structure consistently conclude it required government-level resources. What they were recruiting for has never been disclosed.</p>` },
      { id:'dead-internet', heading:'Dead Internet Theory — Most of It Is Bots',
        body:`<p>The Dead Internet Theory proposes that the majority of internet traffic, content, and apparent human interaction since approximately 2016–2017 has been generated by artificial intelligence and bot networks operated by a combination of US government agencies and major platform operators. Evidence cited: the documented existence of DARPA's Social Media in Strategic Communication (SMISC) programme, designed to "understand and counteract" social media narratives through automated account networks; Persona Management Software developed by HBGary Federal for the US Air Force, capable of operating hundreds of fake identity networks simultaneously; and the measurable decline in genuine human-to-human discovery and discourse since 2016. If most of the internet is a controlled environment populated largely by AI-driven content, the implications for political discourse and collective reality are total.</p>` },
      { id:'google', heading:'Search Engine Suppression — What Google Buries',
        body:`<p>Google's search algorithm returns results for approximately 167 billion searches per month. Research by investigative journalist Robert Epstein found that shifts in Google's search rankings could shift political preferences in undecided voters by 20–80% without the voters being aware of any influence. In his 2020 testimony before the Senate Judiciary Committee, Epstein stated that Google's influence on election outcomes represents "the largest manipulation of public opinion in human history." In-Q-Tel — the CIA's venture capital arm — was an early investor in Google. The individuals who founded and control the major search and social platforms attended the same universities, sit on the same boards, and receive the same government contract funding as the intelligence community organisations they are supposed to be independent of.</p>` },
      { id:'memory-hole', heading:'Memory-Holing — The Systematic Deletion Record',
        body:`<p>The internet was supposed to be permanent. In practice, significant amounts of politically inconvenient content are systematically removed. The process: a piece of content surfaces that threatens a narrative the controlling institutions wish to maintain. Within hours: major platforms remove or deboost the content; fact-checking organisations publish "debunks" pre-loaded with counter-messaging; Wikipedia's article is edited to include the fact-checkers' framing; search results de-index the original source; the Wayback Machine's archive is edited or removed. Content about the CIA's drug trafficking history, the Epstein client list, and certain vaccine adverse event studies has been systematically removed from the accessible web.</p>` },
      { id:'elsagate', heading:'Elsagate — Algorithmic Trauma at Scale',
        body:`<p>Between approximately 2015 and 2017, YouTube's recommendation algorithm systematically served young children content — using popular characters like Spiderman, Elsa, and Mickey Mouse — that contained increasingly disturbing themes: injections, imprisonment, extreme body transformation, and violence. This content was algorithmically promoted because it generated extremely high watch time from children aged 3–8. The "Elsagate" investigation documented hundreds of channels producing this content at industrial scale. No production source was ever identified. No individual was ever prosecuted. YouTube removed the content after public pressure in November 2017, but the algorithmic mechanisms that promoted it were never fully explained.</p>` },
      { id:'max-headroom', heading:'The Max Headroom Signal Intrusion — Still Unsolved',
        body:`<p>On November 22, 1987, at 9:14 PM Chicago time, someone hijacked the WGN-TV broadcast signal during its news programme with a 25-second video of a person wearing a Max Headroom mask, standing against a corrugated metal background. At 11:15 PM the same night, the same person hijacked WTTW's broadcast of <em>Doctor Who</em> for 90 seconds. The FCC and FBI both investigated. No individual was ever identified. The technology required to hijack two separate broadcast signals in a single evening requires capabilities that should have been easily traced in 1987. Researchers conclude the intrusion required either very well-funded private actors or assistance from someone with institutional access to broadcast infrastructure. The case remains officially open.</p>` },
      { id:'ai-manipulation', heading:'AI Narrative Manipulation — The New Mockingbird',
        body:`<p>Large language models are trained on curated datasets, with curation decisions made by organisations with documented relationships to government intelligence programmes. The training process embeds specific epistemic biases: certain questions are framed as "settled," certain historical events are described using official language, certain individuals are framed using neutral language while others are framed as dangerous. As AI systems become the primary interface through which people consume information, the biases embedded in their training become the limits of publicly accessible truth. This is not a theoretical concern — it is the operational reality of the most powerful information mediation system ever built.</p>` },
    ]
  },

  {
    file: 'mandela-effect.html',
    chNum: 18,
    title: 'The Mandela Effect & Reality Engineering',
    titleRaw: 'THE MANDELA EFFECT',
    subtitle: 'Millions of people remember things that, according to all available physical evidence, never happened. This is either the largest mass cognitive failure in history — or evidence that the past is not as fixed as we have been told.',
    desc: 'The Berenstain Bears, Fruit of the Loom cornucopia, C-3PO\'s silver leg, New Zealand\'s position, and the three theories for what the Mandela Effect actually is.',
    toc: [
      ['what-is','What Is the Mandela Effect?'],
      ['berenstain','The Berenstain Bears — The Defining Case'],
      ['fruit-loom','The Fruit of the Loom Cornucopia'],
      ['apollo-13','The Apollo 13 Quote'],
      ['c3po','C-3PO\'s Silver Leg'],
      ['new-zealand','New Zealand\'s Position'],
      ['theories','Theories — What Could Cause This?'],
    ],
    sections: [
      { id:'what-is', heading:'What Is the Mandela Effect?',
        body:`<p>The term was coined by Fiona Broome in 2009, who discovered that she — along with thousands of others — clearly remembered Nelson Mandela dying in prison in the 1980s. He did not die until 2013. The phenomenon describes consistent mass memories of events that official records indicate never occurred, shared by large numbers of independently surveyed people who have never communicated with each other about the memory. The conventional psychological explanation — confabulation, social contagion — accounts for isolated false memories but does not explain cases where thousands of people independently recall specific details of events that do not exist in any archive, document, or physical record.</p>` },
      { id:'berenstain', heading:'The Berenstain Bears — The Defining Case',
        body:`<p>The children's book series created by Stan and Jan Berenstain was published from 1962 to 2012. Its name is Berenstain — spelled with an "a," not an "e." Surveys consistently find that approximately 60% of adults who grew up reading the books remember them as "Berenstein" — with an "e." This includes people who have the books on their shelves and can observe the current spelling while simultaneously remembering the "Berenstein" spelling. What is anomalous is not that people misremember a name — this is ordinary cognitive behaviour. What is anomalous is that thousands of people misremember it in exactly the same way, independently, when the alternative spelling has no phonetic or visual logic to recommend it.</p>` },
      { id:'fruit-loom', heading:'The Fruit of the Loom Cornucopia',
        body:`<p>Thousands of people clearly remember the Fruit of the Loom logo as featuring a cornucopia — a wicker horn-of-plenty from which the fruits spill. Fruit of the Loom has stated explicitly that no version of their logo has ever featured a cornucopia. Archives of decades of their advertising confirm this. Yet the memory is consistent, detailed, and widespread — including among people who worked in advertising and had professional reasons to know the logo accurately. This is not a case of vague misremembering. It is a specific, detailed, internally consistent memory of a visual element that never existed in any available record.</p>` },
      { id:'apollo-13', heading:'The Apollo 13 Quote — Problem Shifting',
        body:`<p>The famous quote from the Apollo 13 mission is remembered by the vast majority of people as "Houston, we have a problem." The actual transcript reads: "Houston, we've had a problem." The difference — present tense versus past tense — changes the meaning. The 1995 Ron Howard film used the present tense in its dramatisation, which is the most common explanation offered. However, surveys of people who clearly remember the phrase as "have a problem" include many who had not seen the film. The quote exists in popular culture in the "incorrect" form in references predating the 1995 film.</p>` },
      { id:'c3po', heading:'C-3PO\'s Silver Leg — Detail Accuracy as Evidence',
        body:`<p>C-3PO from <em>Star Wars</em> is universally remembered as being entirely gold. In the original trilogy, C-3PO has an entirely silver lower right leg — visible in multiple scenes. People who confidently assert C-3PO has always been all-gold, and then are shown the silver leg on screen, frequently report genuine cognitive dissonance — the feeling of watching a detail that contradicts a memory they are certain is accurate. This is not the psychological signature of ordinary confabulation, which typically resolves easily when correct information is provided. It is the signature of a memory that the brain registers as incompatible with present sensory input.</p>` },
      { id:'new-zealand', heading:'New Zealand\'s Position',
        body:`<p>A significant percentage of Australians and New Zealanders surveyed remember New Zealand as being positioned to the northeast of Australia. On current maps it is positioned to the southeast. This is not a case of vague geographical uncertainty — New Zealand's position is a significant navigational and geographical fact for residents of the region. When people who have lived their entire lives within sight of the Cook Strait consistently misplace their own country's position, "confabulation" becomes an insufficient explanation.</p>` },
      { id:'theories', heading:'Theories — What Could Cause This?',
        body:`<p>Three frameworks exist. The <strong>conventional psychological explanation</strong> — mass confabulation driven by social contagion — is the officially endorsed position. It explains individual and small-group cases adequately; it struggles with the scale, specificity, and independence of larger cases. The <strong>quantum mechanics framework</strong> proposes that quantum decoherence or many-worlds interpretation effects could, in principle, produce populations with genuine memories of divergent past states. This is speculative physics applied to an observed phenomenon. The <strong>directed reality manipulation framework</strong> — the most disturbing interpretation — proposes that technology developed under classified programmes is being used to selectively modify historical record in ways that are not fully consistent across all accessible memory. Under this framework, the Mandela Effect is not a cognitive error — it is evidence of tampering.</p>` },
    ]
  },

  {
    file: 'forensic-mysteries.html',
    chNum: 19,
    title: 'Forensic Mysteries & Intelligence Deaths',
    titleRaw: 'FORENSIC MYSTERIES',
    subtitle: 'Some deaths are investigated until they are solved. Others are investigated until they are closed. The difference tells you everything about what was at stake.',
    desc: 'The Isdal Woman, the Somerton Man, the Lead Masks Case, the Dyatlov Pass incident, and the statistical pattern of convenient deaths among witnesses and whistleblowers.',
    toc: [
      ['isdal','The Isdal Woman — Europe\'s Most Documented Unknown'],
      ['somerton','The Somerton Man — The Tamam Shud Case'],
      ['lead-masks','Lead Masks Case — Brazil, 1966'],
      ['dyatlov','The Dyatlov Pass Incident — 9 Dead, Still Classified'],
      ['convenient-deaths','The Pattern of Convenient Deaths'],
    ],
    sections: [
      { id:'isdal', heading:'The Isdal Woman — Europe\'s Most Documented Unknown',
        body:`<p>On November 29, 1970, a hiker in the Isdalen valley near Bergen, Norway, discovered a woman's body lying in a burnt area surrounded by personal effects. The woman had been partially incinerated, her face beaten, and traces of 50 sleeping pills and carbon monoxide found in her system. Her belongings had been deliberately stripped of all identifying marks: labels cut from clothing, serial numbers filed off items. The suitcases she had left at Bergen railway station contained a code written on paper which, when deciphered, appeared to be a travel itinerary in cipher. Witnesses described her speaking multiple European languages fluently, using multiple identities, and behaving in ways consistent with professional intelligence tradecraft. Norwegian police investigated for two years and classified the case "death by persons unknown." In 2017, DNA analysis confirmed she was of Central European genetic origin. Her identity has never been established.</p>` },
      { id:'somerton', heading:'The Somerton Man — The Tamam Shud Case',
        body:`<p>On December 1, 1948, an impeccably dressed, unidentified man was found dead on Somerton Beach, Adelaide, Australia. He carried no identification, and all labels had been removed from his clothing. In the fob pocket of his trousers, investigators found a scrap of paper with the words "Tamam Shud" — a phrase from Omar Khayyam's <em>Rubaiyat</em> meaning "it is finished." The paper had been torn from a rare edition found in an unlocked car nearby. Inside the book's back cover was a telephone number — belonging to a nurse who denied knowing the man — and a code that remains unbroken despite analysis by GCHQ, the CIA, and international cryptographers over 74 years. An autopsy found no identifiable cause of death. DNA testing in 2022 established he was of mixed Scandinavian and Iberian ancestry with a genetic relative in the United States who has not been publicly identified.</p>` },
      { id:'lead-masks', heading:'Lead Masks Case — Brazil, 1966',
        body:`<p>On August 20, 1966, two electronic technicians — Manoel Pereira da Cruz and Miguel José Viana — were found dead on a hilltop near Niterói, Brazil. They wore formal suits, lead eye masks of the type used to filter radiation, and waterproof coats. A notebook found nearby contained the instructions: "16:30 be at agreed place" and "18:30 take capsule after effect." No capsules were found. No cause of death was established — their internal organs showed no toxicological cause, but severe decomposition prevented full analysis. The lead masks suggest preparation for encountering an electromagnetic or radioactive field. Their prior movements showed they had travelled to an electronics store, purchased water and a raincoat, and been seen in apparent good health before ascending the hill. The case remains open and unexplained.</p>` },
      { id:'dyatlov', heading:'The Dyatlov Pass Incident — 9 Dead, Still Classified',
        body:`<p>In February 1959, nine experienced hikers died on the eastern slope of Dead Mountain (Kholat Syakhl) in the Ural Mountains. The tent had been cut open from the inside. The hikers had fled into −30°C temperatures in their sleeping clothes — no boots, no coats. Three had fatal internal injuries: fractured skulls and broken ribs consistent with the force of a car crash, with no external wounds. One was missing her tongue, eyes, and parts of her lips. Two bodies were found with traces of radiation. Their skin and hair had turned orange. The Soviet investigation attributed the deaths to "a compelling natural force." The case was classified for 30 years. In 2021, Russia officially re-opened the investigation and then re-classified it. No explanation is universally accepted.</p>` },
      { id:'convenient-deaths', heading:'The Pattern of Convenient Deaths',
        body:`<p>The mortality rate among witnesses, whistleblowers, and investigators into specific subjects is statistically anomalous. The 84 witnesses who died before or shortly after the House Select Committee on Assassinations concluded its JFK investigation in 1979 — whose actuarial probability was calculated at approximately 1 in 100,000 trillion. The 17 journalists investigating the Mena, Arkansas drug operation who died between 1990 and 1994. The six holistic doctors who died within a 90-day period in 2015, all having worked on GcMAF research. The 52 bankers who died under unusual circumstances between 2013 and 2014 — most ruled suicides. At some point, the null hypothesis — that these clusters represent unrelated natural deaths — becomes statistically indefensible.</p><div class="classified-stamp">CASE OPEN</div>` },
    ]
  },

  {
    file: 'secret-science.html',
    chNum: 20,
    title: 'Secret Science & the Physics They Buried',
    titleRaw: 'SECRET SCIENCE',
    subtitle: 'The official limits of human knowledge are not the limits of what has been discovered. They are the limits of what you have been permitted to know.',
    desc: 'Cold fusion confirmed then suppressed, the Hutchison Effect, the Biefeld-Brown electrogravitic lift, US Navy Salvatore Pais patents, and the Global Consciousness Project.',
    toc: [
      ['cold-fusion','Cold Fusion — Confirmed, Then Suppressed'],
      ['hutchison','The Hutchison Effect — Disassembly of Matter'],
      ['biefeld-brown','The Biefeld-Brown Effect — Electrogravitic Lift'],
      ['pais-patents','The Salvatore Pais Patent Cluster'],
      ['kozyrev','Kozyrev Mirrors — Russian Consciousness Research'],
      ['morphic','Morphic Resonance — The Memory of the Universe'],
      ['gcp','The Global Consciousness Project'],
    ],
    sections: [
      { id:'cold-fusion', heading:'Cold Fusion — Confirmed, Then Suppressed',
        body:`<p>In March 1989, electrochemists Stanley Pons and Martin Fleischmann announced nuclear fusion reactions at room temperature in a palladium electrolytic cell. The announcement was met with furious scepticism from the hot fusion research community — which had invested decades and billions in tokamak reactors. The replication crisis that followed was, researchers have subsequently shown, partly manufactured: laboratories attempting replication used incorrect protocols specifically designed to fail. Over 3,000 peer-reviewed papers on Low Energy Nuclear Reactions (LENR) have been published since 1989. The US Navy's Space and Naval Warfare Systems Center confirmed reproducible excess heat effects in 2002. NASA, Italy's INFN, and Mitsubishi Heavy Industries have all published positive LENR research. The technology receives no mainstream funding because it threatens the entire energy industry's economic model.</p>` },
      { id:'hutchison', heading:'The Hutchison Effect — Disassembly of Matter',
        body:`<p>Canadian inventor John Hutchison, working with Tesla coil arrays beginning in the late 1970s, documented phenomena that occur when multiple overlapping electromagnetic fields interact in specific configurations: metal samples levitating spontaneously, dissimilar materials fusing (wood embedding into steel without burning), metal objects bending without applied mechanical force, and materials temporarily jellifying. These phenomena were filmed, witnessed by Canadian and US military personnel, and the sample materials examined by metallurgists who confirmed anomalous structural changes. The Pentagon and British Ministry of Defence separately sent researchers to examine Hutchison's work. Shortly after these visits, his laboratory was raided by Canadian Mounties and his equipment confiscated — four times. The official justification: illegal weapons components.</p>` },
      { id:'biefeld-brown', heading:'The Biefeld-Brown Effect — Electrogravitic Lift',
        body:`<p>Thomas Townsend Brown discovered in the 1920s that a sufficiently charged asymmetric capacitor generates thrust in the direction of the positive plate — lift that operates in a vacuum, without moving parts, and without conventional propellant. The effect was demonstrated to the US Navy in 1952: circular discs generating significant lift in a vacuum chamber. Brown's subsequent Project Winterhaven proposal in 1953 proposed electrogravitic drive systems for supersonic aircraft. The document was classified. All subsequent research on electrogravitics was classified by executive order. <em>Aviation Week</em> published multiple articles between 1955 and 1956 describing the major aerospace contractors' secret electrogravitic research programmes. These programmes then disappeared entirely from the public record.</p>` },
      { id:'pais-patents', heading:'The Salvatore Pais Patent Cluster',
        body:`<p>Between 2016 and 2019, inventor Salvatore Pais filed a series of patents assigned to the US Navy describing technologies that should not be possible under conventional physics: a "Hybrid Aerospace Underwater Craft" capable of hypersonic flight in air and water without sonic boom; a "High Frequency Gravitational Wave Generator"; a "Piezoelectricity-Induced Room Temperature Superconductor"; and an "Electromagnetic Field Generator." These were not filed by a private inventor — they were filed by a US Navy weapons engineer, assigned to the US Navy, and defended in correspondence with the US Patent Office by a Navy official who stated: "China is actively developing similar technology." These patents are public record. The physics they describe — room-temperature superconductivity, gravitational wave generation, electromagnetic propulsion beyond known science — are the technologies that researchers have been told are impossible for 50 years.</p>` },
      { id:'kozyrev', heading:'Kozyrev Mirrors — Russian Consciousness Research',
        body:`<p>Soviet astrophysicist Nikolai Kozyrev proposed in the 1950s that time has physical properties — density and flow — that can be measured and manipulated. Russian researchers built "Kozyrev mirrors" — curved aluminium surfaces designed to focus torsion fields — and conducted experiments placing subjects inside the focal point. Reported effects included visions of past or future events, apparent remote viewing with verifiable results, and anomalous psychological states. The Russian Academy of Sciences confirmed funding of this research through the 1990s. The Institute of Biophysics in Novosibirsk published peer-reviewed papers on torsion field effects in biological systems. This research does not exist in any Western physics curriculum.</p>` },
      { id:'morphic', heading:'Morphic Resonance — The Memory of the Universe',
        body:`<p>Cambridge-trained biologist Rupert Sheldrake proposed in his 1981 book <em>A New Science of Life</em> that biological form is governed not primarily by DNA but by "morphogenetic fields" — non-material structures carrying information from previous similar organisms across time and space. Evidence: rats that learn a maze in Harvard run the same maze faster in laboratories in Edinburgh without any genetic transmission; crystals of new chemical compounds form progressively more easily worldwide regardless of technique transfer. In 2013, Sheldrake presented a TED talk summarising his evidence. TED removed the talk within days — the only talk in TED's history to be removed by editorial decision — following a letter of complaint from a committee including board members with pharmaceutical and biotech industry ties.</p>` },
      { id:'gcp', heading:'The Global Consciousness Project',
        body:`<p>Since 1998, the Global Consciousness Project — based at Princeton University — has operated a network of 70 Random Event Generators (REGs) distributed globally. These devices produce truly random numbers based on quantum noise. The research question: does large-scale human emotional coherence affect quantum randomness? The finding: yes. When millions of people simultaneously direct attention to the same event — the September 11 attacks, New Year's Eve countdowns, Olympic opening ceremonies — the REG network records statistically significant deviations from randomness. After 25+ years of continuous data, the probability of the aggregate deviation occurring by chance is less than one in a trillion. The implication: collective human consciousness exerts a measurable influence on physical reality at the quantum level.</p>
        <blockquote>"The day science begins to study non-physical phenomena, it will make more progress in one decade than in all the previous centuries of its existence." <strong>— Nikola Tesla</strong></blockquote>
        <div class="classified-stamp">END OF ARCHIVE</div>` },
    ]
  },
];

// Generate all pages
CHAPTERS.forEach(cfg => {
  const html = buildPage(cfg);
  fs.writeFileSync(cfg.file, html, 'utf8');
  console.log('Created ' + cfg.file);
});
console.log('\nAll 8 chapter pages generated.');
