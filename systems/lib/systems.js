const fs = require('fs')

async function mapDirectory(directory, { map }) {
  return new Promise((resolve, reject) => {
    fs.readdir(`./${directory}`, (err, files) => {
      if (err) {
        return reject(err)
      }
      resolve(Promise.all(files
        .filter(f => !f.startsWith('.'))
        .map(async file => {
          const { main } = require(`../../${directory}/${file}`)
          return map(file.split('.').slice(0, -1).join('.'), main)
        })
      ))
    })
  })
}

module.exports = {
  mapDirectory
}
