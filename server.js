const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Load a local .env file for convenient setup; real process environment values win.
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const INDEX = path.join(__dirname, 'index.html');
const PHONE = process.env.NOTIFY_PHONE || '+917774004950';
const sessions = new Map();
const destinations = [
  { id:'bali', name:'Bali, Indonesia', region:'Southeast Asia', country:'Indonesia', city:'Ubud & Uluwatu', category:'Island escape', price:54900, days:6, rating:4.9, image:'photo-1537996194471-e657df975ab4', gallery:['photo-1518548419970-58e3b4079ab2','photo-1516690561799-46d8f74f9abf','photo-1537996194471-e657df975ab4'], tag:'BESTSELLER', description:'Rice terraces, beach sunsets and a slower kind of magic.', overview:'Follow the island from emerald rice fields to the edge of the Indian Ocean. Meet local makers, cool off beneath a waterfall and leave enough time for one more sunset.', bestTime:'April – October', language:'Indonesian · English widely spoken', currency:'Indonesian rupiah (IDR)', highlights:['Walk the Tegallalang rice terraces with a local guide','Visit a water temple and learn its traditions','Watch the sunset from Uluwatu’s clifftop','Small-group transfers and locally run stays'], itinerary:[['01','Arrive in Ubud','Settle into your garden stay and share a relaxed welcome dinner.'],['02','Green Bali','Walk the rice terraces, meet a coffee grower and take the afternoon slowly.'],['03','Water & ritual','Visit a sacred water temple with a local host, then enjoy a free evening.'],['04','The coast road','Travel south through island villages to your clifftop stay.'],['05','Saltwater day','Choose a beach, try a surf lesson or simply stay by the pool.'],['06','One last sunrise','Breakfast together before your onward journey.']] },
  { id:'kyoto', name:'Kyoto, Japan', region:'East Asia', country:'Japan', city:'Kyoto', category:'Culture & calm', price:72900, days:5, rating:4.9, image:'photo-1493976040374-85c8e12f0c0e', gallery:['photo-1478436127897-769e1b3f0f36','photo-1528360983277-13d401cdc186','photo-1493976040374-85c8e12f0c0e'], tag:'CULTURE PICK', description:'Lantern-lit lanes, quiet temples and the art of wandering.', overview:'Find the quieter corners of Kyoto with people who call it home. From a morning temple walk to a neighborhood noodle counter, this is a city best met one thoughtful step at a time.', bestTime:'March – May · October – November', language:'Japanese · English visitor support', currency:'Japanese yen (JPY)', highlights:['Early morning walk through a temple district','Tea and seasonal sweets with a local host','Explore lantern-lit Gion at dusk','Free time for gardens, galleries and cafés'], itinerary:[['01','Welcome to Kyoto','Check in, stretch your legs and meet over a seasonal supper.'],['02','Temple morning','Visit a hillside temple before the crowds and wander its lanes.'],['03','Tea & craft','Learn about Japanese tea, then meet a neighborhood craft maker.'],['04','Your Kyoto','Keep the day open for gardens, markets or a day trip.'],['05','Say mata ne','A slow breakfast and a last walk through the neighborhood.']] },
  { id:'amalfi', name:'Amalfi Coast, Italy', region:'Europe', country:'Italy', city:'Amalfi · Ravello · Positano', category:'Coastal escape', price:98400, days:7, rating:4.8, image:'photo-1533105079780-92b9be482077', gallery:['photo-1516483638261-f4dbaf036963','photo-1498307833015-e7b400441eb8','photo-1533105079780-92b9be482077'], tag:'LIMITED SEATS', description:'Cliffside villages and long lunches beside the blue.', overview:'Take the scenic way between seaside villages, gardens and family kitchens. There is time for a boat ride, a long lunch and the kind of afternoon that refuses to be hurried.', bestTime:'May – June · September – October', language:'Italian · English visitor support', currency:'Euro (EUR)', highlights:['Stay in a family-run coastal guesthouse','Walk the lemon groves above Amalfi','Boat day along the coastline, weather permitting','A hands-on regional cooking evening'], itinerary:[['01','Arrive by the sea','Meet your host and enjoy an easy dinner near the water.'],['02','Amalfi lanes','Explore the old town, cathedral square and lemon gardens.'],['03','Path of the Gods','Walk a panoramic trail with a local guide.'],['04','On the water','See the coast from a small boat, then swim in a quiet cove.'],['05','Ravello gardens','Take the bus uphill for villa gardens and wide sea views.'],['06','The long lunch','Cook and share a regional meal with a local family.'],['07','Arrivederci','Breakfast together before departure.']] },
  { id:'ladakh', name:'Ladakh, India', region:'India', country:'India', city:'Leh · Nubra Valley', category:'Mountain trail', price:38900, days:6, rating:4.9, image:'photo-1472396961693-142e6e269027', gallery:['photo-1500530855697-b586d89ba3ee','photo-1464822759023-fed622ff2c3b','photo-1472396961693-142e6e269027'], tag:'INDIA FAVOURITE', description:'Big skies, high passes and silence that stays with you.', overview:'Give yourself time to settle into the altitude, then explore Ladakh’s high desert with a local mountain guide. Monasteries, river valleys and wide-open landscapes make each day feel expansive.', bestTime:'June – September', language:'Ladakhi · Hindi · English', currency:'Indian rupee (INR)', highlights:['Two nights to acclimatize in Leh','Visit a hilltop monastery with a local guide','Cross the Khardung La route to Nubra Valley','Small group, private vehicle and local guesthouses'], itinerary:[['01','Welcome to Leh','Arrive gently, hydrate and rest at your guesthouse.'],['02','Easy acclimatization','A relaxed town walk and monastery visit at an easy pace.'],['03','Into the mountains','Drive through high passes to Nubra Valley, with photo stops.'],['04','Nubra day','Visit a village, walk beside the river and share a home-style meal.'],['05','Back to Leh','Return over the mountains and spend a quiet final evening.'],['06','Homeward','Breakfast and onward travel.']] },
  { id:'marrakech', name:'Marrakech, Morocco', region:'North Africa', country:'Morocco', city:'Marrakech & Atlas foothills', category:'City & culture', price:61900, days:5, rating:4.8, image:'photo-1539020140153-e479b8c22e70', gallery:['photo-1489749798305-4fea3ae63d43','photo-1539020140153-e479b8c22e70','photo-1512632578888-169bbbc64f33'], tag:'LOCAL FAVOURITE', description:'A sensory maze of souks, courtyards and mint tea.', overview:'Let a local host introduce you to the medina’s colors, sounds and small rituals. Step out to the Atlas foothills for a slower day and return to the city for a rooftop meal.', bestTime:'March – May · September – November', language:'Arabic · Amazigh · French', currency:'Moroccan dirham (MAD)', highlights:['Medina walk with a licensed local guide','Visit a traditional riad and its courtyard garden','Atlas foothills day with a village lunch','Market-to-table cooking experience'], itinerary:[['01','A warm welcome','Arrive at your riad, then meet for mint tea and supper.'],['02','Inside the medina','Follow your guide through souks, workshops and hidden courtyards.'],['03','Atlas foothills','Drive into the mountains for a gentle walk and village lunch.'],['04','Cook & wander','Shop for ingredients, cook together and enjoy a free afternoon.'],['05','One last tea','Breakfast on the rooftop before your onward journey.']] },
  { id:'santorini', name:'Santorini, Greece', region:'Europe', country:'Greece', city:'Fira · Oia · Pyrgos', category:'Island escape', price:112000, days:6, rating:4.9, image:'photo-1533105079780-92b9be482077', gallery:['photo-1603565816030-6b389eeb23cb','photo-1570077188670-e3a8d69ac5ff','photo-1533105079780-92b9be482077'], tag:'HONEYMOON PICK', description:'Whitewashed paths, caldera views and the last light of day.', overview:'Explore beyond the famous blue domes: walk a caldera trail, meet a small winery and find a quieter side of the island. The days are planned with room for a long swim and a slow sunset.', bestTime:'May – June · September – October', language:'Greek · English widely spoken', currency:'Euro (EUR)', highlights:['Guided caldera path walk between villages','Small family winery visit and tasting','A boat afternoon in the volcanic caldera','Stay in a locally owned guesthouse'], itinerary:[['01','Island arrival','Settle in and watch the evening light from your village.'],['02','Caldera walk','Follow the cliff path with a local guide and picnic stop.'],['03','Your island day','Choose a beach, archeological site or a very slow morning.'],['04','Sea & volcano','Take a small-group boat trip around the caldera.'],['05','Vineyards at dusk','Visit a family winery and share a final island dinner.'],['06','Kalo taxidi','Breakfast and onward travel.']] }
];

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { const initial = { users: [], bookings: [] }; save(initial); return initial; }
}
function save(db) { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function json(res, status, value) { res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'access-control-allow-origin':'*' }); res.end(JSON.stringify(value)); }
function readBody(req) { return new Promise((resolve, reject) => { let data=''; req.on('data', d => { data += d; if (data.length > 1e6) reject(new Error('Request too large')); }); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('Invalid JSON')); } }); }); }
function auth(req) { const token = (req.headers.authorization || '').replace(/^Bearer\s+/i,''); return sessions.get(token); }
function safeUser(u) { return { id:u.id, name:u.name, email:u.email }; }
function hash(password, salt = crypto.randomBytes(16).toString('hex')) { return { salt, hash:crypto.scryptSync(password, salt, 64).toString('hex') }; }
function passwordMatches(password, user) { return crypto.timingSafeEqual(Buffer.from(hash(password, user.salt).hash, 'hex'), Buffer.from(user.passwordHash, 'hex')); }
async function notify(booking) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) return { sent:false, reason:'SMS provider is not configured' };
  const form = new URLSearchParams({ To:PHONE, From:process.env.TWILIO_FROM_NUMBER, Body:`New Wayfarer booking ${booking.reference}: ${booking.name} booked ${booking.destination} for ${booking.travelDate} (${booking.travelers} traveller${booking.travelers === 1 ? '' : 's'}).` });
  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const authHeader = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  try {
    const response = await fetch(url, { method:'POST', headers:{ authorization:`Basic ${authHeader}`, 'content-type':'application/x-www-form-urlencoded' }, body:form });
    return response.ok ? { sent:true } : { sent:false, reason:`SMS provider returned ${response.status}` };
  } catch { return { sent:false, reason:'SMS provider request failed' }; }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin':'*', 'access-control-allow-headers':'content-type,authorization', 'access-control-allow-methods':'GET,POST,OPTIONS' }); return res.end(); }
    if (url.pathname === '/api/destinations' && req.method === 'GET') return json(res, 200, destinations);
    if (url.pathname === '/api/register' && req.method === 'POST') {
      const { name, email, password } = await readBody(req);
      if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8) return json(res, 400, { error:'Enter a name, valid email and password of at least 8 characters.' });
      const db = load(); if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) return json(res, 409, { error:'An account with this email already exists.' });
      const credentials = hash(password); const user = { id:crypto.randomUUID(), name:name.trim(), email:email.toLowerCase(), ...credentials, passwordHash:credentials.hash, createdAt:new Date().toISOString() }; delete user.hash;
      db.users.push(user); save(db); const token = crypto.randomUUID(); sessions.set(token, user.id); return json(res, 201, { token, user:safeUser(user) });
    }
    if (url.pathname === '/api/login' && req.method === 'POST') {
      const { email, password } = await readBody(req); const user = load().users.find(u => u.email === (email || '').toLowerCase());
      if (!user || !passwordMatches(password || '', user)) return json(res, 401, { error:'Email or password is incorrect.' });
      const token = crypto.randomUUID(); sessions.set(token, user.id); return json(res, 200, { token, user:safeUser(user) });
    }
    if (url.pathname === '/api/me' && req.method === 'GET') { const id = auth(req); const user = id && load().users.find(u => u.id === id); return user ? json(res, 200, safeUser(user)) : json(res, 401, { error:'Please sign in.' }); }
    if (url.pathname === '/api/bookings' && req.method === 'POST') {
      const id = auth(req); const db = load(); const user = id && db.users.find(u => u.id === id); if (!user) return json(res, 401, { error:'Sign in to reserve your trip.' });
      const { destinationId, travelDate, travelers } = await readBody(req); const destination = destinations.find(d => d.id === destinationId); const count = Number(travelers); const date = new Date(`${travelDate}T00:00:00`);
      if (!destination || !/^\d{4}-\d{2}-\d{2}$/.test(travelDate || '') || Number.isNaN(date.valueOf()) || date < new Date(new Date().toDateString()) || !Number.isInteger(count) || count < 1 || count > 12) return json(res, 400, { error:'Choose a valid trip date and 1–12 travellers.' });
      const booking = { id:crypto.randomUUID(), reference:`WF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`, userId:user.id, name:user.name, email:user.email, destinationId, destination:destination.name, travelDate, travelers:count, total:destination.price * count, status:'Received', createdAt:new Date().toISOString(), notification:'Pending' };
      db.bookings.push(booking); save(db); const notice = await notify(booking); booking.notification = notice.sent ? 'Sent' : notice.reason; save(db);
      return json(res, 201, { booking:{ ...booking }, notification:notice.sent ? 'sent' : notice.reason === 'SMS provider is not configured' ? 'not_configured' : 'failed', notificationMessage:notice.reason || null });
    }
    if (url.pathname === '/api/bookings' && req.method === 'GET') { const id = auth(req); if (!id) return json(res, 401, { error:'Please sign in.' }); return json(res, 200, load().bookings.filter(b => b.userId === id).reverse()); }
    if (url.pathname === '/api/admin/bookings' && req.method === 'GET') {
      if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return json(res, 403, { error:'Admin access is not configured or the key is incorrect.' });
      return json(res, 200, load().bookings.slice().reverse());
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error:'API route not found.' });
    if (req.method === 'GET' && url.pathname.startsWith('/destinations/')) { res.writeHead(200, { 'content-type':'text/html; charset=utf-8' }); return fs.createReadStream(path.join(__dirname, 'destination.html')).pipe(res); }
    if (req.method === 'GET') { res.writeHead(200, { 'content-type':'text/html; charset=utf-8' }); return fs.createReadStream(INDEX).pipe(res); }
    res.writeHead(404); res.end('Not found');
  } catch (error) { json(res, 500, { error:'Something went wrong. Please try again.' }); }
});
server.listen(PORT, () => console.log(`Wayfarer is running at http://localhost:${PORT}`));
