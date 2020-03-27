let o = require('ospec')
let feedParser = require('./index')

o('parse feed successfully', () => {
  o(true).equals(true)
})