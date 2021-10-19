const express = require('express')
const { main } = require('./main')

const port = 5555
const app = express()
app.use(express.json())

app.post('/csv', (req, res) => {
  if (!req.body) {
    res.status(400).send({ message: 'missing body' })
  } else if (!req.body.csv || !req.files || !req.files.length) {
    res.status(400).send({ message: 'req.body.csv or req.files required' })
  }

  main({
    rawCSV: req.body.csv
  })

  res.send(200)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})