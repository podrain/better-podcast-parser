let feedParser = require('./index')
let fs = require('fs')

feedParser.parseURL('https://changelog.com/gotime/feed', {
  getAllPages: true
}).then(result => {
  fs.writeFileSync('output.json', JSON.stringify(result, null, 4))
  console.log('num episodes: ' + result.episodes.length)
})