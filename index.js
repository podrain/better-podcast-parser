let xml2js = require('xml2js')
let fs = require('fs')
let _ = require('lodash')
let axios = require('axios')

module.exports = {
  async parseFeed(rawFeed, options = {
    proxyURL: '',
    getAllPages: false,
  }) {
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

    // Last updated
    if (podcastData.hasOwnProperty('lastBuildDate')) {
      podcastJSON.meta.lastUpdated = new Date(podcastData.lastBuildDate[0]).toISOString()
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

    // Episodes
    if (podcastData.hasOwnProperty('item')) {
      podcastJSON.episodes = []

      for (let episodeData of podcastData['item']) {
        let episodeJSON = {}

        // Title
        if (episodeData.hasOwnProperty('title')) {
          episodeJSON.title = episodeData.title[0]
        }

        // Description
        if (episodeData.hasOwnProperty('description')) {
          episodeJSON.description = episodeData.description[0]
        }

        // Subtitle
        if (episodeData.hasOwnProperty('itunes:subtitle')) {
          episodeJSON.subtitle = episodeData['itunes:subtitle'][0]
        }

        // Image
        if (episodeData.hasOwnProperty('itunes:image')) {
          episodeJSON.imageURL = episodeData['itunes:image'][0]['$'].href
        }

        // Publish date
        if (episodeData.hasOwnProperty('pubDate')) {
          episodeJSON.pubDate = new Date(episodeData['pubDate'][0]).toISOString()
        }

        // Link
        if (episodeData.hasOwnProperty('link')) {
          episodeJSON.link = episodeData.link[0]
        }

        // Enclosure
        if (episodeData.hasOwnProperty('enclosure')) {
          episodeJSON.enclosure = episodeData.enclosure[0]['$']
        }

        // Duration
        if (episodeData.hasOwnProperty('itunes:duration')) {
          let timeToSeconds = function(string) {
            // gives duration in seconds
            let times = string.split(':'),
            sum = 0, mul = 1
        
            while (times.length > 0) {
              sum += mul * parseInt(times.pop())
              mul *= 60
            }
        
            return sum
          }

          episodeJSON.duration = timeToSeconds(episodeData['itunes:duration'][0])
        }

        // Summary
        if (episodeData.hasOwnProperty('itunes:summary')) {
          episodeJSON.summary = episodeData['itunes:summary'][0]
        }

        // Explicit
        if (episodeData.hasOwnProperty('itunes:explicit')) {
          episodeJSON.explicit = false

          if (['yes', 'explicit', 'true'].indexOf(episodeData['itunes:explicit'][0].toLowerCase()) >= 0) {
            episodeJSON.explicit = true
          }
        }
        
        podcastJSON.episodes.push(episodeJSON)
      }
    }

    if (options.getAllPages && podcastJSON.meta.hasOwnProperty('pages') && podcastJSON.meta.pages.hasOwnProperty('next')) {
      let allOtherEpisodes = await this.getNextPage(podcastJSON, { proxyURL: options.proxyURL })
      podcastJSON.episodes = _.concat(podcastJSON.episodes, allOtherEpisodes)
    }

    return podcastJSON
  },

  async getNextPage(podcastJSON, options = {
    proxyURL: '',
  }, episodesAppended = []) {

    if (podcastJSON.meta.hasOwnProperty('pages') && podcastJSON.meta.pages.hasOwnProperty('next')) {
      let nextPageJSON = await this.parseURL(podcastJSON.meta.pages.next, {
        proxyURL: options.proxyURL
      })

      let newEpisodesAppended = _.concat(episodesAppended, nextPageJSON.episodes)

      return await this.getNextPage(nextPageJSON, { proxyURL: options.proxyURL }, newEpisodesAppended)
    } else {
      return episodesAppended
    }
  },

  async parseURL(url, options = {
    proxyURL: '',
    getAllPages: false
  }) {
    let podcastResponse = await axios.get(options.proxyURL + url, {
      headers: {
        'accept': 'application/rss+xml, application/rdf+xml;q=0.8, application/atom+xml;q=0.6, application/xml;q=0.4, text/xml;q=0.4'
      }
    })

    let podcastJSON = await this.parseFeed(podcastResponse.data, options)

    return podcastJSON
  }
}