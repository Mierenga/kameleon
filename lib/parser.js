const fs = require('fs')
const moment = require('moment-timezone');

module.exports.LocationParser = class LocationParser {
  constructor({rawCSV, filename, csvColumns=[], header=true, timezone=''}) {
    if (filename) {
      this.filename = filename;
      this.content = fs.readFileSync(filename).toString()
    } else if (rawCSV) {
      this.content = rawCSV
    } else {
      console.error('missing filename or raw CSV text')
      return
    }
    this.columns = JSON.parse(JSON.stringify(csvColumns))
    this.rows = this.content.split('\n').map(line => line.split(','));
    if (header) { this.headerRow = this.rows.shift(); }
    this.rows = this.rows.map(rows => rows.map(entries => entries.trim()));
    this.rows.pop();
    this.rows = this.rows.filter(row => row);
    this.xCol = this.columns.findIndex(column => column.key === 'longitude');
    this.yCol = this.columns.findIndex(column => column.key === 'latitude');
    this.wifiCol = this.columns.findIndex(column => column.key === 'wifi');
    this.timeCol = this.columns.findIndex(column => column.key === 'timestamp');
    this.radiusCol = this.columns.findIndex(column => column.key === 'radius');

    // TODO: add proper timezone support
    // if (timezone) {
      // this.rows = this.rows
      //   .map(row => {
      //     // row[this.timeCol] = moment(row[this.timeCol]).tz(timezone).format()
      //     let d = new Date(row[this.timeCol]);
      //     row[this.timeCol] = d.setHours(d.getHours() - 5);
      //     return row;
      //   });
    // }
  }

  getFirstLocation() { return this._getLocationObjectFromRow(this.rows[0]); }

  getLastLocation() { return this._getLocationObjectFromRow(this.rows[this.rows.length-1]); }

  getAllCoordinateStrings() {
    this._assertCoordinates();
    return this.rows.map(row => this._getLocationStringFromRow(row));
  }

  getAllLocations() {
    this._assertCoordinates();
    return this.rows.map(row => this._getLocationObjectFromRow(row));
  }

  hasWifiLocations() {
    return this.wifiCol > -1
  }

  getAllWifiLocations() {
    if (!this.hasWifiLocations()) { return null; }
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

  hasRadii() {
    return this.radiusCol > -1
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
    return {
      x: parseFloat(row[this.xCol]),
      y: parseFloat(row[this.yCol]),
      timestamp: row[this.timeCol],
      radius: this.radiusCol < 0 ? undefined : parseFloat(row[this.radiusCol]),
    };
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
