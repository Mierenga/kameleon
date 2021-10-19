const fs = require('fs');
const { LocationParser } = require('./lib/parser');
const { KMLGenerator } = require('./lib/kml-generator');
const { deltaDegreesFromMeters, circlePoints } = require('./lib/gps-util');

/**
 * 
 * @param {
 *   columns;
 *   file;
 *   timezone;
 *   output;
 * } options 
 */
function main(options) {
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

  let userColumns = options.columns
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
    filename: options.file,
    csvColumns: csvColumns,
    timezone: options.timezone,
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
  const output = options.output;
  const kml = kmlLines.join('\n')
  if (output) {
    fs.writeFileSync(output, kml);
    return 'kml output to ' + output
  } else {
    return kml
  }
}

module.exports = { main }