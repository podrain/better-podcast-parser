import parser from 'fast-xml-parser'
import he from 'he'
import _ from 'lodash'
import axios from 'axios'

export default {
  async parseFeed(rawFeed, options = {
    proxyURL: '',
    getAllPages: false,
  }) {
    let parseOptions = {
      ignoreAttributes: false,
      attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
      tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
    }

    let tObj = parser.getTraversalObj(rawFeed, parseOptions)
    let parsedFeed = parser.convertToJson(tObj, parseOptions)

    let podcastData = parsedFeed.rss.channel
    let podcastJSON = {}

    podcastJSON.meta = {}

    // Title
    if (podcastData.hasOwnProperty('title')) {
      podcastJSON.meta.title = podcastData.title
    }

    // Description
    if (podcastData.hasOwnProperty('description')) {
      podcastJSON.meta.description = podcastData.description
    }

    // Image
    if (podcastData.hasOwnProperty('itunes:image')) {
      podcastJSON.meta.imageURL = podcastData['itunes:image']['@_href']
    }

    // Last updated
    if (podcastData.hasOwnProperty('lastBuildDate')) {
      podcastJSON.meta.lastUpdated = new Date(podcastData.lastBuildDate).toISOString()
    }

    // Link
    if (podcastData.hasOwnProperty('link')) {
      podcastJSON.meta.link = podcastData.link
    }

    // Language
    if (podcastData.hasOwnProperty('language')) {
      podcastJSON.meta.language = podcastData.language
    }

    // Author
    if (podcastData.hasOwnProperty('itunes:author')) {
      podcastJSON.meta.author = podcastData['itunes:author']
    }

    // Summary
    if (podcastData.hasOwnProperty('itunes:summary')) {
      podcastJSON.meta.summary = podcastData['itunes:summary']
    }

    // Categories
    if (podcastData.hasOwnProperty('itunes:category')) {
      podcastJSON.meta.categories = []
      let categoriesRaw = []

      // Upper level details
      let upperLevelCategory = podcastData['itunes:category']
      if (upperLevelCategory.hasOwnProperty('@_text')) {
        categoriesRaw.push(upperLevelCategory['@_text'])
      }

      // Sub level details
      if (upperLevelCategory.hasOwnProperty('itunes:category')) {
        // Multiple subcategories?
        if (Array.isArray(upperLevelCategory['itunes:category'])) {
          for (let lowerLevelCategory of upperLevelCategory['itunes:category']) {
            categoriesRaw.push(lowerLevelCategory['@_text'])
          }
        } else {
          // Just one sub...
          categoriesRaw.push(upperLevelCategory['itunes:category']['@_text'])
        }
      }
      

      podcastJSON.meta.categories = _.uniq(categoriesRaw)
    }

    // Owner
    if (podcastData.hasOwnProperty('itunes:owner')) {
      podcastJSON.meta.owner = {}

      if (podcastData['itunes:owner'].hasOwnProperty('itunes:name')) {
        podcastJSON.meta.owner.name = podcastData['itunes:owner']['itunes:name']
      }

      if (podcastData['itunes:owner'].hasOwnProperty('itunes:email')) {
        podcastJSON.meta.owner.email = podcastData['itunes:owner']['itunes:email']
      }
    }

    // Explicit?
    if (podcastData.hasOwnProperty('itunes:explicit')) {
      podcastJSON.meta.explicit = false

      if (typeof podcastData['itunes:explicit'] == 'boolean') {
        podcastJSON.meta.explicit = podcastData['itunes:explicit']
      } else {
        if (['yes', 'explicit', 'true'].indexOf(podcastData['itunes:explicit'].toLowerCase()) >= 0) {
          podcastJSON.meta.explicit = true
        }
      }
    }

    // Pages
    if (podcastData.hasOwnProperty('atom:link')) {
      podcastJSON.meta.pages = {}

      if (Array.isArray(podcastData['atom:link'])) {
        for (let page of podcastData['atom:link']) {
          podcastJSON.meta.pages[page['@_rel']] = page['@_href']
        }
      } else {
        podcastJSON.meta.pages[podcastData['atom:link']['@_rel']] = podcastData['atom:link']['@_href']
      }
    }

    // console.log(podcastData['itunes:category'])

    // Episodes
    if (podcastData.hasOwnProperty('item')) {
      podcastJSON.episodes = []

      if (!Array.isArray(podcastData['item'])) {
        let singleItem = podcastData['item']
        podcastData['item'] = new Array
        podcastData['item'][0] = singleItem
      }

      for (let episodeData of podcastData['item']) {
        let episodeJSON = {}

        // GUID
        if (episodeData.hasOwnProperty('guid')) {
          if (episodeData.guid.hasOwnProperty('@_isPermaLink')) {
            episodeJSON.guid = episodeData.guid.undefined
          } else {
            episodeJSON.guid = episodeData.guid
          }
        }

        // Title
        if (episodeData.hasOwnProperty('title')) {
          episodeJSON.title = episodeData.title
        }

        // Description
        if (episodeData.hasOwnProperty('description')) {
          episodeJSON.description = episodeData.description
        }

        // Encoded content
        if (episodeData.hasOwnProperty('content:encoded')) {
          episodeJSON.contentEncoded = episodeData['content:encoded']
        }

        // Subtitle
        if (episodeData.hasOwnProperty('itunes:subtitle')) {
          episodeJSON.subtitle = episodeData['itunes:subtitle']
        }

        // Image
        if (episodeData.hasOwnProperty('itunes:image')) {
          episodeJSON.imageURL = episodeData['itunes:image']['@_href']
        }

        // Publish date
        if (episodeData.hasOwnProperty('pubDate')) {
          episodeJSON.pubDate = new Date(episodeData['pubDate']).toISOString()
        }

        // Link
        if (episodeData.hasOwnProperty('link')) {
          episodeJSON.link = episodeData.link
        }

        // Enclosure
        if (episodeData.hasOwnProperty('enclosure')) {
          let newEnclosure = {
            'url': episodeData.enclosure['@_url'],
            'length': episodeData.enclosure['@_length'],
            'type': episodeData.enclosure['@_type'],
          }

          episodeJSON.enclosure = newEnclosure
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

          episodeJSON.duration = typeof episodeData['itunes:duration'] == 'string' 
            ? timeToSeconds(episodeData['itunes:duration']) 
            : episodeData['itunes:duration']
        }

        // Summary
        if (episodeData.hasOwnProperty('itunes:summary')) {
          episodeJSON.summary = episodeData['itunes:summary']
        }

        // Explicit
        if (episodeData.hasOwnProperty('itunes:explicit')) {
          episodeJSON.explicit = false

          if (typeof episodeData['itunes:explicit'] == 'boolean') {
            episodeJSON.explicit = episodeData['itunes:explicit']
          } else {
            if (['yes', 'explicit', 'true'].indexOf(episodeData['itunes:explicit'].toLowerCase()) >= 0) {
              episodeJSON.explicit = true
            }
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