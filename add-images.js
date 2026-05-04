/**
 * add-images.js
 * Inserts a <figure class="topic-image"> block into every topic page that
 * doesn't already have one.  Images are sourced exclusively from Wikimedia
 * Commons (public domain or Creative Commons licensed).
 *
 * Run: node add-images.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'topics', 'great-awakening');

// ─── Image catalogue ──────────────────────────────────────────────────────────
// Each entry: { file, url, alt, caption, licence, wikiUrl }
// All URLs are direct Wikimedia Commons thumb URLs (stable).
const IMAGES = {

  /* ── False Flags / Key Events ─────────────────────────────────────────── */
  '9-11-inside-job.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/National_Park_Service_9-11_Statue_of_Liberty_and_WTC_fire.jpg/960px-National_Park_Service_9-11_Statue_of_Liberty_and_WTC_fire.jpg',
    alt: 'World Trade Center towers burning on September 11, 2001, with Statue of Liberty in foreground',
    caption: 'The World Trade Center North and South Towers burning on the morning of September 11, 2001. Photograph taken from a US National Park Service boat. / US National Park Service (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:National_Park_Service_9-11_Statue_of_Liberty_and_WTC_fire.jpg',
  },
  'false-flags.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/USSLiberty1967.jpg/960px-USSLiberty1967.jpg',
    alt: 'USS Liberty (AGTR-5) after Israeli attack, 1967',
    caption: 'USS Liberty (AGTR-5) after being attacked in international waters during the 1967 Six-Day War. The attack killed 34 American crew members. The US government ruled it a case of mistaken identity; survivors and declassified NSA intercepts contradict this. / US Navy (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:USSLiberty1967.jpg',
  },
  'oklahoma-city-bombing.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Oklahoma_City_bombing_-_alternate_view.jpg/960px-Oklahoma_City_bombing_-_alternate_view.jpg',
    alt: 'Alfred P. Murrah Federal Building after the Oklahoma City bombing, April 19 1995',
    caption: 'The north face of the Alfred P. Murrah Federal Building following the April 19, 1995 bombing. 168 people were killed. / US Geological Survey (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Oklahoma_City_bombing_-_alternate_view.jpg',
  },
  'pearl-harbor-foreknowledge.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Dday_NAS_Kaneohe.jpg/960px-Dday_NAS_Kaneohe.jpg',
    alt: 'Burning aircraft at NAS Kaneohe Bay during the attack on Pearl Harbor, December 7 1941',
    caption: 'Aircraft burning at Naval Air Station Kaneohe Bay during the Japanese attack on Pearl Harbor, December 7, 1941. / US Navy (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Dday_NAS_Kaneohe.jpg',
  },
  'wtc7.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/FEMA_-_wtc_burning.jpg/960px-FEMA_-_wtc_burning.jpg',
    alt: 'World Trade Center 7 burning, September 11 2001',
    caption: 'World Trade Center 7 on fire on September 11, 2001. WTC7 collapsed into its own footprint at 5:20 PM despite not being struck by any aircraft. / FEMA (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:FEMA_-_wtc_burning.jpg',
  },
  'pentagon-missile.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Arlington_VA_USA_Pentagon_from_above.jpg/960px-Arlington_VA_USA_Pentagon_from_above.jpg',
    alt: 'The Pentagon, Arlington, Virginia, aerial view',
    caption: 'The Pentagon, Arlington, Virginia — US Department of Defense headquarters. The section struck on September 11, 2001 was the recently reinforced Wedge 1, containing the Office of the Comptroller. / US Air Force (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Arlington_VA_USA_Pentagon_from_above.jpg',
  },
  'sandy-hook.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sandy_Hook_Elementary_School.jpg/960px-Sandy_Hook_Elementary_School.jpg',
    alt: 'Sandy Hook Elementary School, Newtown, Connecticut',
    caption: 'Sandy Hook Elementary School, Newtown, Connecticut, as it appeared before December 14, 2012. / Henryalien, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Sandy_Hook_Elementary_School.jpg',
  },
  'norway-spiral.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Norway-spiral-by-Jan-Petter-Jorgensen.jpg/800px-Norway-spiral-by-Jan-Petter-Jorgensen.jpg',
    alt: 'The Norway Spiral, photographed over Tromsø on December 9 2009',
    caption: 'The Norway Spiral photographed over Tromsø, Norway on December 9, 2009. The spiral was attributed by Russian authorities to a failed test of a Bulava SLBM. / Jan-Petter Jørgensen, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Norway-spiral-by-Jan-Petter-Jorgensen.jpg',
  },

  /* ── Secret Societies ─────────────────────────────────────────────────── */
  'illuminati.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Illuminati_triangle_eye.jpg/800px-Illuminati_triangle_eye.jpg',
    alt: 'Reverse side of the Great Seal of the United States showing the unfinished pyramid and All-Seeing Eye',
    caption: 'The reverse of the Great Seal of the United States (1782), featuring the Eye of Providence above an unfinished 13-step pyramid. The motto "Novus Ordo Seclorum" — New Order of the Ages — appears below. / US Government (public domain)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Illuminati_triangle_eye.jpg',
  },
  'freemasonry.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Masonic_Lodge_Room.jpg/960px-Masonic_Lodge_Room.jpg',
    alt: 'Interior of a Masonic lodge room showing checkerboard floor, altar, pillars and regalia',
    caption: 'Interior of a Masonic Lodge room showing the characteristic black-and-white checkerboard floor, twin pillars, the Volume of the Sacred Law on the altar, and the Square and Compasses. / This file is in the public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Masonic_Lodge_Room.jpg',
  },
  'bilderberg.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Bilderberg_meeting_1954.jpg/960px-Bilderberg_meeting_1954.jpg',
    alt: 'First Bilderberg Meeting, Hotel de Bilderberg, Oosterbeek, Netherlands, May 1954',
    caption: 'The first Bilderberg Group meeting at Hotel de Bilderberg, Oosterbeek, Netherlands, May 1954. Founded by Prince Bernhard of the Netherlands and Joseph Retinger, the meetings have been held annually without public minutes ever since. / Unknown author, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Bilderberg_meeting_1954.jpg',
  },
  'bohemian-grove.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Bohemian_Grove_Owl_-_Old_Guard.jpg/800px-Bohemian_Grove_Owl_-_Old_Guard.jpg',
    alt: 'Illustration of the 40-foot owl sculpture at Bohemian Grove, Monte Rio, California',
    caption: 'The Great Owl of Bohemia — the 40-foot concrete owl statue at Bohemian Grove, Monte Rio, California, before which the annual "Cremation of Care" ritual is performed. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Bohemian_Grove_Owl_-_Old_Guard.jpg',
  },
  'knights-templar.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/De_locis_ac_mirabilibus_mundi_Knights_Templar.jpg/800px-De_locis_ac_mirabilibus_mundi_Knights_Templar.jpg',
    alt: 'Medieval illuminated manuscript depicting Knights Templar in battle',
    caption: 'Knights Templar depicted in a medieval illuminated manuscript, c. 13th century. Founded 1119, the Templars became the first multinational banking institution before being suppressed by Philip IV of France in 1307. / Public domain (pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:De_locis_ac_mirabilibus_mundi_Knights_Templar.jpg',
  },
  'vatican-jesuits.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/St_Peter%27s_Square%2C_Vatican_City_-_April_2007.jpg/960px-St_Peter%27s_Square%2C_Vatican_City_-_April_2007.jpg',
    alt: "St. Peter's Square, Vatican City, aerial view",
    caption: "St. Peter's Square, Vatican City — the 340-metre elliptical piazza designed by Gian Lorenzo Bernini (1656–67). The central Egyptian obelisk, brought from Heliopolis, stands at the axis. / © David Iliff, CC BY-SA 3.0",
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:St_Peter%27s_Square,_Vatican_City_-_April_2007.jpg',
  },
  'committee-300.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Chatham_House%2C_London.jpg/960px-Chatham_House%2C_London.jpg',
    alt: 'Chatham House (Royal Institute of International Affairs), St James Square, London',
    caption: 'Chatham House (Royal Institute of International Affairs), 10 St James\'s Square, London — birthplace of the Chatham House Rule and a key node in the British elite policy network. / Ank Kumar, CC BY-SA 4.0',
    licence: 'CC BY-SA 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Chatham_House,_London.jpg',
  },
  'council-foreign-relations.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Harold_Pratt_House_CFR.jpg/800px-Harold_Pratt_House_CFR.jpg',
    alt: 'Harold Pratt House, headquarters of the Council on Foreign Relations, New York City',
    caption: 'Harold Pratt House, 58 East 68th Street, Manhattan — headquarters of the Council on Foreign Relations since 1945. / Beyond My Ken, CC BY-SA 4.0',
    licence: 'CC BY-SA 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Harold_Pratt_House_CFR.jpg',
  },
  'trilateral-commission.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Zbigniew_Brzezinski_2009.jpg/800px-Zbigniew_Brzezinski_2009.jpg',
    alt: 'Zbigniew Brzezinski, founder of the Trilateral Commission, 2009',
    caption: 'Zbigniew Brzezinski (1928–2017), National Security Advisor under President Carter and co-founder with David Rockefeller of the Trilateral Commission in 1973. / Janusz Gubernat, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Zbigniew_Brzezinski_2009.jpg',
  },

  /* ── Banking & Finance ────────────────────────────────────────────────── */
  'rothschilds.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Mayer_Amschel_Rothschild.jpg/640px-Mayer_Amschel_Rothschild.jpg',
    alt: 'Portrait of Mayer Amschel Rothschild, founder of the Rothschild banking dynasty, c.1780',
    caption: 'Mayer Amschel Rothschild (1744–1812), founder of the Rothschild banking dynasty in Frankfurt. His five sons established banking houses in London, Paris, Vienna, Naples, and Frankfurt. / Public domain (pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Mayer_Amschel_Rothschild.jpg',
  },
  'rockefellers.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/John_D._Rockefeller_1885.jpg/640px-John_D._Rockefeller_1885.jpg',
    alt: 'John D. Rockefeller, portrait c.1885',
    caption: 'John D. Rockefeller (1839–1937), founder of Standard Oil and architect of the modern petroleum industry. At his peak Rockefeller controlled approximately 90% of US oil refining capacity. / Public domain (pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:John_D._Rockefeller_1885.jpg',
  },
  'bis.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/BIS_headquarters_Basel_Switzerland.jpg/960px-BIS_headquarters_Basel_Switzerland.jpg',
    alt: 'Bank for International Settlements headquarters, Basel, Switzerland',
    caption: 'The Bank for International Settlements (BIS) tower, Basel, Switzerland. The 19-storey cylindrical skyscraper, completed 1977, houses the central bank of central banks. / © Wladyslaw Sojka, CC BY 3.0',
    licence: 'CC BY 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:BIS_headquarters_Basel_Switzerland.jpg',
  },
  'great-reset.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/WEF_Logo_White.png/800px-WEF_Logo_White.png',
    alt: 'World Economic Forum logo',
    caption: 'World Economic Forum — the Davos-based organisation whose 2020 "Great Reset" agenda called for a fundamental restructuring of economies worldwide in the wake of COVID-19. / World Economic Forum, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:WEF_Logo_White.png',
  },
  'wef-schwab.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Klaus_Schwab_2008.jpg/640px-Klaus_Schwab_2008.jpg',
    alt: 'Klaus Schwab, founder and executive chairman of the World Economic Forum',
    caption: 'Klaus Schwab (b. 1938), founder and Executive Chairman of the World Economic Forum, Davos, Switzerland. Author of "The Fourth Industrial Revolution" (2016) and "COVID-19: The Great Reset" (2020). / Remy Steinegger, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Klaus_Schwab_2008.jpg',
  },
  'petrodollar.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Oil_well_at_night.jpg/960px-Oil_well_at_night.jpg',
    alt: 'Oil well at night, United States',
    caption: 'An oil well in the United States. The petrodollar system — established via US-Saudi agreements in 1974 — requires that global oil trades be denominated in US dollars, creating structural global demand for the dollar. / US Department of Energy (public domain)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Oil_well_at_night.jpg',
  },
  'cbdc.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBDC_infographic_BIS.png/960px-CBDC_infographic_BIS.png',
    alt: 'Bank for International Settlements infographic on Central Bank Digital Currencies',
    caption: 'Bank for International Settlements (BIS) infographic illustrating the two-tier Central Bank Digital Currency (CBDC) architecture. CBDCs are programmable currencies that can have expiry dates, spending restrictions, and geo-fencing applied. / BIS, CC BY 4.0',
    licence: 'CC BY 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:CBDC_infographic_BIS.png',
  },
  'nesara-gesara.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Gold_bullion_bars.jpg/960px-Gold_bullion_bars.jpg',
    alt: 'Gold bullion bars, US Mint',
    caption: 'Gold bullion bars at a US Mint facility. NESARA/GESARA proponents claim that a secret gold-backed monetary system is held in reserve to replace the current fiat debt system at a future "Great Reset" moment. / US Mint (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Gold_bullion_bars.jpg',
  },
  'george-soros.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/George_Soros_-_World_Economic_Forum_Annual_Meeting_Davos_2011.jpg/640px-George_Soros_-_World_Economic_Forum_Annual_Meeting_Davos_2011.jpg',
    alt: 'George Soros at the World Economic Forum Annual Meeting, Davos, 2011',
    caption: 'George Soros (b. 1930) at the World Economic Forum Annual Meeting, Davos, January 2011. Soros made £1 billion shorting the British pound on "Black Wednesday" (September 16, 1992). / World Economic Forum, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:George_Soros_-_World_Economic_Forum_Annual_Meeting_Davos_2011.jpg',
  },
  'blackrock-vanguard.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/BlackRock_headquarters_NYC.jpg/960px-BlackRock_headquarters_NYC.jpg',
    alt: 'BlackRock headquarters, 55 East 52nd Street, New York City',
    caption: 'BlackRock headquarters at 55 East 52nd Street (Park Avenue Tower), Manhattan. As of 2026, BlackRock manages approximately $10 trillion in assets under management — more than the GDP of Japan. / Beyond My Ken, CC BY-SA 4.0',
    licence: 'CC BY-SA 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:BlackRock_headquarters_NYC.jpg',
  },

  /* ── Deep State / Operations ──────────────────────────────────────────── */
  'mkultra.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Project_MKULTRA%2C_Subproject_68.jpg/800px-Project_MKULTRA%2C_Subproject_68.jpg',
    alt: 'Declassified CIA MKUltra document, Subproject 68',
    caption: 'Declassified CIA document: "MKUltra, Subproject 68" — one of approximately 20,000 documents recovered from a CIA financial records building during the 1977 Church Committee investigation after Director Richard Helms had ordered the bulk of MKUltra files destroyed in 1973. / CIA (US government work, public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Project_MKULTRA,_Subproject_68.jpg',
  },
  'operation-paperclip.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Operation_Paperclip_scientists.jpg/960px-Operation_Paperclip_scientists.jpg',
    alt: 'Operation Paperclip German scientists at Fort Bliss, Texas, 1946',
    caption: 'Operation Paperclip scientists at Fort Bliss, Texas, 1946. The group includes Wernher von Braun (7th from left), who had been an SS-Sturmbannführer and used concentration camp slave labour at Mittelwerk. These scientists were cleared and employed by the US government to develop missile and space programs. / US Army (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Operation_Paperclip_scientists.jpg',
  },
  'operation-mockingbird.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Frank_Church.jpg/640px-Frank_Church.jpg',
    alt: 'Senator Frank Church, chairman of the Church Committee, 1975',
    caption: 'Senator Frank Church (D-Idaho), chairman of the Senate Select Committee to Study Governmental Operations with Respect to Intelligence Activities (Church Committee, 1975–76), which exposed Operation Mockingbird, COINTELPRO, and MKUltra. / US Senate (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Frank_Church.jpg',
  },
  'nsa-surveillance.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/National_Security_Agency_headquarters%2C_Fort_Meade%2C_Maryland.jpg/960px-National_Security_Agency_headquarters%2C_Fort_Meade%2C_Maryland.jpg',
    alt: 'NSA headquarters, Fort Meade, Maryland',
    caption: 'National Security Agency (NSA) headquarters, Fort Meade, Maryland. The NSA was created by a secret presidential memorandum in 1952 — it was not established by Congress. Its existence was not publicly confirmed until 1975. / US Government (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:National_Security_Agency_headquarters,_Fort_Meade,_Maryland.jpg',
  },
  'cia-operations.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/CIA_seal_new.png/800px-CIA_seal_new.png',
    alt: 'Central Intelligence Agency seal',
    caption: 'Central Intelligence Agency (CIA) seal. The CIA was established by the National Security Act of 1947. By its own declassified records, it has conducted coups in Iran (1953), Guatemala (1954), Chile (1973), and many others. / CIA (US government work, public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:CIA_seal_new.png',
  },
  'shadow-government.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Raven_Rock_Mountain_Complex_entrance.jpg/960px-Raven_Rock_Mountain_Complex_entrance.jpg',
    alt: 'Raven Rock Mountain Complex (Site R) entrance, Adams County, Pennsylvania',
    caption: 'Raven Rock Mountain Complex (Site R), Adams County, Pennsylvania — the alternate Pentagon. The underground facility, built under 650 feet of granite, is one of the key nodes of the Continuity of Government (COG) infrastructure. / US Government (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Raven_Rock_Mountain_Complex_entrance.jpg',
  },
  'five-eyes.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/GCHQ-panoramic.jpg/960px-GCHQ-panoramic.jpg',
    alt: 'GCHQ (Government Communications Headquarters), Cheltenham, UK, aerial view',
    caption: 'GCHQ "the Doughnut" — Government Communications Headquarters, Cheltenham, UK. GCHQ is the UK partner in the Five Eyes (FVEY) signals intelligence alliance alongside the NSA (US), CSE (Canada), ASD (Australia), and GCSB (New Zealand). / Contains public sector information licensed under the Open Government Licence v1.0',
    licence: 'OGL v1.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:GCHQ-panoramic.jpg',
  },
  'snowden-assange.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Edward_Snowden_2013-10-9_%28cropped%29.jpg/640px-Edward_Snowden_2013-10-9_%28cropped%29.jpg',
    alt: 'Edward Snowden, 2013',
    caption: 'Edward Snowden (b. 1983), former NSA contractor and CIA employee, photographed in Moscow in October 2013 after leaking classified NSA surveillance programmes to journalists Glenn Greenwald, Laura Poitras, and others. / Laura Poitras / Praxis Films, CC BY 3.0',
    licence: 'CC BY 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Edward_Snowden_2013-10-9_(cropped).jpg',
  },
  'cointelpro.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/FBI-COINTELPRO-Ghetto_Informant_Program.jpg/800px-FBI-COINTELPRO-Ghetto_Informant_Program.jpg',
    alt: 'Declassified FBI COINTELPRO document',
    caption: 'Declassified FBI memorandum from COINTELPRO operations. COINTELPRO (Counter Intelligence Program) ran from 1956 to 1971, targeting civil rights leaders, anti-war activists, and political organisations through infiltration, psychological warfare, and extralegal violence. / FBI (US government work, public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:FBI-COINTELPRO-Ghetto_Informant_Program.jpg',
  },
  'operation-northwoods.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Operation_Northwoods.jpg/640px-Operation_Northwoods.jpg',
    alt: 'Cover page of the declassified Operation Northwoods document, 1962',
    caption: 'Cover page of the declassified Operation Northwoods memorandum (1962), signed by the Joint Chiefs of Staff and submitted to Secretary of Defense Robert McNamara. The document proposed staging false-flag terror attacks against American citizens to justify war with Cuba. President Kennedy refused to approve it. / US Government (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Operation_Northwoods.jpg',
  },

  /* ── Health & Big Pharma ─────────────────────────────────────────────── */
  'big-pharma.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Pfizer_headquarters_New_York.jpg/960px-Pfizer_headquarters_New_York.jpg',
    alt: 'Pfizer global headquarters, 235 East 42nd Street, New York City',
    caption: 'Pfizer global headquarters, 235 East 42nd Street, Midtown Manhattan. Pfizer is the world\'s largest pharmaceutical company by revenue. In 2021, Pfizer recorded $81 billion in revenue — the highest single-year revenue in pharmaceutical history. / Ajay Suresh, CC BY 2.0',
    licence: 'CC BY 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Pfizer_headquarters_New_York.jpg',
  },
  'fluoride-poison.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Water_fluoridation_by_country.svg/960px-Water_fluoridation_by_country.svg.png',
    alt: 'World map showing water fluoridation by country',
    caption: 'Global water fluoridation status by country, 2020. The United States has the highest percentage of fluoridated water of any country in the world. Most of Western Europe has rejected artificial fluoridation. / Wikimedia Commons, CC BY-SA 4.0',
    licence: 'CC BY-SA 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Water_fluoridation_by_country.svg',
  },
  'adrenochrome.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Adrenochrome.svg/640px-Adrenochrome.svg.png',
    alt: 'Molecular structure of adrenochrome (C9H9NO3)',
    caption: 'Molecular structure of adrenochrome (C₉H₉NO₃), an oxidation product of adrenaline. Adrenochrome can be produced synthetically and has been studied as a potential psychotomimetic agent since the 1950s. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Adrenochrome.svg',
  },
  'covid-plandemic.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/3D_medical_animation_coronavirus_structure.jpg/960px-3D_medical_animation_coronavirus_structure.jpg',
    alt: '3D medical animation of SARS-CoV-2 coronavirus structure',
    caption: '3D medical animation rendering of the SARS-CoV-2 coronavirus structure, including spike proteins (S), envelope (E), membrane (M), and nucleocapsid (N) proteins. The Wuhan Institute of Virology conducted gain-of-function research on bat coronaviruses funded in part through NIH grants via EcoHealth Alliance. / Scientific Animations, CC BY-SA 4.0',
    licence: 'CC BY-SA 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:3D_medical_animation_coronavirus_structure.jpg',
  },
  'mrna-vaccines.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Lipid_nanoparticle_mRNA_vaccine.png/960px-Lipid_nanoparticle_mRNA_vaccine.png',
    alt: 'Diagram of lipid nanoparticle mRNA vaccine mechanism',
    caption: 'Diagram illustrating the lipid nanoparticle (LNP) delivery mechanism of mRNA vaccines. The mRNA sequence instructs ribosomes to produce spike protein. Unlike traditional vaccines, mRNA vaccines were authorised under Emergency Use Authorisation without completing standard Phase III clinical trials. / Wikimedia Commons, CC BY-SA 4.0',
    licence: 'CC BY-SA 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Lipid_nanoparticle_mRNA_vaccine.png',
  },
  'who-control.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/World_Health_Organization_headquarters.jpg/960px-World_Health_Organization_headquarters.jpg',
    alt: 'World Health Organization headquarters, Geneva, Switzerland',
    caption: 'World Health Organization (WHO) headquarters, Avenue Appia 20, Geneva, Switzerland. The Bill & Melinda Gates Foundation is the second-largest donor to the WHO (after the United States government), contributing approximately 12% of its total funding. / Diego Crossing, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:World_Health_Organization_headquarters.jpg',
  },
  'bill-gates.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bill_Gates_2017_cropped.jpg/640px-Bill_Gates_2017_cropped.jpg',
    alt: 'Bill Gates, 2017',
    caption: 'Bill Gates (b. 1955), co-founder of Microsoft and co-chair of the Bill & Melinda Gates Foundation. Through the Gates Foundation, Gates has become the largest private funder of global health initiatives and vaccine programmes. / Kjetil Ree, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Bill_Gates_2017_cropped.jpg',
  },
  'chemtrails.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Chemtrail_planes_grid.jpg/960px-Chemtrail_planes_grid.jpg',
    alt: 'Aircraft contrails forming a grid pattern over a city',
    caption: 'Persistent contrails forming a grid pattern over an urban area. The Harvard Solar Geoengineering Research Program (SCoPEx) — funded by Bill Gates — has proposed releasing calcium carbonate aerosols into the stratosphere to reflect sunlight. / Wikimedia Commons, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Chemtrail_planes_grid.jpg',
  },
  'haarp.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/HAARP_facility.jpg/960px-HAARP_facility.jpg',
    alt: 'HAARP facility antenna array, Gakona, Alaska',
    caption: 'The HAARP (High-frequency Active Auroral Research Program) antenna array, Gakona, Alaska. The facility uses 180 antennas to transmit up to 3.6 megawatts of radio frequency energy into the ionosphere. It was originally funded by DARPA, the US Air Force, and US Navy. / Michael Kleiman / US Air Force (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:HAARP_facility.jpg',
  },
  'weaponized-food.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Monsanto_cotton_field.jpg/960px-Monsanto_cotton_field.jpg',
    alt: 'Monsanto Bt cotton field',
    caption: 'A Monsanto Bt (Bacillus thuringiensis) genetically modified cotton field. Monsanto (now Bayer) holds patents on approximately 80% of commercially grown US corn and soy. / Scott Bauer, USDA Agricultural Research Service (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Monsanto_cotton_field.jpg',
  },
  'cancer-cure-suppressed.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Royal_Raymond_Rife_1939.jpg/640px-Royal_Raymond_Rife_1939.jpg',
    alt: 'Royal Raymond Rife, 1939',
    caption: 'Royal Raymond Rife (1888–1971), inventor of the Universal Microscope and developer of the Rife Machine frequency therapy device. Rife claimed to have identified a unique electromagnetic frequency capable of devitalising cancer-causing microorganisms. His laboratory was allegedly raided by FDA agents in 1939. / Public domain (pre-1978)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Royal_Raymond_Rife_1939.jpg',
  },

  /* ── Technology & Control ─────────────────────────────────────────────── */
  'transhumanism.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Neuralink_logo.png/800px-Neuralink_logo.png',
    alt: 'Neuralink Corporation logo',
    caption: 'Neuralink Corporation logo. Neuralink, co-founded by Elon Musk, implanted its first brain-computer interface device in a human patient in January 2024. The device records neural signals via 1,024 electrodes and transmits them wirelessly. / Neuralink, fair use for informational purposes',
    licence: 'Fair Use',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Neuralink_logo.png',
  },
  'dew-weapons.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Maui_Lahaina_fire_aerial_2023.jpg/960px-Maui_Lahaina_fire_aerial_2023.jpg',
    alt: 'Aerial view of Lahaina fire destruction, Maui, August 2023',
    caption: 'Aerial view of the destruction in Lahaina, Maui following the August 8, 2023 fire. Anomalous burn patterns — including intact blue objects surrounded by total destruction and boats burned while palm trees remained — led to widespread directed energy weapon (DEW) speculation. / US Coast Guard (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Maui_Lahaina_fire_aerial_2023.jpg',
  },
  'ai-surveillance.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Clearview_AI_facial_recognition.jpg/800px-Clearview_AI_facial_recognition.jpg',
    alt: 'Facial recognition camera array in a public space',
    caption: 'Facial recognition camera infrastructure deployed in a public environment. Clearview AI has scraped over 30 billion face images from public internet sources without consent, creating a database used by law enforcement agencies in multiple countries. / Wikimedia Commons, CC BY-SA 4.0',
    licence: 'CC BY-SA 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Facial_recognition_face_detection_AI.jpg',
  },
  'smart-cities.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Smart_city_concept_sensors.jpg/960px-Smart_city_concept_sensors.jpg',
    alt: 'Smart city IoT sensor infrastructure diagram',
    caption: 'Smart city IoT (Internet of Things) sensor network concept — interconnected infrastructure for surveillance, movement tracking, and utility control. The EU\'s "Smart City" framework and UN Habitat\'s "Smart Urban Systems" program are rolling out this architecture globally. / Pixabay, CC0 public domain',
    licence: 'CC0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Smart_city_sensors_4ir.jpg',
  },
  'social-media-control.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_Fulfillment_Center_servers.jpg/960px-Amazon_Fulfillment_Center_servers.jpg',
    alt: 'Server racks in a large data center',
    caption: 'Server infrastructure in a large data center. In 2014, Facebook published a paper in PNAS documenting an emotional contagion experiment conducted without user consent, in which they altered news feeds to test whether emotional states could be transferred through social networks. / Wikimedia Commons, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_35.jpg',
  },
  'rfid-surveillance.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/RFID_smartcard_and_reader.jpg/800px-RFID_smartcard_and_reader.jpg',
    alt: 'RFID smart card and reader',
    caption: 'RFID (Radio Frequency Identification) smart card and reader. Passive RFID chips transmit data without a battery when energised by a reader antenna. They are embedded in passports, credit cards, employee ID badges, and product packaging. / Wikimedia Commons, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:RFID_smartcard_and_reader.jpg',
  },

  /* ── Ancient History ─────────────────────────────────────────────────── */
  'tartaria.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Tartaria_-_1570_Ortelius_map.jpg/960px-Tartaria_-_1570_Ortelius_map.jpg',
    alt: '1570 Ortelius map showing the vast territory of Tartaria across Eurasia',
    caption: 'Abraham Ortelius\'s 1570 map "Tartariae sive Magni Chami Regni typus" showing the vast territory of Tartaria spanning from Eastern Europe across Russia to the Pacific. Tartaria consistently appeared on European maps until the late 18th century. / Abraham Ortelius (public domain — pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Abraham_Ortelius-Tartariae_sive_Magni_Chami_Regni_typus.jpg',
  },
  'atlantis-lemuria-mu.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Athanasius_Kircher%27s_Atlantis.gif/640px-Athanasius_Kircher%27s_Atlantis.gif',
    alt: "Athanasius Kircher's 1665 map showing the location of Atlantis in the Atlantic Ocean",
    caption: "Athanasius Kircher's 1665 map showing the hypothesised location of Atlantis in the mid-Atlantic Ocean, oriented with south at the top. Kircher based the map on his reading of Plato's Timaeus and Critias. / Public domain (pre-1928)",
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Athanasius_Kircher%27s_Atlantis.gif',
  },
  'mud-flood.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Seattle_underground_tour.jpg/960px-Seattle_underground_tour.jpg',
    alt: 'Seattle Underground — subterranean original street level, Pioneer Square',
    caption: 'The Seattle Underground — the subterranean original street level of Pioneer Square, preserved after the city was raised 1 to 3 storeys following the Great Seattle Fire of 1889. Mud flood theorists point to similar buried lower floors in cities worldwide as evidence of a concealed civilisational reset. / Joe Mabel, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Seattle_underground_tour.jpg',
  },
  'giza-complex.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/960px-All_Gizah_Pyramids.jpg',
    alt: 'The three Great Pyramids of Giza, Egypt',
    caption: 'The three Great Pyramids of Giza — Khufu (Cheops), Khafre, and Menkaure — photographed from the plateau. The Great Pyramid of Khufu was the tallest man-made structure in the world for 3,800 years. It is aligned to true north to within 0.05 degrees. / Ricardo Liberato, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:All_Gizah_Pyramids.jpg',
  },
  'stolen-history.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Singer_Building_NYC_1908.jpg/640px-Singer_Building_NYC_1908.jpg',
    alt: 'Singer Building, Broadway, New York City, 1908',
    caption: 'The Singer Building, Broadway and Liberty Street, New York City (1908). Mud flood and Tartaria theorists cite the architectural complexity of 19th-century buildings — often built within a few years of "founding" — as evidence of pre-existing infrastructure from a prior civilisation. / Wikimedia Commons, public domain (pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Singer_Building_NYC_1908.jpg',
  },
  'ancient-alien-ruins.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/G%C3%B6bekli_Tepe%2C_Urfa.jpg/960px-G%C3%B6bekli_Tepe%2C_Urfa.jpg',
    alt: 'Göbekli Tepe, Şanlıurfa Province, Turkey — the world\'s oldest known megalithic structure',
    caption: "Göbekli Tepe, Şanlıurfa Province, southeastern Turkey — the world's oldest known megalithic structure, dated to approximately 9600 BCE. Its T-shaped limestone pillars, weighing up to 20 tonnes each, predate agriculture and written language by thousands of years. It was deliberately buried around 8000 BCE. / Teomancimit, CC BY-SA 3.0",
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:G%C3%B6bekli_Tepe,_Urfa.jpg',
  },
  'giants-suppressed.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Cardiff_Giant_being_unearthed%2C_1869.jpg/800px-Cardiff_Giant_being_unearthed%2C_1869.jpg',
    alt: 'The Cardiff Giant being unearthed, 1869',
    caption: 'The Cardiff Giant being excavated at Stub Newell\'s farm, Cardiff, New York, October 1869. The 10-foot figure was initially proclaimed an ancient petrified man but later revealed as a hoax — although proponents note that the very success of such a hoax required public familiarity with giant discoveries. / Wikimedia Commons, public domain (pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Cardiff_Giant_being_unearthed,_1869.jpg',
  },
  'piri-reis-map.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Piri_Reis_map.jpg/640px-Piri_Reis_map.jpg',
    alt: 'The Piri Reis Map, 1513, showing an accurate outline of Antarctica centuries before its discovery',
    caption: 'The Piri Reis Map (1513), drawn by Ottoman admiral Piri Reis on gazelle skin. The southern portion of the map shows a landmass some researchers identify as Antarctica with an ice-free coastline — the continent was not officially discovered until 1820. / Wikimedia Commons, public domain (pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Piri_reis_world_map_01.jpg',
  },
  'nazca-lines.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Nazca_lineas_aero.jpg/960px-Nazca_lineas_aero.jpg',
    alt: 'Nazca Lines, aerial view showing the Hummingbird geoglyph, Peru',
    caption: 'Aerial view of the Nazca Lines, Ica Region, Peru — showing the Hummingbird geoglyph. The lines were created by the Nazca culture between 500 BCE and 500 CE. Their scale and precision — only fully visible from altitude — has led to numerous theories about their purpose and builders. / Diego Delso, CC BY-SA 4.0',
    licence: 'CC BY-SA 4.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Nazca_lineas_aero.jpg',
  },
  'vimanas.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Vimana_in_the_Ramayana.jpg/800px-Vimana_in_the_Ramayana.jpg',
    alt: 'Depiction of a Vimana flying vehicle in a Ramayana manuscript illustration',
    caption: 'A Vimana — flying vehicle — depicted in an illustrated manuscript of the Ramayana. Ancient Sanskrit texts including the Mahabharata, Ramayana, and Vaimanika Shastra describe detailed flying craft with propulsion, weaponry, and navigation systems. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Vimana_in_the_Ramayana.jpg',
  },
  'operation-highjump.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Operation_Highjump_photo.jpg/960px-Operation_Highjump_photo.jpg',
    alt: 'US Navy aircraft and ships during Operation Highjump, Antarctica, 1946-47',
    caption: 'US Navy aircraft and ships during Operation Highjump, the 1946–47 Antarctic expedition led by Admiral Richard E. Byrd involving 4,700 men, 13 ships, and 33 aircraft. The operation was scheduled for 8 months but ended abruptly after 8 weeks. / US Navy (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Operation_Highjump.jpg',
  },
  'antarctica-hidden.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Antarctica_6400px_from_Blue_Marble.jpg/960px-Antarctica_6400px_from_Blue_Marble.jpg',
    alt: 'Antarctica from satellite, NASA Blue Marble composite',
    caption: 'Antarctica from space — NASA Blue Marble composite. The Antarctic Treaty (1959), signed by 54 nations, restricts civilian access to the continent. The only civilian visitors must be part of a government-sponsored scientific programme. / NASA (public domain — US government work)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Antarctica_6400px_from_Blue_Marble.jpg',
  },
  '10m-stone-circles.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Adam%27s_Calendar_South_Africa.jpg/960px-Adam%27s_Calendar_South_Africa.jpg',
    alt: "Adam's Calendar, Mpumalanga, South Africa — part of the 10 million stone circle network",
    caption: "Adam's Calendar, Mpumalanga, South Africa — a circular monolith site researchers Michael Tellinger and Johan Heine date to at least 75,000 years old based on solar alignments. It is part of what Tellinger calls a network of 10 million ancient stone circles across southern Africa. / Wikimedia Commons, CC BY-SA 3.0",
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Adam%27s_Calendar_South_Africa.jpg',
  },
  'mahabharata-nuclear-war.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Kurukshetra.jpg/960px-Kurukshetra.jpg',
    alt: 'Illustration of the Battle of Kurukshetra from the Mahabharata',
    caption: 'The Battle of Kurukshetra as depicted in a traditional painting. The Mahabharata describes weapons of mass destruction — the Brahmastra — capable of destroying entire armies with a blinding flash and heat. Post-explosion descriptions closely parallel modern accounts of nuclear detonation effects. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Kurukshetra.jpg',
  },
  'oopart.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/NAMA_Machine_d%27Anticyth%C3%A8re_1.jpg/800px-NAMA_Machine_d%27Anticyth%C3%A8re_1.jpg',
    alt: 'The Antikythera Mechanism, National Archaeological Museum, Athens',
    caption: 'The Antikythera Mechanism — fragments recovered from a Roman-era shipwreck off the Greek island of Antikythera in 1900. Dating to approximately 100 BCE, it is a hand-powered astronomical calculator of extraordinary complexity — a technology not re-created until the 18th century. / Marsyas, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:NAMA_Machine_d%27Anticyth%C3%A8re_1.jpg',
  },
  'precession-equinox.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Precession_animation_small_new.gif/320px-Precession_animation_small_new.gif',
    alt: 'Animation showing Earth\'s axial precession cycle over 25,771 years',
    caption: "Animation illustrating Earth's axial precession — the slow wobble of Earth's rotational axis that completes one full cycle every approximately 25,771 years (the Great Year). The precession determines which star is the pole star and drives the cycle of astrological Ages. / NASA / Wikimedia Commons, public domain",
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Precession_animation_small_new.gif',
  },
  'crop-circles.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Crop_circle_at_Milk_Hill_1.jpg/960px-Crop_circle_at_Milk_Hill_1.jpg',
    alt: 'Crop circle at Milk Hill, Wiltshire, UK — a 780-foot formation with 409 circles',
    caption: 'The Milk Hill formation, Wiltshire, UK (August 2001) — a 780-foot diameter crop circle with 409 individual circles arranged in a six-fold fractal spiral, formed overnight. Farmers reported hearing no noise and finding no tracks entering the field. / Handy Marks, CC BY 2.0',
    licence: 'CC BY 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Crop_circle_at_Milk_Hill_1.jpg',
  },
  'ark-of-covenant.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Ark_of_the_Covenant.jpg/800px-Ark_of_the_Covenant.jpg',
    alt: 'Illustration of the Ark of the Covenant from an 1897 Bible',
    caption: 'The Ark of the Covenant as illustrated in a 19th-century Bible — an acacia wood box overlaid with gold, approximately 131×79×79 cm. The specifications in Exodus 25:10–22 describe what electrical engineers have noted resembles a capacitor capable of storing a static charge. / Wikimedia Commons, public domain (pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Ark_of_the_Covenant.jpg',
  },
  'chinese-pyramids.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Maoling_mausoleum.jpg/960px-Maoling_mausoleum.jpg',
    alt: 'Maoling Mausoleum, the tomb pyramid of Han Emperor Wu, Xingping, Shaanxi, China',
    caption: "Maoling Mausoleum — the tomb pyramid of Han Emperor Wu Di (r. 141–87 BCE), Xingping, Shaanxi Province. Over 100 pyramid-shaped imperial burial mounds exist in Shaanxi Province. China's civil aviation authority has historically restricted photography over the region. / Zhangzhugang, CC BY-SA 3.0",
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Maoling_mausoleum.jpg',
  },

  /* ── SSP / ET Contact ─────────────────────────────────────────────────── */
  'area-51.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Area_51_sign.jpg/960px-Area_51_sign.jpg',
    alt: 'No trespassing warning sign at the boundary of Area 51, Nevada Test and Training Range',
    caption: 'Security warning signage at the perimeter of the Nevada Test and Training Range (Groom Lake / Area 51), Lincoln County, Nevada. The facility was not officially acknowledged by the CIA until 2013. / Alien Zone Corp, CC BY 2.0',
    licence: 'CC BY 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Area_51_sign.jpg',
  },
  'nasa-deceptions.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/White_side_of_the_moon.jpg/960px-White_side_of_the_moon.jpg',
    alt: 'The Moon photographed from NASA Lunar Reconnaissance Orbiter',
    caption: 'The Moon photographed by NASA\'s Lunar Reconnaissance Orbiter Camera (LROC). NASA has acknowledged that approximately 13,000 hours of Apollo telemetry data and 700 boxes of magnetic tapes from the Apollo era were erased and reused during the late 1970s due to tape shortages. / NASA / GSFC / ASU (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:White_side_of_the_moon.jpg',
  },
  'moon-truth.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/960px-FullMoon2010.jpg',
    alt: 'Full Moon, photographed from Earth',
    caption: 'Full Moon photographed from Earth. The Moon is the only natural satellite in the solar system with an exact diameter-to-distance ratio matching the Sun for perfect solar eclipses. Its mass, orbital distance, and rotational period are all within 1% of what would be required to maintain Earth\'s axial tilt. / Gregory H. Revera, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:FullMoon2010.jpg',
  },
  'ufo-disclosure.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/UAP_USS_Nimitz.jpg/960px-UAP_USS_Nimitz.jpg',
    alt: 'US Navy FLIR1 video still — the Tic Tac UAP filmed by USS Nimitz F/A-18s, 2004',
    caption: 'Still from the US Navy FLIR1 video, released by the Department of Defense in April 2020, showing the "Tic Tac" unidentified aerial phenomenon filmed by F/A-18F pilots from USS Nimitz on November 14, 2004. The object demonstrated acceleration and maneuverability beyond any known human aircraft. / US Department of Defense (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:US_Navy_UFO_FLIR1.png',
  },
  'roswell-incident.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Roswell_Daily_Record_Jul_8%2C_1947.jpg/640px-Roswell_Daily_Record_Jul_8%2C_1947.jpg',
    alt: 'Roswell Daily Record front page, July 8 1947: "RAAF Captures Flying Saucer"',
    caption: 'Front page of the Roswell Daily Record, July 8, 1947, with the headline "RAAF Captures Flying Saucer On Ranch in Roswell Region." The US Army Air Force issued this press release, then within hours retracted it and claimed the debris was a weather balloon. / Public domain (pre-1978)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Roswell_Daily_Record_Jul_8,_1947.jpg',
  },
  'philadelphia-experiment.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/USS_Eldridge_1944.jpg/960px-USS_Eldridge_1944.jpg',
    alt: 'USS Eldridge (DE-173), US Navy destroyer escort, 1944',
    caption: 'USS Eldridge (DE-173), the US Navy destroyer escort central to the Philadelphia Experiment legend. According to the account of Carl M. Allen (Carlos Allende), the ship was rendered invisible by the Navy in October 1943 using principles derived from Einstein\'s Unified Field Theory. / US Navy (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:USS_Eldridge_DE-173.jpg',
  },
  'dumbs.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Cheyenne_Mountain_Complex_blast_doors.jpg/960px-Cheyenne_Mountain_Complex_blast_doors.jpg',
    alt: 'Blast doors at the Cheyenne Mountain Complex, Colorado Springs, Colorado',
    caption: 'The 25-tonne blast doors at Cheyenne Mountain Complex, Colorado — the NORAD underground fortress built 2,000 feet inside a granite mountain. The facility is mounted on 1,319 springs to survive a nuclear near-miss. It represents the publicly known end of the deep underground military base spectrum. / US Air Force (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Cheyenne_Mountain_Complex_blast_doors.jpg',
  },
  'montauk-project.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Camp_Hero_radar.jpg/960px-Camp_Hero_radar.jpg',
    alt: 'AN/FPS-35 radar dish at Camp Hero State Park, Montauk, Long Island, New York',
    caption: 'AN/FPS-35 radar dish at Camp Hero State Park, Montauk Point, Long Island, New York — the former US Air Force Station decommissioned in 1981. The Montauk Project claims describe classified experiments in time travel, consciousness manipulation, and teleportation conducted in underground levels beneath this facility. / Jim.henderson, CC0',
    licence: 'CC0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Camp_Hero_State_Park_td_(4).jpg',
  },
  'nikola-tesla.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/N.Tesla.JPG/640px-N.Tesla.JPG',
    alt: 'Nikola Tesla, 1890, photographed by Napoleon Sarony',
    caption: 'Nikola Tesla (1856–1943), photographed by Napoleon Sarony c. 1890. Tesla held 300+ patents across alternating current power systems, radio, X-rays, radar, and remote control. His Wardenclyffe Tower project for wireless global energy transmission was defunded by J.P. Morgan in 1906. / Napoleon Sarony (public domain — pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:N.Tesla.JPG',
  },
  'zero-point-free-energy.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Wardenclyffe_tower.jpg/640px-Wardenclyffe_tower.jpg',
    alt: "Nikola Tesla's Wardenclyffe Tower, Shoreham, Long Island, New York, c.1904",
    caption: "Nikola Tesla's Wardenclyffe Tower, Shoreham, Long Island, New York (c.1904). Tesla intended the tower to transmit electrical power wirelessly across the globe. J.P. Morgan withdrew funding when he realised there was no way to meter free energy. The tower was demolished in 1917. / Wikimedia Commons (public domain — pre-1928)",
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Wardenclyffe_tower.jpg',
  },

  /* ── Media & Crime ───────────────────────────────────────────────────── */
  'epstein-network.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Little_Saint_James_Island.jpg/960px-Little_Saint_James_Island.jpg',
    alt: 'Little Saint James Island, US Virgin Islands — Jeffrey Epstein\'s private island',
    caption: "Little Saint James Island, US Virgin Islands — Jeffrey Epstein's private island, sometimes referred to as \"Epstein Island\" or \"Pedophile Island\" by locals. The island featured a distinctive blue-and-white striped building that has been the subject of widespread speculation. / US Virgin Islands Dept. of Tourism, public domain",
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Little_Saint_James_Island.jpg',
  },
  'nxivm.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Keith_Raniere_2009.jpg/640px-Keith_Raniere_2009.jpg',
    alt: 'Keith Raniere, founder of NXIVM, 2009',
    caption: 'Keith Raniere (b. 1960), founder of NXIVM, photographed in 2009. Raniere was convicted in 2019 on federal charges including sex trafficking, racketeering, and forced labour. NXIVM\'s inner circle, DOS, branded female "slaves" with Raniere\'s initials using a cauterising iron. / Wikimedia Commons, CC BY 3.0',
    licence: 'CC BY 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Keith_Raniere_2009.jpg',
  },
  'corporate-media-control.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Comcast_headquarters_Philadelphia.jpg/960px-Comcast_headquarters_Philadelphia.jpg',
    alt: 'Comcast headquarters, Philadelphia, Pennsylvania',
    caption: 'Comcast Center headquarters, Philadelphia, Pennsylvania. Comcast-NBCUniversal is one of the six media conglomerates that together control approximately 90% of US media outlets. The "Big Six" are Comcast, Disney, News Corp, WarnerMedia (Warner Bros. Discovery), CBS (Paramount), and Sony. / Avery Jensen, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Comcast_headquarters_Philadelphia.jpg',
  },
  'operation-mockingbird.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/CIA_Mockingbird_declassified.jpg/800px-CIA_Mockingbird_declassified.jpg',
    alt: 'Declassified CIA document referencing Operation Mockingbird media assets',
    caption: 'Declassified CIA document referencing media and journalist assets. Operation Mockingbird was a CIA programme to influence domestic and foreign media through placement of CIA assets at newspapers, wire services, and broadcast networks. The programme was partially revealed by the Church Committee in 1975. / CIA (US government work, public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:CIA-RDP75-00001R000100050013-4.pdf',
  },

  /* ── Suppressed Science ──────────────────────────────────────────────── */
  'sacred-geometry.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Flower-of-Life-small.svg/800px-Flower-of-Life-small.svg.png',
    alt: 'The Flower of Life — sacred geometric pattern',
    caption: 'The Flower of Life — a sacred geometric figure composed of 19 interlocking circles arranged in a hexagonal pattern. It appears in the Temple of Osiris at Abydos, Egypt (c.6th century BCE), in Leonardo da Vinci\'s notebooks, and throughout ancient Indian, Middle Eastern, and European architecture. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Flower-of-Life-small.svg',
  },
  'cymatics.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Chladni_figures.jpg/800px-Chladni_figures.jpg',
    alt: 'Chladni figures — sand patterns formed by acoustic vibration on a metal plate',
    caption: 'Chladni figures — geometric patterns formed by sand on a metal plate vibrated at specific frequencies, first documented by Ernst Chladni in 1787. Hans Jenny (1904–1972) coined the term "cymatics" for the study of wave phenomena and vibration, demonstrating that sound creates ordered geometric forms in matter. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Chladni_figures.jpg',
  },
  'electric-universe.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Plasma_filaments.jpg/960px-Plasma_filaments.jpg',
    alt: 'Plasma filament discharge in laboratory — cosmological plasma filament analogue',
    caption: 'Laboratory plasma discharge filaments — analogous to the Birkeland currents that electric universe theorists (Wallace Thornhill, Donald Scott) propose connect stars and galaxies across the cosmic web. The Electric Universe theory challenges the gravity-only standard cosmological model. / Wikimedia Commons, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Plasma_filaments.jpg',
  },
  'pineal-gland.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Pineal_gland.jpg/640px-Pineal_gland.jpg',
    alt: 'MRI scan showing the location of the pineal gland in the human brain',
    caption: 'MRI scan showing the pineal gland — a small endocrine gland located in the epithalamus of the vertebrate brain. Descartes described it as "the seat of the soul." It produces melatonin and, according to researcher Rick Strassman, synthesises trace amounts of DMT (N,N-dimethyltryptamine). / Wikimedia Commons, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Pineal_gland.jpg',
  },
  'orgone-reich.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Wilhelm_Reich_1940.jpg/640px-Wilhelm_Reich_1940.jpg',
    alt: 'Wilhelm Reich, c.1940',
    caption: 'Wilhelm Reich (1897–1957), Austrian-American psychiatrist who developed the theory of orgone energy — a universal life force he believed could be accumulated and directed for therapeutic and meteorological purposes. His laboratory was raided by the FDA in 1954; he died in a federal prison in 1957. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Wilhelm_Reich_1940.jpg',
  },
  'dmt.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Dimethyltryptamine.svg/800px-Dimethyltryptamine.svg.png',
    alt: 'Molecular structure of DMT (N,N-Dimethyltryptamine)',
    caption: 'Molecular structure of N,N-Dimethyltryptamine (DMT) — C₁₂H₁₆N₂. DMT is produced endogenously in the human body (pineal gland, lungs, and other tissues). It is the active visionary compound in ayahuasca and produces near-death-experience-like states at high doses. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Dimethyltryptamine.svg',
  },
  'ayahuasca.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Banisteriopsis_caapi.jpg/800px-Banisteriopsis_caapi.jpg',
    alt: 'Banisteriopsis caapi vine — the ayahuasca vine',
    caption: 'Banisteriopsis caapi — the "vine of the soul" — the primary ingredient in ayahuasca. The vine contains β-carboline monoamine oxidase inhibitors (MAOIs) that allow orally consumed DMT to produce psychoactive effects. It has been used in Amazonian shamanic traditions for thousands of years. / Terpsichores, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Banisteriopsis_caapi.jpg',
  },
  'law-of-one.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/All_Seeing_Eye.jpg/640px-All_Seeing_Eye.jpg',
    alt: 'The Eye of Providence — symbol related to Law of One Ra material concepts',
    caption: 'The Eye of Providence in its original context: a symbol from Western esoteric tradition representing the all-seeing eye of God, or in Gnostic frameworks, the presence of a higher divine consciousness. The Ra/Law of One material (1981–1984) describes RA as a "social memory complex" from the sixth density. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:All_Seeing_Eye.jpg',
  },

  /* ── Key Figures ─────────────────────────────────────────────────────── */
  'graham-hancock.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Graham_Hancock_at_Hay_Festival_2015.jpg/640px-Graham_Hancock_at_Hay_Festival_2015.jpg',
    alt: 'Graham Hancock at the Hay Festival, 2015',
    caption: 'Graham Hancock (b. 1950) at the Hay Festival, Hay-on-Wye, 2015. Author of "Fingerprints of the Gods" (1995), "Magicians of the Gods" (2015), and "America Before" (2019). Hancock argues for a technologically advanced pre-ice-age civilisation destroyed by a cometary impact c.10,800 BCE. / Wikimedia Commons, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Graham_Hancock_at_Hay_Festival_2015.jpg',
  },
  'erich-von-daniken.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Erich_von_D%C3%A4niken_2009.jpg/640px-Erich_von_D%C3%A4niken_2009.jpg',
    alt: 'Erich von Däniken, author of Chariots of the Gods, 2009',
    caption: 'Erich von Däniken (b. 1935), Swiss author of "Chariots of the Gods" (1968) — one of the bestselling books of the 20th century with over 70 million copies sold. Von Däniken proposes that ancient structures including the Nazca Lines, Pyramids, and Puma Punku were built with extraterrestrial assistance. / Wikimedia Commons, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Erich_von_D%C3%A4niken_2009.jpg',
  },
  'gary-mckinnon.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Gary_McKinnon.jpg/640px-Gary_McKinnon.jpg',
    alt: 'Gary McKinnon, 2006',
    caption: 'Gary McKinnon (b. 1966) in 2006 — the Scottish systems administrator who hacked into 97 US military and NASA computers between 2001 and 2002. McKinnon claims to have found spreadsheets listing "non-terrestrial officers" and ship-to-ship transfer records for craft with non-Navy designations. / Wikimedia Commons, CC BY 2.0',
    licence: 'CC BY 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Gary_McKinnon.jpg',
  },
  'edward-snowden.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Edward_Snowden_2013-10-9_%28cropped%29.jpg/640px-Edward_Snowden_2013-10-9_%28cropped%29.jpg',
    alt: 'Edward Snowden, 2013',
    caption: 'Edward Snowden (b. 1983), former NSA contractor, photographed in Moscow, October 2013. / Laura Poitras / Praxis Films, CC BY 3.0',
    licence: 'CC BY 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Edward_Snowden_2013-10-9_(cropped).jpg',
  },

  /* ── Geopolitics ─────────────────────────────────────────────────────── */
  'agenda-2030.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/UN_Agenda_2030_SDGs.png/960px-UN_Agenda_2030_SDGs.png',
    alt: 'United Nations Sustainable Development Goals (SDGs) — Agenda 2030',
    caption: 'United Nations Sustainable Development Goals (SDGs), adopted September 25, 2015 as part of the "2030 Agenda for Sustainable Development." Critics note that SDG 10.7 calls for "orderly, safe, regular and responsible migration" (open borders), and SDG 16.9 calls for "legal identity for all, including birth registration" (universal digital ID). / United Nations, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Sustainable_Development_Goals.png',
  },
  'georgia-guidestones.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Georgia_Guidestones.jpg/960px-Georgia_Guidestones.jpg',
    alt: 'The Georgia Guidestones, Elbert County, Georgia, 2008',
    caption: 'The Georgia Guidestones, Elbert County, Georgia, photographed in 2008 before their destruction on July 6, 2022. The first commandment, inscribed in eight languages, called for maintaining humanity\'s population at 500 million — 93% below current levels. The sponsor\'s identity was never revealed. / Dina Eric, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Georgia_Guidestones.jpg',
  },
  'brics-alliance.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/BRICS_2023_Summit.jpg/960px-BRICS_2023_Summit.jpg',
    alt: 'BRICS Summit leaders, Johannesburg, South Africa, August 2023',
    caption: 'BRICS Summit leaders, Johannesburg, South Africa, August 22–24, 2023. At this summit BRICS invited six new members to join (Argentina, Egypt, Ethiopia, Iran, Saudi Arabia, UAE), expanding the bloc to cover approximately 46% of the world\'s population and 29% of global GDP. / Government of South Africa, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:BRICS_2023_Summit.jpg',
  },
  'three-city-states.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/City_of_London_corporation.jpg/640px-City_of_London_corporation.jpg',
    alt: 'The City of London Corporation coat of arms and shield',
    caption: 'The City of London Corporation — the autonomous municipal governing body of the one-square-mile City of London financial district. Unlike any other administrative body in the UK, the City of London Corporation allows businesses to vote in its elections, giving financial institutions outsized political power. The City, Vatican City, and Washington D.C. are the three "city-states within states" with special sovereignty status. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:City_of_London_Arms.svg',
  },
  'maritime-law.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/US_Admiralty_flag.svg/640px-US_Admiralty_flag.svg.png',
    alt: 'US Admiralty / Maritime flag — fouled anchor on blue field',
    caption: 'The United States Admiralty and Maritime flag — the flag of the Secretary of the Navy, featuring a fouled anchor on a dark blue field. Admiralty/maritime law (the "law of the sea") governs commerce conducted on navigable waters and forms the basis of the sovereign citizen and Freeman-on-the-Land legal arguments. / US Government (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:US_Admiralty_flag.svg',
  },

  /* ── Nazi / Breakaway ────────────────────────────────────────────────── */
  'nazi-occult.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/SS_Ahnenerbe_insignia.jpg/640px-SS_Ahnenerbe_insignia.jpg',
    alt: 'SS Ahnenerbe insignia — runic emblem of the Nazi occult research division',
    caption: 'Insignia of the SS Ahnenerbe (Ancestral Heritage Research and Teaching Society) — the SS division established by Heinrich Himmler in 1935 to conduct research into Aryan racial origins, Nordic mythology, and esoteric occult traditions. The Ahnenerbe sent expeditions to Tibet, Bolivia, Iraq, and Antarctica. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:SS_Ahnenerbe_insignia.svg',
  },
  'nazi-breakaway-group.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Neuschwabenland_1938.jpg/960px-Neuschwabenland_1938.jpg',
    alt: 'MS Schwabenland, the German Antarctic expedition vessel, 1938-39',
    caption: 'The MS Schwabenland, used in the Third Reich\'s Antarctic expedition of 1938–39, which claimed the territory of Neuschwabenland (New Swabia). The expedition conducted extensive aerial mapping. Nazi breakaway theorists claim a permanent underground base was established during this expedition. / German Federal Archives, CC BY-SA 3.0 DE',
    licence: 'CC BY-SA 3.0 DE',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Bundesarchiv_Bild_135-S-12-06-16,_Schwabenland-Expedition,_Antarktis.jpg',
  },
  'vril-society.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Maria_Orsic_photograph.jpg/640px-Maria_Orsic_photograph.jpg',
    alt: 'Maria Orsic, alleged Vril Society medium, c.1920s',
    caption: 'Maria Orsic (c.1895–1945?), alleged Vril Society medium who claimed to have received technical specifications for an advanced flight device via automatic writing transmissions from an extraterrestrial civilisation in the Aldebaran star system. She disappeared in 1945 without explanation. / Public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Maria_Orsic_photograph.jpg',
  },
  'operation-paperclip.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Operation_Paperclip_scientists.jpg/960px-Operation_Paperclip_scientists.jpg',
    alt: 'Operation Paperclip German scientists at Fort Bliss, Texas, 1946',
    caption: 'Operation Paperclip scientists at Fort Bliss, Texas, 1946. Seven of these men were later implicated in Nazi war crimes but were cleared to work in US government service. The group includes Wernher von Braun (row 7 from left). / US Army (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Operation_Paperclip_scientists.jpg',
  },

  /* ── Spiritual & Metaphysical ────────────────────────────────────────── */
  'great-solar-flash.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Solar_maximum_extreme_ultraviolet_prominence.jpg/960px-Solar_maximum_extreme_ultraviolet_prominence.jpg',
    alt: 'Solar eruption photographed by NASA\'s Solar Dynamics Observatory',
    caption: 'A solar prominence eruption photographed by NASA\'s Solar Dynamics Observatory in extreme ultraviolet. The "Great Solar Flash" concept appears in multiple ancient traditions — the Hindu Samvartaka Fire, Zoroastrian Frashokereti, and Stoic Ekpyrosis — and in the Law of One material as a 25,920-year solar cycle event. / NASA/SDO (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Solar_maximum_extreme_ultraviolet_prominence.jpg',
  },
  'luciferian-doctrine.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Albert_Pike_Portrait.jpg/640px-Albert_Pike_Portrait.jpg',
    alt: 'Albert Pike, Sovereign Grand Commander of the Scottish Rite, portrait c.1870',
    caption: 'Albert Pike (1809–1891), Sovereign Grand Commander of the Southern Jurisdiction, Scottish Rite Freemasonry, and author of "Morals and Dogma" (1871). Pike wrote: "The Masonic Religion should be, by all of us initiates of the high degrees, maintained in the purity of the Luciferian doctrine." / Wikimedia Commons, public domain (pre-1928)',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Albert_Pike_Portrait.jpg',
  },
  'simulation-theory.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Digital_rain_animation_medium_letters.gif/320px-Digital_rain_animation_medium_letters.gif',
    alt: 'Digital rain animation — visual metaphor for simulation theory',
    caption: 'Digital "rain" animation — a visual metaphor for simulation theory. Nick Bostrom\'s 2003 "Are You Living in a Computer Simulation?" argues that at least one of three propositions must be true: (1) civilisations go extinct before developing simulation capability; (2) advanced civilisations choose not to run simulations; (3) we are almost certainly living in a simulation. / Wikimedia Commons, public domain',
    licence: 'Public Domain',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Digital_rain_animation_medium_letters.gif',
  },
  'predictive-programming.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/The_Simpsons_-_Dont_Fear_the_Roofer_-_TV_monitor.png/960px-The_Simpsons_-_Dont_Fear_the_Roofer_-_TV_monitor.png',
    alt: 'Television screens — media predictive programming concept',
    caption: 'Television screens — the medium through which predictive programming is primarily delivered. Author Alan Watt coined the term to describe the practice of using fiction to pre-condition public acceptance of future planned events by familiarising the subconscious mind with them in advance. / Wikimedia Commons, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Television_set.jpg',
  },
  'mandela-effect.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Nelson_Mandela_1994.jpg/640px-Nelson_Mandela_1994.jpg',
    alt: 'Nelson Mandela, 1994, at the inauguration ceremony',
    caption: 'Nelson Mandela (1918–2013), photographed at his presidential inauguration in Pretoria, May 10, 1994. The "Mandela Effect" is named after the widespread false memory that Mandela died in prison in the 1980s — thousands of people clearly remember news coverage of his death that did not occur. / Paul Weinberg, CC BY-SA 2.5',
    licence: 'CC BY-SA 2.5',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Nelson_Mandela_1994.jpg',
  },
  'schumann-resonance.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Schumann_resonance_diagram.png/960px-Schumann_resonance_diagram.png',
    alt: 'Diagram of the Schumann Resonance cavity between the Earth\'s surface and the ionosphere',
    caption: 'Diagram of the Schumann Resonance cavity — the electromagnetic resonance created in the space between the Earth\'s surface and the ionosphere. The fundamental frequency of approximately 7.83 Hz closely matches the alpha/theta brain wave range. / Wikimedia Commons, CC BY-SA 3.0',
    licence: 'CC BY-SA 3.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Schumann_resonance_diagram.png',
  },

  /* ── Space & Astronomy ───────────────────────────────────────────────── */
  'mars-colony.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/960px-OSIRIS_Mars_true_color.jpg',
    alt: 'Mars photographed by ESA Rosetta spacecraft, 2007',
    caption: 'Mars photographed in true colour by the ESA Rosetta spacecraft, 2007. Mars has an atmospheric pressure of ~0.6% of Earth\'s and an average temperature of -60°C. NASA\'s Perseverance rover has been operating on the Martian surface since February 2021. / ESA/Rosetta/NavCam, CC BY-SA 3.0 IGO',
    licence: 'CC BY-SA 3.0 IGO',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:OSIRIS_Mars_true_color.jpg',
  },
  'saturn-rings.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/960px-Saturn_during_Equinox.jpg',
    alt: 'Saturn photographed by the Cassini spacecraft during equinox, 2009',
    caption: 'Saturn photographed by the Cassini spacecraft during Saturn\'s equinox, August 11, 2009. The rings and moons cast shadows on the planet during equinox. The hexagonal storm at Saturn\'s north pole spans approximately 30,000 km — wider than Earth\'s diameter. / NASA/JPL/Space Science Institute (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Saturn_during_Equinox.jpg',
  },
  'moon-structures.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/AS17-140-21496.jpg/960px-AS17-140-21496.jpg',
    alt: 'Apollo 17 photograph of the lunar surface, December 1972',
    caption: 'Apollo 17 photograph of the lunar surface, December 1972. Apollo 17 astronaut Harrison Schmitt was the first and only professional geologist to walk on the Moon. All subsequent planned Apollo missions (18, 19, 20) were cancelled, ostensibly for budgetary reasons. / NASA (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:AS17-140-21496.jpg',
  },
  'cydonia-face-mars.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/The_face_on_Mars.jpg/800px-The_face_on_Mars.jpg',
    alt: 'The Face on Mars, Cydonia region — Viking 1 orbiter photograph, 1976',
    caption: 'The Face on Mars — photographed by the Viking 1 orbiter in the Cydonia region, July 25, 1976 (image 35A72). NASA initially described it as a trick of light and shadow. Richard Hoagland\'s analysis identified geometric relationships among the Cydonia structures consistent with a 19.5-degree tetrahedral geometry. / NASA (public domain)',
    licence: 'US Government Work',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:The_face_on_Mars.jpg',
  },
  'project-blue-beam.html': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Holographic_display.jpg/960px-Holographic_display.jpg',
    alt: 'Holographic projection technology demonstration',
    caption: 'Advanced holographic projection technology. Project Blue Beam is described by researcher Serge Monast (1945–1996) as a NASA/UN plan to use holographic technology to simulate a fake alien invasion or divine second coming, providing a pretext for establishing a new world order. Monast died of a heart attack in 1996, one day after being arrested. / Wikimedia Commons, CC BY-SA 2.0',
    licence: 'CC BY-SA 2.0',
    wikiUrl: 'https://commons.wikimedia.org/wiki/File:Holographic_display.jpg',
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Builds the <figure> HTML block for a given page entry.
 * @param {object} img
 * @returns {string}
 */
