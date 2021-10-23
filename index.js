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
const corsOptions = {
  origin: function (origin, callback) {
    if (["https://admin.jsb-club.com", "https://www.jsb-club.com"].indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionSuccessStatus: 200
};

// CORS middleware
const allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

app.use(cors(corsOptions));
app.use(allowCrossDomain);
app.use(auth)
app.use('/', route)


app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})