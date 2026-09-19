import fs from 'fs'
const mockData = fs.readFileSync('src/data/mockData.js', 'utf8')
// extract ZONES array from mockData string
const zonesMatch = mockData.match(/export const ZONES = (\[[\s\S]*?\])\n/);
if (zonesMatch) {
  const zones = eval(zonesMatch[1]);
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  zones.forEach(z => {
    // using the formulas we patched into CrowdMap
    // wait, ZONES in mockData.js doesn't have lng/lat natively if it's the old array?
    // Let's check mockData.js
  })
}
