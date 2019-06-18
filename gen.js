'use strict';
class LocationParser {
  constructor(filename, csvColumns, header=true) {
    this.filename = filename;
    this.content = fs.readFileSync(filename).toString()
    this.columns = csvColumns;
    this.rows = this.content.split('\n').map(line => line.split(','));
    if (header) { this.headerRow = this.rows.shift(); }
    this.rows = this.rows.map(rows => rows.map(entries => entries.trim()));
    this.rows.pop();
    this.rows = this.rows.filter(row => row);
    this.xCol = csvColumns.findIndex(column => column.key === 'longitude');
    this.yCol = csvColumns.findIndex(column => column.key === 'latitude');
    this.wifiCol = csvColumns.findIndex(column => column.key === 'wifi');
    this.timeCol = csvColumns.findIndex(column => column.key === 'timestamp');
  }

  getFirstLocation() { return this._getLocationObjectFromRow(this.rows[0]); }

  getLastLocation() {
    return this._getLocationObjectFromRow(this.rows[this.rows.length-1]); }

  getAllCoordinateStrings() {
    this._assertCoordinates();
    return this.rows.map(row => this._getLocationStringFromRow(row));
  }

  getAllWifiLocations() {
    this._assertCoordinates();
    return this.rows.map(row => {
      let wifiResults = this._getWifiResultsFromRow(row);
      if (!wifiResults || !wifiResults.length) { return null; }
      let obj = {
        location: this._getLocationObjectFromRow(row),
        wifi: wifiResults,
      };
      return obj;
    }).filter(row => row !== null);
  }

  _assertCoordinates() {
    if (this.xCol < 0 || this.yCol < 0) {
      throw new Error('Coordinate column unknown, latitude and longitude required in CSV Columns');
    }
  }

  _getLocationStringFromRow(row) {
    return row[this.xCol] + ',' + row[this.yCol];
  }
  _getLocationObjectFromRow(row) {
    return { x: row[this.xCol], y: row[this.yCol], timestamp: row[this.timeCol] };
  }
  _getWifiResultsFromRow(row) {
    return row[this.wifiCol]
      .split("|")
      .filter(entry => entry)
      .map(result => {
        let components = result.split('#');
        while (components.length > 3) {
          components.unshift(components.shift() + components.shift());
        }
        return {
          ssid: components[0],
          mac: components[1], 
          rssi: components[2], 
        };
      })
  }
};

class KMLGenerator {
  constructor() {
    this.indent = 0;
  }
  head() {
    this.indent += 1;
      return `<?xml version="1.0" encoding="UTF-8"?>
         <kml xmlns="http://www.opengis.net/kml/2.2"
              xmlns:gx="http://www.google.com/kml/ext/2.2">
            <Document>`
  }

  style() {
    this.indent += 1;
        return `<Style id="routeStyle">
            <LineStyle id="ID">
                <!-- inherited from ColorStyle -->
                <color>7fff00ff</color>
                <colorMode>normal</colorMode>      <!-- colorModeEnum: normal or random -->

                <!-- specific to LineStyle -->
                <width>3</width>                            <!-- float -->
                <gx:outerColor>ffffffff</gx:outerColor>     <!-- kml:color -->
                <gx:outerWidth>0.0</gx:outerWidth>          <!-- float -->
                <gx:physicalWidth>0.0</gx:physicalWidth>    <!-- float -->
                <gx:labelVisibility>0</gx:labelVisibility>  <!-- boolean -->
            </LineStyle>
        </Style>
        <Style id="wifi">
          <IconStyle>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/shapes/target.png</href>
            </Icon>
            <hotSpot x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
          </IconStyle>
        </Style>
        <Style id="go">
          <IconStyle>
            <scale>2.0</scale>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/paddle/go.png</href>
            </Icon>
            <hotSpot x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
          </IconStyle>
        </Style>
        <Style id="stop">
          <IconStyle>
            <scale>2.0</scale>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/paddle/stop.png</href>
            </Icon>
            <hotSpot x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
          </IconStyle>
        </Style>
      `
  }

  placemark({
    name="Placemark",
    description="",
    visibility=1,
    x=80,
    y=43,
    html=false,
    styleId='',
    when,
  }) {
    let whenLine = when ? `<TimeStamp><when>${when}</when></TimeStamp>` : '';
        return `
        <Placemark>
            <name>${name}</name>
            <styleUrl>#${styleId}</styleUrl>
            ${whenLine}
            <description>
            ${html?'<![CDATA[':''}
              ${description}
            ${html?']]>':''}
            </description>
            <gx:balloonVisibility>${visibility}</gx:balloonVisibility>
            <Point><coordinates>${x},${y}</coordinates></Point>
        </Placemark>`;
  }

  route({
    coordinates=[],
  }) {
      return `
      <Placemark>
          <name>route</name>
          <description>This is the route that was taken</description>
          <styleUrl>#routeStyle</styleUrl>
          <LineString>
              <coordinates>
              ${coordinates.join('\n')}
              </coordinates>
          </LineString>
      </Placemark>
      `
  }

  tail() {
    return `
        </Document>
      </kml> 
      `
  }
};

let fs = require('fs')

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

  let parser = new LocationParser(process.argv[2], csvColumns);
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
  kmlLines.push(parser.getAllWifiLocations().map(wifiScan => {
    return generator.placemark({
      x: wifiScan.location.x,
      y: wifiScan.location.y,
      styleId: 'wifi',
      name: 'Wifi Scan',
      when: wifiScan.location.timestamp,
      html: true,
      description: wifiScan.wifi.reduce((str, item) => {
        str += '<span style="color: blue;">' + item.ssid + '</span> <span style="color: gray;">' + item.mac + '</span> <i>rssi:' + item.rssi + '</i><br>';
        return str;
      }, ''),
    });
  }));
  kmlLines.push(generator.tail());

  parser.getAllWifiLocations();

  console.log(kmlLines.join('\n'));
}

main();

