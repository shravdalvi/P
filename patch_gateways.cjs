const fs = require('fs');
let code = fs.readFileSync('src/pages/LiveMap.jsx', 'utf8');

// 1. Remove GATEWAYS array
code = code.replace(/const GATEWAYS = \[\s*\{ id: 'GW-01'[\s\S]*?\]/, '');

// 2. Remove rendering block
const renderBlock = /\/\/ Render IoT Gateway Markers[\s\S]*?setMapReady\(true\)/;
code = code.replace(renderBlock, 'setMapReady(true)');

// 3. Remove showDevices state
code = code.replace(/const \[showDevices, setShowDevices\] = useState\(true\)\n/, '');

// 4. Remove effect dependency
code = code.replace(/if \(type === 'device'\) el\.style\.display = showDevices \? 'block' : 'none'\n/, '');
code = code.replace(/}, \[showGates, showDevices\]\)/, '}, [showGates])');

// 5. Remove UI button
const buttonBlock = /<button\n\s*onClick=\{.*?setShowDevices[\s\S]*?<\/button>/;
code = code.replace(buttonBlock, '');

fs.writeFileSync('src/pages/LiveMap.jsx', code);
