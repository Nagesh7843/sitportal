/**
 * Comprehensive Smart Company Domain & Web Logo Auto-Detection Engine
 * Contains curated enterprise maps for 300+ prominent global tech companies, Indian IT leaders,
 * unicorn startups, Fortune 500 firms, banks, consulting leaders, and automotive engineering enterprises,
 * plus an advanced algorithmic inference engine capable of resolving any company worldwide.
 */

// Comprehensive dictionary of major campus recruiters, tech giants, startups, and Fortune 500 companies
const KNOWN_COMPANY_DOMAINS: Record<string, string> = {
  // Indian IT, Software Services & Global Consulting
  tcs: 'tcs.com',
  'tata consultancy services': 'tcs.com',
  'tcs digital': 'tcs.com',
  'tcs ninja': 'tcs.com',
  'tcs prime': 'tcs.com',
  'tcs innovator': 'tcs.com',
  infosys: 'infosys.com',
  infy: 'infosys.com',
  'infosys springboard': 'infosys.com',
  wipro: 'wipro.com',
  'wipro turbo': 'wipro.com',
  cognizant: 'cognizant.com',
  cts: 'cognizant.com',
  'cognizant gen c': 'cognizant.com',
  capgemini: 'capgemini.com',
  'tech mahindra': 'techmahindra.com',
  techm: 'techmahindra.com',
  accenture: 'accenture.com',
  ltimindtree: 'ltimindtree.com',
  lti: 'ltimindtree.com',
  'l&t infotech': 'ltimindtree.com',
  mindtree: 'ltimindtree.com',
  hcltech: 'hcltech.com',
  hcl: 'hcltech.com',
  'hcl technologies': 'hcltech.com',
  'persistent systems': 'persistent.com',
  persistent: 'persistent.com',
  'phn technologies': 'phntechnology.com',
  'phn technology': 'phntechnology.com',
  phn: 'phntechnology.com',
  'kpit technologies': 'kpit.com',
  kpit: 'kpit.com',
  hexaware: 'hexaware.com',
  'hexaware technologies': 'hexaware.com',
  birlasoft: 'birlasoft.com',
  mphasis: 'mphasis.com',
  zensar: 'zensar.com',
  'zensar technologies': 'zensar.com',
  cybage: 'cybage.com',
  'cybage software': 'cybage.com',
  amdocs: 'amdocs.com',
  'quick heal': 'quickheal.com',
  'tata elxsi': 'tataelxsi.com',
  'tata technologies': 'tatatechnologies.com',
  'larsen & toubro': 'larsentoubro.com',
  'l&t': 'larsentoubro.com',
  'l&t technology services': 'ltts.com',
  ltts: 'ltts.com',
  coforge: 'coforge.com',
  niit: 'niit.com',
  'sonata software': 'sonata-software.com',
  virtusa: 'virtusa.com',
  epam: 'epam.com',
  'epam systems': 'epam.com',
  thoughtworks: 'thoughtworks.com',
  globallogic: 'globallogic.com',
  'publicis sapient': 'publicissapient.com',
  nagarro: 'nagarro.com',
  genpact: 'genpact.com',
  wns: 'wns.com',
  exl: 'exlservice.com',
  mindgate: 'mindgate.in',
  nelito: 'nelito.com',
  aurionpro: 'aurionpro.com',
  majesco: 'majesco.com',
  sasken: 'sasken.com',
  'nucleus software': 'nucleussoftware.com',
  subex: 'subex.com',
  happiest: 'happiestminds.com',
  'happiest minds': 'happiestminds.com',
  kellton: 'kellton.com',
  newgen: 'newgensoft.com',
  'newgen software': 'newgensoft.com',
  infobeans: 'infobeans.com',
  zenq: 'zenq.com',
  cigniti: 'cigniti.com',

  // Global Big Tech & Product Titans (FAANG / MANAMANA)
  google: 'google.com',
  alphabet: 'abc.xyz',
  microsoft: 'microsoft.com',
  msft: 'microsoft.com',
  amazon: 'amazon.com',
  aws: 'aws.amazon.com',
  apple: 'apple.com',
  meta: 'meta.com',
  facebook: 'meta.com',
  instagram: 'instagram.com',
  whatsapp: 'whatsapp.com',
  netflix: 'netflix.com',
  twitter: 'x.com',
  x: 'x.com',
  uber: 'uber.com',
  linkedin: 'linkedin.com',
  adobe: 'adobe.com',
  salesforce: 'salesforce.com',
  oracle: 'oracle.com',
  cisco: 'cisco.com',
  ibm: 'ibm.com',
  sap: 'sap.com',
  intel: 'intel.com',
  nvidia: 'nvidia.com',
  qualcomm: 'qualcomm.com',
  amd: 'amd.com',
  broadcom: 'broadcom.com',
  'texas instruments': 'ti.com',
  ti: 'ti.com',
  dell: 'dell.com',
  'dell technologies': 'dell.com',
  hp: 'hp.com',
  'hewlett packard': 'hp.com',
  'hp enterprise': 'hpe.com',
  hpe: 'hpe.com',
  vmware: 'vmware.com',
  servicenow: 'servicenow.com',
  atlassian: 'atlassian.com',
  jira: 'atlassian.com',
  redhat: 'redhat.com',
  'red hat': 'redhat.com',
  intuit: 'intuit.com',
  autodesk: 'autodesk.com',
  stripe: 'stripe.com',
  twilio: 'twilio.com',
  snowflake: 'snowflake.com',
  databricks: 'databricks.com',
  'palo alto networks': 'paloaltonetworks.com',
  paloalto: 'paloaltonetworks.com',
  fortinet: 'fortinet.com',
  crowdstrike: 'crowdstrike.com',
  splunk: 'splunk.com',
  elastic: 'elastic.co',
  mongodb: 'mongodb.com',
  cloudflare: 'cloudflare.com',
  datadog: 'datadoghq.com',
  dynatrace: 'dynatrace.com',
  workday: 'workday.com',
  zoom: 'zoom.us',
  slack: 'slack.com',
  dropbox: 'dropbox.com',
  box: 'box.com',
  shopify: 'shopify.com',
  hubspot: 'hubspot.com',
  zendesk: 'zendesk.com',
  pagerduty: 'pagerduty.com',
  hashicorp: 'hashicorp.com',
  gitlab: 'gitlab.com',
  github: 'github.com',
  canonical: 'canonical.com',
  ubuntu: 'ubuntu.com',
  suse: 'suse.com',
  synopsys: 'synopsys.com',
  cadence: 'cadence.com',
  arm: 'arm.com',
  marvell: 'marvell.com',
  micron: 'micron.com',
  asml: 'asml.com',
  tsmc: 'tsmc.com',
  western: 'westerndigital.com',
  'western digital': 'westerndigital.com',
  seagate: 'seagate.com',
  kingston: 'kingston.com',
  logitech: 'logitech.com',
  corsair: 'corsair.com',
  razer: 'razer.com',
  asus: 'asus.com',
  acer: 'acer.com',
  lenovo: 'lenovo.com',
  sony: 'sony.com',
  panasonic: 'panasonic.com',
  samsung: 'samsung.com',
  lg: 'lg.com',
  philips: 'philips.com',

  // Top Indian Unicorns, Product Startups & FinTech
  zoho: 'zoho.com',
  'zoho corp': 'zoho.com',
  jio: 'jio.com',
  'reliance jio': 'jio.com',
  swiggy: 'swiggy.com',
  zomato: 'zomato.com',
  flipkart: 'flipkart.com',
  paytm: 'paytm.com',
  razorpay: 'razorpay.com',
  phonepe: 'phonepe.com',
  cred: 'cred.club',
  meesho: 'meesho.com',
  zepto: 'zepto.com',
  blinkit: 'blinkit.com',
  grofers: 'blinkit.com',
  ola: 'olacabs.com',
  'ola cabs': 'olacabs.com',
  'ola electric': 'olaelectric.com',
  inmobi: 'inmobi.com',
  nykaa: 'nykaa.com',
  policybazaar: 'policybazaar.com',
  zerodha: 'zerodha.com',
  groww: 'groww.in',
  upstox: 'upstox.com',
  dream11: 'dream11.com',
  games24x7: 'games24x7.com',
  postman: 'postman.com',
  hasura: 'hasura.io',
  browserstack: 'browserstack.com',
  freshworks: 'freshworks.com',
  freshdesk: 'freshworks.com',
  khatabook: 'khatabook.com',
  bharatpe: 'bharatpe.com',
  sharechat: 'sharechat.com',
  moj: 'mojapp.in',
  apna: 'apna.co',
  unacademy: 'unacademy.com',
  physicswallah: 'pw.live',
  pw: 'pw.live',
  vedantu: 'vedantu.com',
  byjus: 'byjus.com',
  'urban company': 'urbancompany.com',
  urbanclap: 'urbancompany.com',
  delhivery: 'delhivery.com',
  shadowfax: 'shadowfax.in',
  dunzo: 'dunzo.com',
  rapido: 'rapido.bike',
  lenskart: 'lenskart.com',
  curefit: 'cult.fit',
  cultfit: 'cult.fit',
  carwale: 'carwale.com',
  cardekho: 'cardekho.com',
  spinny: 'spinny.com',
  cars24: 'cars24.com',
  purplle: 'purplle.com',
  mamaearth: 'mamaearth.in',
  sugar: 'sugarcosmetics.com',
  boat: 'boat-lifestyle.com',
  noise: 'gonoise.com',
  fireboltt: 'fireboltt.com',
  clevertap: 'clevertap.com',
  moengage: 'moengage.com',
  webengage: 'webengage.com',
  chargebee: 'chargebee.com',
  darwinbox: 'darwinbox.com',
  leena: 'leena.ai',
  yellow: 'yellow.ai',
  haptik: 'haptik.ai',
  sprinklr: 'sprinklr.com',
  whatfix: 'whatfix.com',
  highradius: 'highradius.com',
  gupshup: 'gupshup.io',
  glance: 'glance.com',
  dailyhunt: 'dailyhunt.in',
  pocket: 'pocketaces.com',
  mpl: 'mpl.live',
  winzo: 'winzogames.com',
  gameskraft: 'gameskraft.com',
  navifinserv: 'navi.com',
  navi: 'navi.com',
  slice: 'sliceit.com',
  uni: 'uni.cards',
  onecard: 'getonecard.app',
  jupiter: 'jupiter.money',
  fi: 'fi.money',
  famapp: 'famapp.in',
  fampay: 'famapp.in',
  niyo: 'goniyo.com',
  jar: 'myjar.app',
  smallcase: 'smallcase.com',
  dezerv: 'dezerv.in',
  indmoney: 'indmoney.com',
  kuvera: 'kuvera.in',
  etmoney: 'etmoney.com',
  scripbox: 'scripbox.com',
  coinbase: 'coinbase.com',
  binance: 'binance.com',
  coindcx: 'coindcx.com',
  wazirx: 'wazirx.com',
  coinswitch: 'coinswitch.co',

  // Banking, FinTech, Investment Banking & Quant
  'goldman sachs': 'goldmansachs.com',
  gs: 'goldmansachs.com',
  'morgan stanley': 'morganstanley.com',
  'jp morgan': 'jpmorgan.com',
  'jpmorgan chase': 'jpmorganchase.com',
  jpmc: 'jpmorganchase.com',
  barclays: 'barclays.com',
  hsbc: 'hsbc.com',
  'deutsche bank': 'db.com',
  citi: 'citigroup.com',
  citigroup: 'citigroup.com',
  citibank: 'citibank.com',
  'bank of america': 'bankofamerica.com',
  bofa: 'bankofamerica.com',
  'standard chartered': 'sc.com',
  stanbic: 'sc.com',
  ubs: 'ubs.com',
  'bnp paribas': 'bnpparibas.com',
  'credit suisse': 'credit-suisse.com',
  mastercard: 'mastercard.com',
  visa: 'visa.com',
  'american express': 'americanexpress.com',
  amex: 'americanexpress.com',
  paypal: 'paypal.com',
  'wells fargo': 'wellsfargo.com',
  'bny mellon': 'bnymellon.com',
  blackrock: 'blackrock.com',
  fidelity: 'fidelity.com',
  'fidelity investments': 'fidelity.com',
  'state street': 'statestreet.com',
  nomura: 'nomura.com',
  'societe generale': 'societegenerale.com',
  'macquarie group': 'macquarie.com',
  macquarie: 'macquarie.com',
  'deshaw': 'deshaw.com',
  'd. e. shaw': 'deshaw.com',
  'worldquant': 'worldquant.com',
  'tower research': 'tower-research.com',
  'optiver': 'optiver.com',
  'jane street': 'janestreet.com',
  'jump trading': 'jumptrading.com',
  'citadel': 'citadel.com',
  'two sigma': 'twosigma.com',
  'hdfc bank': 'hdfcbank.com',
  hdfc: 'hdfcbank.com',
  'icici bank': 'icicibank.com',
  icici: 'icicibank.com',
  'axis bank': 'axisbank.com',
  'kotak mahindra': 'kotak.com',
  'kotak bank': 'kotak.com',
  kotak: 'kotak.com',
  sbi: 'sbi.co.in',
  'state bank of india': 'sbi.co.in',
  'yes bank': 'yesbank.in',
  'indusind bank': 'indusind.com',
  'idfc first': 'idfcfirstbank.com',
  'federal bank': 'federalbank.co.in',
  'bandhan bank': 'bandhanbank.com',
  'rbl bank': 'rblbank.com',

  // Management Consulting & Big 4
  mckinsey: 'mckinsey.com',
  'mckinsey & company': 'mckinsey.com',
  bcg: 'bcg.com',
  'boston consulting group': 'bcg.com',
  bain: 'bain.com',
  'bain & company': 'bain.com',
  deloitte: 'deloitte.com',
  'deloitte usi': 'deloitte.com',
  pwc: 'pwc.com',
  pricewaterhousecoopers: 'pwc.com',
  ey: 'ey.com',
  'ernst & young': 'ey.com',
  'ey gds': 'ey.com',
  kpmg: 'kpmg.com',
  'oliver wyman': 'oliverwyman.com',
  kearney: 'kearney.com',
  'alvarez & marsal': 'alvarezandmarsal.com',
  gartner: 'gartner.com',
  mercer: 'mercer.com',
  aon: 'aon.com',
  willis: 'wtwco.com',
  wtw: 'wtwco.com',

  // Core Engineering, Automotive, Electronics & Industrial
  siemens: 'siemens.com',
  bosch: 'bosch.in',
  'robert bosch': 'bosch.in',
  'tata motors': 'tatamotors.com',
  'tata power': 'tatapower.com',
  'tata steel': 'tatasteel.com',
  'bajaj auto': 'bajajauto.com',
  'bajaj finserv': 'bajajfinserv.in',
  mahindra: 'mahindra.com',
  'mahindra & mahindra': 'mahindra.com',
  'mahindra rise': 'mahindra.com',
  'ashok leyland': 'ashokleyland.com',
  'tvs motor': 'tvsmotor.com',
  tvs: 'tvsmotor.com',
  'hero motocorp': 'heromotocorp.com',
  hero: 'heromotocorp.com',
  'royal enfield': 'royalenfield.com',
  'eicher motors': 'eicher.in',
  'maruti suzuki': 'marutisuzuki.com',
  hyundai: 'hyundai.com',
  honda: 'honda2wheelersindia.com',
  toyota: 'toyotabharat.com',
  'mercedes-benz': 'mercedes-benz.com',
  mercedes: 'mercedes-benz.com',
  bmw: 'bmw.com',
  volkswagen: 'volkswagen.com',
  audi: 'audi.com',
  porsche: 'porsche.com',
  volvo: 'volvogroup.com',
  'renault nissan': 'renault-nissan.com',
  'john deere': 'deere.com',
  caterpillar: 'caterpillar.com',
  cat: 'caterpillar.com',
  cummins: 'cummins.com',
  'bharat forge': 'bharatforge.com',
  kirloskar: 'kirloskaroilengines.com',
  'kirloskar brothers': 'kirloskarpumps.com',
  godrej: 'godrej.com',
  abb: 'abb.com',
  'schneider electric': 'se.com',
  schneider: 'se.com',
  honeywell: 'honeywell.com',
  'general electric': 'ge.com',
  ge: 'ge.com',
  alstom: 'alstom.com',
  emerson: 'emerson.com',
  'rockwell automation': 'rockwellautomation.com',
  eaton: 'eaton.com',
  thermax: 'thermaxglobal.com',
  bhel: 'bhel.com',
  ntpc: 'ntpc.co.in',
  ongc: 'ongcindia.com',
  gail: 'gailonline.com',
  iocl: 'iocl.com',
  bpcl: 'bharatpetroleum.in',
  hpcl: 'hindustanpetroleum.com',
  reliance: 'ril.com',
  ril: 'ril.com',
  adanigroup: 'adani.com',
  adani: 'adani.com',
  vedanta: 'vedantalimited.com',
  hindalco: 'hindalco.com',
  jsw: 'jsw.in',
  'jsw steel': 'jsw.in',
  sail: 'sail.co.in',
  suzlon: 'suzlon.com',
  havells: 'havells.com',
  polycab: 'polycab.com',
  crompton: 'crompton.co.in',
  voltas: 'voltas.com',
  blue: 'bluestarindia.com',
  'blue star': 'bluestarindia.com',
  daikin: 'daikin.com',
  carrier: 'carrier.com',
  hitachi: 'hitachi.com',
  mitsubishi: 'mitsubishielectric.com',
  toshiba: 'toshiba.com',
  fujitsu: 'fujitsu.com',
  nec: 'nec.com',
  epson: 'epson.com',
  canon: 'canon.com',
  nikon: 'nikon.com',

  // Telecom, Networking & Cloud Infrastructure
  airtel: 'airtel.in',
  'bharti airtel': 'airtel.in',
  'vodafone idea': 'myvi.in',
  vi: 'myvi.in',
  juniper: 'juniper.net',
  'juniper networks': 'juniper.net',
  arista: 'arista.com',
  'arista networks': 'arista.com',
  nokia: 'nokia.com',
  ericsson: 'ericsson.com',
  'tejas networks': 'tejasnetworks.com',
  'sterlite technologies': 'stl.tech',
  stl: 'stl.tech',
  hfcl: 'hfcl.com',
  tata: 'tatacommunications.com',
  'tata communications': 'tatacommunications.com',
  'tata teleservices': 'tatateleservices.com',

  // Aerospace, Defense, Space & Logistics
  isro: 'isro.gov.in',
  drdo: 'drdo.gov.in',
  hal: 'hal-india.co.in',
  boeing: 'boeing.com',
  airbus: 'airbus.com',
  'lockheed martin': 'lockheedmartin.com',
  'collins aerospace': 'collinsaerospace.com',
  safran: 'safran-group.com',
  'rolls-royce': 'rolls-royce.com',
  'pratt & whitney': 'prattwhitney.com',
  dhl: 'dhl.com',
  fedex: 'fedex.com',
  ups: 'ups.com',
  maersk: 'maersk.com',
  'blue dart': 'bluedart.com',

  // Media, Gaming, EdTech, Healthcare & FMCG
  disney: 'disney.com',
  'hotstar / disney': 'disneyplus.com',
  warner: 'wbd.com',
  ea: 'ea.com',
  'electronic arts': 'ea.com',
  ubisoft: 'ubisoft.com',
  unity: 'unity.com',
  epic: 'epicgames.com',
  'epic games': 'epicgames.com',
  roblox: 'roblox.com',
  unilever: 'unilever.com',
  hul: 'hul.co.in',
  'hindustan unilever': 'hul.co.in',
  pg: 'pg.com',
  'procter & gamble': 'pg.com',
  nestle: 'nestle.com',
  itc: 'itcportal.com',
  marico: 'marico.com',
  dabur: 'dabur.com',
  britannia: 'britannia.co.in',
  amul: 'amul.com',
  parle: 'parleproducts.com',
  mondelez: 'mondelezinternational.com',
  pepsico: 'pepsico.com',
  coca: 'coca-colacompany.com',
  'coca cola': 'coca-colacompany.com',
  sunpharma: 'sunpharma.com',
  'sun pharma': 'sunpharma.com',
  cipla: 'cipla.com',
  drreddys: 'drreddys.com',
  "dr. reddy's": 'drreddys.com',
  lupin: 'lupin.com',
  aurobindo: 'aurobindo.com',
  zydus: 'zyduslife.com',
  torrent: 'torrentpharma.com',
  biocon: 'biocon.com',
  glenmark: 'glenmarkpharma.com',
  mankind: 'mankindpharma.com',
  pfizer: 'pfizer.com',
  novartis: 'novartis.com',
  roche: 'roche.com',
  astrazeneca: 'astrazeneca.com',
  abbott: 'abbott.com',
  johnson: 'jnj.com',
  'johnson & johnson': 'jnj.com',
  jnj: 'jnj.com',
};

