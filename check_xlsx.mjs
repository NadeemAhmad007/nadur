import XLSX from 'xlsx';

const wb = XLSX.readFile('C:\\Users\\H68618\\Downloads\\thunderbit_active_wa.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

console.log('Columns found:', Object.keys(data[0]).join(', '));
console.log('Total rows:', data.length);
console.log('');

// Find columns that might contain maps URLs or houseboat names
const cols = Object.keys(data[0]);
const nameCol = cols.find(c => /name|houseboat|business|title/i.test(c));
const mapsCol = cols.find(c => /maps|google|location|map|url|link/i.test(c));

console.log('Name column:', nameCol);
console.log('Maps URL column:', mapsCol);
console.log('');

let found = 0;
const validUrls = [];

for (const row of data) {
  const mapsUrl = mapsCol ? String(row[mapsCol] || '').trim() : '';
  const name = nameCol ? String(row[nameCol] || '').trim() : 'unknown';

  if (mapsUrl && mapsUrl.length > 0) {
    found++;
    const valid = /google\.com\/maps|google\.maps|maps\.app\.goo\.gl|@-?\d+\.?\d*,-?\d+\.?\d*|q=.*-?\d+/.test(mapsUrl);
    if (valid) {
      validUrls.push({ name, url: mapsUrl });
      console.log('VALID: ' + name + ' -> ' + mapsUrl);
    } else {
      console.log('INVALID: ' + name + ' -> ' + mapsUrl);
    }
  }
}

console.log('');
console.log('Rows with any maps URL: ' + found + ' / ' + data.length);
console.log('Valid Google Maps URLs: ' + validUrls.length);

// Extract coordinates from valid URLs
console.log('');
console.log('=== Extracted Coordinates ===');
for (const item of validUrls) {
  const atMatch = item.url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  const qMatch = item.url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  const llMatch = item.url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    console.log(item.name + ' | lat: ' + atMatch[1] + ' lng: ' + atMatch[2]);
  } else if (qMatch) {
    console.log(item.name + ' | lat: ' + qMatch[1] + ' lng: ' + qMatch[2]);
  } else if (llMatch) {
    console.log(item.name + ' | lat: ' + llMatch[1] + ' lng: ' + llMatch[2]);
  }
}
