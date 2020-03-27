let feedParser = require('./index')
let axios = require('axios')
let fs = require('fs')

axios.get('https://changelog.com/podcast/feed').then((contents) => {
  return feedParser.parseFeed(contents.data)
  // fs.writeFileSync('output.json', contents.data)
}).then(result => {
  console.log(result)
}) 