function buildFigure(img) {
  return `
        <figure class="topic-image fade-in">
          <img src="${img.url}"
               alt="${img.alt}"
               loading="lazy" />
          <figcaption class="image-credit">
            ${img.caption} /
            <a href="${img.wikiUrl}" target="_blank" rel="noopener">Wikimedia Commons</a>
          </figcaption>
        </figure>
`;
}

// ─── Injection ────────────────────────────────────────────────────────────────
const INSERT_AFTER = '<div class="chapter-content">';
let injected = 0;
let skipped  = 0;
let noEntry  = 0;

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
  const entry = IMAGES[file];
  if (!entry) { noEntry++; continue; }

  const fullPath = path.join(DIR, file);
  let html = fs.readFileSync(fullPath, 'utf8');

  // Skip if already has a topic-image
  if (html.includes('topic-image')) { skipped++; continue; }

  // Insert figure right after <div class="chapter-content">
  if (!html.includes(INSERT_AFTER)) {
    console.warn(`⚠  Could not find insertion point in: ${file}`);
    continue;
  }

  html = html.replace(INSERT_AFTER, INSERT_AFTER + buildFigure(entry));
  fs.writeFileSync(fullPath, html, 'utf8');
  injected++;
  console.log(`✓  ${file}`);
}

console.log(`\nDone — injected: ${injected} | already had image: ${skipped} | no catalogue entry: ${noEntry}`);
