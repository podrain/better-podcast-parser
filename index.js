let xml2js = require('xml2js')
let fs = require('fs')
let _ = require('lodash')

module.exports = {
  async parseFeed(rawFeed) {
    let parsedFeed = await xml2js.parseStringPromise(rawFeed)
    let podcastJSON = {}

    podcastJSON.meta = {}

    // Title
    if (parsedFeed.rss.channel[0].hasOwnProperty('title')) {
      podcastJSON.meta.title = parsedFeed.rss.channel[0].title[0]
    }

    // Description
    if (parsedFeed.rss.channel[0].hasOwnProperty('description')) {
      podcastJSON.meta.description = parsedFeed.rss.channel[0].description[0]
    }

    // Image
    if (parsedFeed.rss.channel[0].hasOwnProperty('itunes:image')) {
      podcastJSON.meta.imageURL = parsedFeed.rss.channel[0]['itunes:image'][0]['$'].href
    }

    // Link
    if (parsedFeed.rss.channel[0].hasOwnProperty('link')) {
      podcastJSON.meta.link = parsedFeed.rss.channel[0].link[0]
    }

    // Language
    if (parsedFeed.rss.channel[0].hasOwnProperty('language')) {
      podcastJSON.meta.language = parsedFeed.rss.channel[0].language[0]
    }

    // Author
    if (parsedFeed.rss.channel[0].hasOwnProperty('itunes:author')) {
      podcastJSON.meta.author = parsedFeed.rss.channel[0]['itunes:author'][0]
    }

    // Summary
    if (parsedFeed.rss.channel[0].hasOwnProperty('itunes:summary')) {
      podcastJSON.meta.summary = parsedFeed.rss.channel[0]['itunes:summary'][0]
    }

    // Categories
    if (parsedFeed.rss.channel[0].hasOwnProperty('itunes:category')) {
      podcastJSON.meta.categories = []
      let categoriesRaw = []

      for (let upperLevelCategory of parsedFeed.rss.channel[0]['itunes:category']) {
        // Upper level details
        categoriesRaw.push(upperLevelCategory['$'].text)

        // Sub level details
        if (upperLevelCategory.hasOwnProperty('itunes:category')) {
          for (let lowerLevelCategory of upperLevelCategory['itunes:category']) {
            categoriesRaw.push(lowerLevelCategory['$'].text)
          } 
        }
      }

      podcastJSON.meta.categories = _.uniq(categoriesRaw)
    }

    // Owner
    if (parsedFeed.rss.channel[0].hasOwnProperty('itunes:owner')) {
      podcastJSON.meta.owner = {}

      if (parsedFeed.rss.channel[0]['itunes:owner'][0].hasOwnProperty('itunes:name')) {
        podcastJSON.meta.owner.name = parsedFeed.rss.channel[0]['itunes:owner'][0]['itunes:name'][0]
      }

      if (parsedFeed.rss.channel[0]['itunes:owner'][0].hasOwnProperty('itunes:email')) {
        podcastJSON.meta.owner.email = parsedFeed.rss.channel[0]['itunes:owner'][0]['itunes:email'][0]
      }
    }

    // Pages
    if (parsedFeed.rss.channel[0].hasOwnProperty('atom:link')) {
      podcastJSON.meta.pages = {}

      for (let page of parsedFeed.rss.channel[0]['atom:link']) {
        podcastJSON.meta.pages[page['$'].rel] = page['$'].href
      }
    }

    // console.log(parsedFeed.rss.channel[0]['itunes:category'])
    // console.log(podcastJSON)

    return podcastJSON
  }
}