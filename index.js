let xml2js = require('xml2js')
let fs = require('fs')
let _ = require('lodash')

module.exports = {
  async parseFeed(rawFeed) {
    let parsedFeed = await xml2js.parseStringPromise(rawFeed)
    let podcastData = parsedFeed.rss.channel[0]
    let podcastJSON = {}

    podcastJSON.meta = {}

    // Title
    if (podcastData.hasOwnProperty('title')) {
      podcastJSON.meta.title = podcastData.title[0]
    }

    // Description
    if (podcastData.hasOwnProperty('description')) {
      podcastJSON.meta.description = podcastData.description[0]
    }

    // Image
    if (podcastData.hasOwnProperty('itunes:image')) {
      podcastJSON.meta.imageURL = podcastData['itunes:image'][0]['$'].href
    }

    // Link
    if (podcastData.hasOwnProperty('link')) {
      podcastJSON.meta.link = podcastData.link[0]
    }

    // Language
    if (podcastData.hasOwnProperty('language')) {
      podcastJSON.meta.language = podcastData.language[0]
    }

    // Author
    if (podcastData.hasOwnProperty('itunes:author')) {
      podcastJSON.meta.author = podcastData['itunes:author'][0]
    }

    // Summary
    if (podcastData.hasOwnProperty('itunes:summary')) {
      podcastJSON.meta.summary = podcastData['itunes:summary'][0]
    }

    // Categories
    if (podcastData.hasOwnProperty('itunes:category')) {
      podcastJSON.meta.categories = []
      let categoriesRaw = []

      for (let upperLevelCategory of podcastData['itunes:category']) {
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
    if (podcastData.hasOwnProperty('itunes:owner')) {
      podcastJSON.meta.owner = {}

      if (podcastData['itunes:owner'][0].hasOwnProperty('itunes:name')) {
        podcastJSON.meta.owner.name = podcastData['itunes:owner'][0]['itunes:name'][0]
      }

      if (podcastData['itunes:owner'][0].hasOwnProperty('itunes:email')) {
        podcastJSON.meta.owner.email = podcastData['itunes:owner'][0]['itunes:email'][0]
      }
    }

    // Explicit?
    if (podcastData.hasOwnProperty('itunes:explicit')) {
      podcastJSON.meta.explicit = false

      if (['yes', 'explicit', 'true'].indexOf(podcastData['itunes:explicit'][0].toLowerCase()) >= 0) {
        podcastJSON.meta.explicit = true
      }
    }

    // Pages
    if (podcastData.hasOwnProperty('atom:link')) {
      podcastJSON.meta.pages = {}

      for (let page of podcastData['atom:link']) {
        podcastJSON.meta.pages[page['$'].rel] = page['$'].href
      }
    }

    // console.log(podcastData['itunes:category'])

    return podcastJSON
  }
}