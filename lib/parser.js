const fs = require('fs')
const moment = require('moment-timezone');

module.exports.LocationParser = class LocationParser {
  constructor({filename, csvColumns=[], header=true, timezone=''}) {
    console.log(filename);
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
    this.radiusCol = csvColumns.findIndex(column => column.key === 'radius');

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
    return {
      x: parseFloat(row[this.xCol]),
      y: parseFloat(row[this.yCol]),
      timestamp: row[this.timeCol],
      radius: parseFloat(row[this.radiusCol]),
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
