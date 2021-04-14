const fs = require('fs');
const program = require('commander');

const { LocationParser } = require('./lib/parser');
const { KMLGenerator } = require('./lib/kml-generator');
const { deltaDegreesFromMeters, circlePoints } = require('./lib/gps-util');

program.version('0.0.1');
program
  .requiredOption('-f, --file <filename>', 'set the input CSV file')
  // TODO: add timezone support
  // .option('-t, --timezone <zoneIdentifier>', 'set the timezone of KML timestamps')
  .option('-o, --output <filename>', 'set the output file path (defaults to stdout)')
  .on('--help', () => {
    console.log(`
Examples:
  --timezone America/New_York
`
    )
  })
  .parse(process.argv);

main();


function main() {
  let csvColumns = [
    { key: 'timestamp', type: 'date' },
    { key: 'latitude', type: 'coordinate' },
    { key: 'longitude', type: 'coordinate' },
    { key: 'radius', type: 'meters' },
    { key: 'source', type: 'string' },
    { key: 'device', type: 'string' },
    { key: 'platform', type: 'string' },
    { key: 'wifi', type: 'list_wifi' },
  ];
  let parser = new LocationParser({
    filename: program.opts().file,
    csvColumns: csvColumns,
    timezone: program.opts().timezone,
  });

  let generator = new KMLGenerator();
  let kmlLines = [];

  let start = parser.getFirstLocation();
  let end = parser.getLastLocation();

  kmlLines.push(generator.head());
  kmlLines.push(generator.style());
  kmlLines.push(generator.placemark({
    x: start.x,
    y: start.y,
    name: 'Start',
    description: 'This is the first recorded location',
    styleId: 'go',
  }));
  kmlLines.push(generator.route({ coordinates: parser.getAllCoordinateStrings()}));
  kmlLines.push(generator.placemark({
    x: end.x,
    y: end.y,
    name: 'Finish',
    description: 'This is the last recorded location',
    styleId: 'stop',
  }));
  kmlLines.push(generator.openFolder({ name: 'WiFi Results'}));
  kmlLines.push(parser.getAllWifiLocations().map(wifiScan => {
    return generator.placemark({
      x: wifiScan.location.x,
      y: wifiScan.location.y,
      styleId: 'wifi',
      name: 'Wifi Scan',
      when: wifiScan.location.timestamp,
      html: true,
      description: wifiScan.wifi.map(item => {
        return '<span style="color: blue;">' 
          + item.ssid 
          + '</span> <span style="color: gray;">' 
          + item.mac 
          + '</span> <i>rssi:' 
          + item.rssi 
          + '</i><br>';
      }).join(''),
    });
  }));
  kmlLines.push(generator.closeFolder());
  kmlLines.push(generator.openFolder({ name: 'GPS Radii'}));
  kmlLines.push(parser.getAllLocations().map(loc => {
    let [ x, y ] = deltaDegreesFromMeters(loc.radius, loc.x);
    return generator.polygon({
      name: 'GPS radius: ' + loc.radius + ' meters',
      points: circlePoints(x, y, loc.x, loc.y),
      when: loc.timestamp,
    });
  }).join(''));
  kmlLines.push(generator.closeFolder());
  kmlLines.push(generator.tail());
  const output = program.opts().output;
  if (output) {
    fs.writeFileSync(output, kmlLines.join('\n'));
  } else {
    console.log(kmlLines.join('\n'));
  }
}
