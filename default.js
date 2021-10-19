const program = require('commander');
const { main } = require('./main');

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

const opts = program.opts()

console.log(main(opts));
