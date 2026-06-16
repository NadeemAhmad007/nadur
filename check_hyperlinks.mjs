import XLSX from 'xlsx';

const wb = XLSX.readFile('C:\\Users\\H68618\\Downloads\\thunderbit_active_wa.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];

// Check for hyperlinks in the sheet
const range = XLSX.utils.decode_range(ws['!ref']);
const hyperlinks = [];

// xlsx library stores hyperlinks in cell objects
for (let R = range.s.r; R <= range.e.r; R++) {
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C });
    const cell = ws[addr];
    if (cell && cell.l && cell.l.Target) {
      hyperlinks.push({
        row: R,
        col: C,
        colName: XLSX.utils.encode_col(C),
        target: cell.l.Target,
        display: cell.v || cell.w || '',
      });
    }
  }
}

console.log('Total hyperlinks found in sheet: ' + hyperlinks.length);
console.log('');

// Find the column headers from row 0
const headers = {};
const headerRow = range.s.r;
for (let C = range.s.c; C <= range.e.c; C++) {
  const addr = XLSX.utils.encode_cell({ r: headerRow, c: C });
  const cell = ws[addr];
  if (cell) headers[C] = String(cell.v || '');
}

console.log('Hyperlinks by column:');
const byCol = {};
for (const h of hyperlinks) {
  const colName = headers[h.col] || h.colName;
  if (!byCol[colName]) byCol[colName] = [];
  byCol[colName].push(h);
}

for (const [colName, links] of Object.entries(byCol)) {
  console.log('  ' + colName + ': ' + links.length + ' hyperlinks');
  for (const link of links.slice(0, 5)) {
    console.log('    Row ' + link.row + ': "' + link.display + '" -> ' + link.target.substring(0, 150));
  }
  if (links.length > 5) console.log('    ... and ' + (links.length - 5) + ' more');
}

console.log('');
console.log('=== Checking Maps-related columns specifically ===');
const mapsCols = ['Maps URL', 'Location', 'Website', 'Phone (from Google)'];
const colIndex = {};
for (let C = range.s.c; C <= range.e.c; C++) {
  const addr = XLSX.utils.encode_cell({ r: headerRow, c: C });
  const cell = ws[addr];
  if (cell) colIndex[String(cell.v || '')] = C;
}

for (const colName of mapsCols) {
  const C = colIndex[colName];
  if (C == null) { console.log(colName + ': column not found'); continue; }
  const links = hyperlinks.filter(h => h.col === C);
  console.log(colName + ': ' + links.length + ' hyperlinks');
  for (const link of links) {
    const nameAddr = XLSX.utils.encode_cell({ r: link.row, c: colIndex['Houseboat Name'] });
    const nameCell = ws[nameAddr];
    const name = nameCell ? String(nameCell.v || '') : 'unknown';
    const isValidMaps = /google\.com\/maps|maps\.app\.goo\.gl|@-?\d+\.?\d*,-?\d+\.?\d*/.test(link.target);
    console.log('  ' + name + ' -> ' + link.target.substring(0, 150) + (isValidMaps ? ' [VALID]' : ' [INVALID]'));
  }
}
