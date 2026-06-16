import XLSX from 'xlsx';
import { writeFileSync } from 'fs';

const wb = XLSX.readFile('C:\\Users\\H68618\\Downloads\\thunderbit_active_wa.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(ws['!ref']);

const h = {};
for (let C = range.s.c; C <= range.e.c; C++) {
  const a = XLSX.utils.encode_cell({ r: range.s.r, c: C });
  const c = ws[a];
  if (c) h[String(c.v).trim()] = C;
}

const gateCoords = {
  1:[34.103,74.868], 2:[34.105,74.870], 3:[34.107,74.872],
  4:[34.109,74.873], 5:[34.111,74.875], 6:[34.113,74.877],
  7:[34.115,74.878], 8:[34.117,74.876], 9:[34.115,74.873],
  10:[34.117,74.870], 11:[34.118,74.867], 12:[34.116,74.865],
  13:[34.114,74.863], 14:[34.112,74.861], 15:[34.110,74.860],
  16:[34.108,74.862], 17:[34.106,74.864], 18:[34.104,74.866],
};

// Simple hash function that returns a deterministic number from a string
function hashCode(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getCoords(loc, name) {
  if (!loc) {
    // Jitter from default center using name hash
    const hash = hashCode(name);
    const latJitter = (hash % 201 - 100) / 100000; // -0.001 to +0.001 (~111m)
    const lngJitter = ((hash >> 8) % 201 - 100) / 100000;
    return [34.110 + latJitter, 74.868 + lngJitter];
  }
  const l = loc.toLowerCase();
  const m = loc.match(/(?:Gate|Ghat)\D*(\d{1,2})/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (gateCoords[n]) {
      // Add slight jitter for boats at same gate
      const hash = hashCode(name);
      const j = ((hash % 101) - 50) / 100000;
      const j2 = (((hash >> 4) % 101) - 50) / 100000;
      return [gateCoords[n][0] + j, gateCoords[n][1] + j2];
    }
  }
  const hash = hashCode(name);
  const latJitter = (hash % 201 - 100) / 100000;
  const lngJitter = ((hash >> 8) % 201 - 100) / 100000;

  if (l.includes('nehru park')) return [34.100 + latJitter, 74.870 + lngJitter];
  if (l.includes('chinar')) return [34.108 + latJitter, 74.850 + lngJitter];
  if (l.includes('mamta')) return [34.120 + latJitter, 74.878 + lngJitter];
  return [34.110 + latJitter, 74.868 + lngJitter];
}

const boats = [];
for (let R = range.s.r + 1; R <= range.e.r; R++) {
  const gn = ws[XLSX.utils.encode_cell({ r: R, c: h['Houseboat Name'] })];
  const gl = ws[XLSX.utils.encode_cell({ r: R, c: h['Location'] })];
  const gm = ws[XLSX.utils.encode_cell({ r: R, c: h['Maps URL'] })];
  const name = gn ? String(gn.v).trim() : '';
  const location = gl ? String(gl.v).trim() : '';
  const hasMaps = gm && gm.l && gm.l.Target && /google\.com\/maps/.test(gm.l.Target);
  const [lat, lng] = getCoords(location, name);
  boats.push({ name, location, hasMaps, lat: Math.round(lat * 100000) / 100000, lng: Math.round(lng * 100000) / 100000 });
}

const sql = boats.map(b =>
  `UPDATE operators SET lat = ${b.lat}, lng = ${b.lng} WHERE LOWER(name) = LOWER('${b.name.replace(/'/g, "''")}');`
).join('\n');

writeFileSync('update_coords.sql', sql);
writeFileSync('coords.json', JSON.stringify(boats, null, 2));

const groups = {};
boats.forEach(b => {
  const k = `${b.lat.toFixed(3)},${b.lng.toFixed(3)}`;
  groups[k] = (groups[k] || 0) + 1;
});

const uniqueExact = new Set(boats.map(b => `${b.lat},${b.lng}`)).size;
console.log(`Total: ${boats.length}`);
console.log(`With Maps URLs: ${boats.filter(b => b.hasMaps).length}`);
console.log(`Unique coordinates: ${uniqueExact}`);
console.log('\nSaved update_coords.sql and coords.json');
