const express = require('express')
const app = express()
const bodyParser = require("body-parser")
const port = 3000
const cors = require('cors')
const auth = require("./middlewares/auth")
require('./database')

const route = require('./route')

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
      extended: false,
  })
)
app.use(cors())
app.use(auth)
app.use('/', route)


app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})