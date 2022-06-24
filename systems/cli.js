const program = require('commander')
const { mapDirectory } = require('./lib/systems');

const pluginResults = {}

program.version('0.0.1')

program
  .requiredOption('-f, --file <filename>', 'set the input CSV file')
  // TODO: add timezone support
  // .option('-t, --timezone <zoneIdentifier>', 'set the timezone of KML timestamps')
  .option('-R, --no-radii', 'skip writing radii data to kml output')
  .option('-W, --no-wifi', 'skip writing wifi data to kml output')
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

async function main() {
  await mapDirectory('plugins', {
    map: (name, fn) => {
      program
        .hook('preAction', async (thisCommand, actionCommand) => {
          pluginResults[name] = await fn(program.opts())
        });
    },
  })

  await mapDirectory('commands', {
    map: (name, fn) => {
      program
        .command(name)
        .action(() => {
          console.log(fn({
            options: program.opts(),
            plugins: pluginResults,
          }))
        })
    },
  })

  program.parse(process.argv)
}


main()
