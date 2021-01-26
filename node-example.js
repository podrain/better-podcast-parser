let feedParser = require('./index')
let fs = require('fs')
require('dotenv').config()

feedParser.parseURL(process.env.TEST_FEED_URL, {
  getAllPages: true
}).then(result => {
  fs.writeFileSync('output.json', JSON.stringify(result, null, 4))
  console.log('num episodes: ' + result.episodes.length)
})