/**
 * Resolves any company name or user-specified website/domain into a clean web domain (e.g. "tcs.com").
 * Uses a deep corporate dictionary first, then applies multi-stage heuristic sanitization to accurately
 * resolve any company worldwide.
 */
export function resolveCompanyDomain(companyName: string, customWebsiteOrDomain?: string): string {
  if (customWebsiteOrDomain && customWebsiteOrDomain.trim()) {
    let clean = customWebsiteOrDomain.trim().toLowerCase();
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
    clean = clean.split('/')[0].split('?')[0];
    if (clean.includes('.')) return clean;
  }

  if (!companyName || !companyName.trim()) return '';

  const normalized = companyName.trim().toLowerCase();

  // 1. Direct match in dictionary
  if (KNOWN_COMPANY_DOMAINS[normalized]) {
    return KNOWN_COMPANY_DOMAINS[normalized];
  }

  // 2. Exact word boundary / partial prefix match in dictionary
  for (const [key, domain] of Object.entries(KNOWN_COMPANY_DOMAINS)) {
    if (normalized === key || normalized.startsWith(key + ' ') || normalized.endsWith(' ' + key) || normalized.includes(' ' + key + ' ')) {
      return domain;
    }
  }

  // 3. Algorithmic Multi-stage Sanitization
  let cleaned = normalized
    .replace(/^(m\/s|m\/s\.|the)\s+/i, '')
    .replace(/\s+(pvt\.?|private|ltd\.?|limited|llc|inc\.?|incorporated|corp\.?|corporation|technologies|technology|tech|solutions|services|systems|infotech|india|international|global|enterprises|software|labs|digital|group|consulting|consultancy|ventures|holdings)\b/gi, '')
    .trim();

  if (!cleaned) cleaned = normalized;

  // Check dictionary again with cleaned name
  if (KNOWN_COMPANY_DOMAINS[cleaned]) {
    return KNOWN_COMPANY_DOMAINS[cleaned];
  }

  // Remove spaces, punctuation, special symbols
  const domainSlug = cleaned.replace(/[^a-z0-9]/g, '');
  if (!domainSlug) return '';

  return `${domainSlug}.com`;
}

