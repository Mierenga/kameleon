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
  }

  getFirstLocation() { return this._getLocationObjectFromRow(this.rows[0]); }

  getLastLocation() {
    return this._getLocationObjectFromRow(this.rows[this.rows.length-1]); }

  getAllCoordinateStrings() {
    if (this.xCol < 0 || this.yCol < 0) {
      throw new Error('Coordinate column unknown, latitude and longitude required in CSV Columns');
    }
    return this.rows.map(row => this._getLocationStringFromRow(row));
  }

  _getLocationStringFromRow(row) {
    return row[this.xCol] + ',' + row[this.yCol];
  }
  _getLocationObjectFromRow(row) {
    return { x: row[this.xCol], y: row[this.yCol] };
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
                <color>ffffffff</color>            <!-- kml:color -->
                <colorMode>normal</colorMode>      <!-- colorModeEnum: normal or random -->

                <!-- specific to LineStyle -->
                <width>1</width>                            <!-- float -->
                <gx:outerColor>ffffffff</gx:outerColor>     <!-- kml:color -->
                <gx:outerWidth>0.0</gx:outerWidth>          <!-- float -->
                <gx:physicalWidth>0.0</gx:physicalWidth>    <!-- float -->
                <gx:labelVisibility>0</gx:labelVisibility>  <!-- boolean -->
            </LineStyle>
        </Style>`
  }

  placemark({
    name="Placemark",
    description="",
    visibility=1,
    x=80,
    y=43,
  }) {
        return `
        <Placemark>
            <name>${name}</name>
            <description>${description}</description>
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
  kmlLines.push(generator.placemark({x: start.x, y: start.y, name: 'Start', description: 'This is the first recorded location' }));
  kmlLines.push(generator.route({ coordinates: parser.getAllCoordinateStrings()}));
  kmlLines.push(generator.placemark({x: end.x, y: end.y, name: 'Finish', description: 'This is the last recorded location' }));
  kmlLines.push(generator.tail());

  console.log(kmlLines.join('\n'));
}

main();

