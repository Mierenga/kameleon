const geolib = require('geolib')

function main({
  plugins: { parser },
  options: { output } = {}
}) {

  const rows = parser.getAllLocations()
  let sum = 0
  for (let i = 0; i < rows.length - 1; i++) {
    const row = rows[i]
    const next = rows[i+1]
    const d = geolib.getPreciseDistance({
      latitude: row.x,
      longitude: row.y,
    }, {
      latitude: next.x,
      longitude: next.y,
    }, 0.01)

    sum += d
  }

  const precision = 4

  return JSON.stringify({
    m: sum.toFixed(precision),
    ...(['km', 'ft', 'mi'].reduce((o, unit) => {
      o[unit] = geolib.convertDistance(sum, unit).toFixed(precision);
      return o
    }, {}))
  })
}

module.exports = { main }