/**
 * Primary vector/high-res Clearbit logo URL
 */
export function getClearbitLogoUrl(domain: string): string {
  if (!domain) return '';
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Highly reliable Google Favicon & HD Web Icon API (128px)
 */
export function getGoogleFaviconUrl(domain: string, size = 128): string {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/**
 * DuckDuckGo Icon API
 */
export function getDuckDuckGoIconUrl(domain: string): string {
  if (!domain) return '';
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

/**
 * Computes the best auto-fetched logo URL for a company name.
 * If user provided an absolute image URL (starts with http/https and ends in image ext or already a logo link), returns it directly.
 */
export function getAutoCompanyLogoUrl(companyName: string, customDomainOrUrl?: string): string {
  if (customDomainOrUrl && (customDomainOrUrl.startsWith('http://') || customDomainOrUrl.startsWith('https://'))) {
    if (customDomainOrUrl.includes('clearbit.com') || customDomainOrUrl.includes('favicons') || customDomainOrUrl.match(/\.(png|jpg|jpeg|svg|webp|ico)(\?.*)?$/i)) {
      return customDomainOrUrl;
    }
  }

  const domain = resolveCompanyDomain(companyName, customDomainOrUrl);
  if (!domain) return '';

  return getClearbitLogoUrl(domain);
}

/**
 * Generates 1-2 letter uppercase monogram from company name (e.g. "TCS" -> "TC", "PHN Technologies" -> "PH")
 */
export function getCompanyInitials(companyName: string): string {
  if (!companyName) return 'CO';
  const parts = companyName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Dynamic color palette for company fallback avatar badges
 */
const GRADIENT_PALETTES = [
  { bg: 'from-blue-600 to-indigo-700', text: 'text-white', border: 'border-blue-200' },
  { bg: 'from-emerald-600 to-teal-700', text: 'text-white', border: 'border-emerald-200' },
  { bg: 'from-violet-600 to-purple-800', text: 'text-white', border: 'border-purple-200' },
  { bg: 'from-amber-600 to-orange-700', text: 'text-white', border: 'border-amber-200' },
  { bg: 'from-cyan-600 to-blue-700', text: 'text-white', border: 'border-cyan-200' },
  { bg: 'from-rose-600 to-pink-700', text: 'text-white', border: 'border-rose-200' },
  { bg: 'from-sky-600 to-blue-800', text: 'text-white', border: 'border-sky-200' },
  { bg: 'from-teal-600 to-emerald-800', text: 'text-white', border: 'border-teal-200' },
  { bg: 'from-fuchsia-600 to-purple-700', text: 'text-white', border: 'border-fuchsia-200' },
];

export function getCompanyColorGradient(companyName: string) {
  if (!companyName) return GRADIENT_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
}
