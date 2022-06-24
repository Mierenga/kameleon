function circlePoints(rx, ry, xOffset, yOffset, n=16) {
  let points = [];
  let x, y;
  let incr = Math.PI*2/n;
  let start = Math.PI/2;
  let finish = Math.PI*2.5
  let theta = start;
  while (theta < finish) {
    x = rx * Math.cos(theta);
    y = ry * Math.sin(theta);
    points.push([x + xOffset, y + yOffset]);
    theta += incr;
  }
  return points;
}
function deltaDegreesFromMeters(meters, latitude) {
  const latDegreeInMeters = 11132*8;
  const longDegreeInMeters = 40075000 * Math.cos(latitude) / 360;
  return [
    meters/latDegreeInMeters,
    meters/longDegreeInMeters
  ];
}

module.exports = {
  circlePoints,
  deltaDegreesFromMeters,
};
