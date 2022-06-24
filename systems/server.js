const express = require('express')
const { mapDirectory } = require('./lib/systems')

const port = 5555
const app = express()
app.use(express.json())
app.use(express.json())

async function plugins(options) {
  const pluginResults = {}
  await mapDirectory('plugins', {
    map: async (name, fn) => {
      pluginResults[name] = await fn(options)
    }
  })
  return pluginResults
}

app.post('/:command', async (req, res) => {
  try {
    console.log('command:', req.params.command)

    const info = {
      command: req.params.command,
      body: req.body,
    }

    if (!req.body) {
      return res.status(400).send({ ...info, message: 'missing body' })
    } else if (!req.body.csv && !req.body.file && (!req.files || !req.files.length)) {
      return res.status(400).send({ ...info, message: 'req.body.csv or req.files required' })
    }

    let result
    try {
      const { main: command } = require(`../commands/${info.command}`)
      if (typeof command !== 'function') {
        return res.status(404).send({ ...info, message: `main function not found: ${info.command}` })
      }

      const pluginResults = await plugins(req.body)

      result = await command({
        plugins: { ...pluginResults },
      })
    } catch (e) {
      console.error(e)
      console.error(e.message)
      console.error(e.code)
      if (e.code === 'ENOENT') {
        return res.status(400).send({ ...info, message: `file not found: ${info.body.file}` })
      } else if (e.code === 'MODULE_NOT_FOUND') {
        return res.status(404).send({ ...info, message: `command not found: ${info.command}` })
      } else {
        return res.status(400).send({ ...info, message: `command failed: ${info.command}` })
      }
    }


    return res.status(200).send({
      ...info,
      result: result || null,
    })
  } catch (e) {
    return res.status(400).send({ message: e.message })
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

