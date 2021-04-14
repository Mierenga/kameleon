module.exports.KMLGenerator = class KMLGenerator {
  constructor() {
  }
  head() {
      return `<?xml version="1.0" encoding="UTF-8"?>
     <kml xmlns="http://www.opengis.net/kml/2.2"
      xmlns:gx="http://www.google.com/kml/ext/2.2">
      <Document>`
  }

  style() {
        return `
        <Style id="routeStyle">
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

        <StyleMap id="wifi">
          <Pair><key>normal</key><styleUrl>#wifi_normal</styleUrl></Pair>
          <Pair><key>highlight</key><styleUrl>#wifi_highlight</styleUrl></Pair>
        </StyleMap>

        <Style id="wifi_normal">
          <IconStyle>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/shapes/target.png</href>
            </Icon>
            <hotSpot x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
            <scale>0.6</scale>
          </IconStyle>
          <LabelStyle>
            <scale>0</scale>
          </LabelStyle>
        </Style>

        <Style id="wifi_highlight">
          <IconStyle>
            <Icon>
              <href>http://maps.google.com/mapfiles/kml/shapes/target.png</href>
            </Icon>
            <hotSpot x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
            <scale>0.6</scale>
          </IconStyle>
          <LabelStyle>
            <scale>1</scale>
          </LabelStyle>
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

        <Style id="radius">
          <PolyStyle>
            <!-- inherited from ColorStyle -->
            <color>20ffff00</color>            <!-- kml:color -->
            <colorMode>normal</colorMode>      <!-- kml:colorModeEnum: normal or random -->

            <!-- specific to PolyStyle -->
            <fill>1</fill>                     <!-- boolean -->
            <outline>0</outline>               <!-- boolean -->
          </PolyStyle>
        </Style>
      `
  }

  polygon({
    name='',
    points=[],
    visibility=0,
    when,
    styleId='radius',
  }) {
    return `
    <Placemark>
      <name>${name}</name>
      <styleUrl>#${styleId}</styleUrl>
      ${this.timestamp({when: when})}
      <gx:balloonVisibility>${visibility}</gx:balloonVisibility>
      <extrude>0</extrude>
      <altitudeMode>clampToGround</altitudeMode>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
${points.join('\n')}
${points[0]}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    `;
  }

  timestamp({
    when='',
  }) {
    return when ? `<TimeStamp><when>${when}</when></TimeStamp>` : '';
  }

  openFolder({
    name='',
    open=false,
    description='',
  }) {
    return `
    <Folder>
      <name>${name}</name>
      <open>${open?1:0}</open>
      ${description?'<description>' + description + '</description>':''}
    `;
  }

  closeFolder() { return `</Folder>`; }

  placemark({
    name='Placemark',
    description='',
    visibility=1,
    x=80,
    y=43,
    html=false,
    styleId='',
    when,
  }) {
      return `
      <Placemark>
          <name>${name}</name>
          <styleUrl>#${styleId}</styleUrl>
          ${this.timestamp({when: when})}
          <description>
          ${html?'<![CDATA[':''}
            ${description}
          ${html?']]>':''}
          </description>
          <gx:balloonVisibility>${visibility}</gx:balloonVisibility>
          <Point><coordinates>${x},${y}</coordinates></Point>
      </Placemark>
      `;
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
