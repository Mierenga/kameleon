
const { LocationParser } = require('../lib/parser');

async function main(options) {
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
    csv: options.csv,
    filename: options.file,
    csvColumns: csvColumns,
    timezone: options.timezone,
  });

  return parser
}

module.exports = { main }