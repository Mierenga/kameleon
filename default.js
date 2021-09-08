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
  .option('-c, --columns <columns>', `comma separated string of ordered column names
                         - recognized: "time,long,lat,rad,src,dev,plat,wifi"
                         - required: long,lat
`)
  .on('--help', () => {
    console.log(`
Examples:
  --timezone America/New_York
  --columns "time,long,lat,rad,src,dev,plat,wifi"
`
    )
  })
  .parse(process.argv);

main();


function main() {
  const availableCSVColumns = [
    { key: 'timestamp', type: 'date', alias: 'time' },
    { key: 'latitude', type: 'coordinate', alias: 'lat' },
    { key: 'longitude', type: 'coordinate', alias: 'long' },
    { key: 'radius', type: 'meters', alias: 'rad' },
    { key: 'source', type: 'string', alias: 'src' },
    { key: 'device', type: 'string', alias: 'dev' },
    { key: 'platform', type: 'string', alias: 'plat' },
    { key: 'wifi', type: 'list_wifi', alias: 'wifi' },
  ];

  let userColumns = program.opts().columns
  if (userColumns) {
    userColumns = userColumns.split(',')
  }

  const csvColumns = availableCSVColumns.filter(col => {
    if (!userColumns) return true;
    let userIndex = userColumns.indexOf(col.alias)
    if (userIndex === -1) {
      userIndex = userColumns.indexOf(col.key)
    }
    if (userIndex !== -1) {
      col.index = userIndex
      return true;
    }
    return false;
  }).sort((a, b) => a.index < b.index ? -1 : 1);

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
  if (parser.hasWifiLocations()) {
    kmlLines.push(generator.openFolder({ name: 'WiFi Results'}));
    kmlLines.push((parser.getAllWifiLocations() || []).map(wifiScan => {
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
  }
  if (parser.hasRadii()) {
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
  }
  kmlLines.push(generator.tail());
  const output = program.opts().output;
  if (output) {
    fs.writeFileSync(output, kmlLines.join('\n'));
  } else {
    console.log(kmlLines.join('\n'));
  }
}
