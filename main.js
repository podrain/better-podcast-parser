let feedParser = require('./index')
let axios = require('axios')
let fs = require('fs')

feedParser.parseURL('https://changelog.com/gotime/feed', {
  getAllPages: true
}).then(result => {
  fs.writeFileSync('output.json', JSON.stringify(result, null, 4))
  console.log('num episodes: ' + result.episodes.length)
})

// axios.get('https://rss.art19.com/tim-ferriss-show', {
//   headers: {
//     'accept': 'application/rss+xml, application/rdf+xml;q=0.8, application/atom+xml;q=0.6, application/xml;q=0.4, text/xml;q=0.4'
//   }
// }).then((contents) => {
//   fs.writeFileSync('output.xml', contents.data)
//   return feedParser.parseFeed(contents.data)
// }).then(result => {
//   fs.writeFileSync('output.json', JSON.stringify(result, null, 4))
// })

// let feedString = fs.readFileSync('output.xml', 'utf8')

// feedParser.parseFeed(feedString).then(result => {
//   console.log(result)
//   console.log('num episodes: '+result.episodes.length)
// })