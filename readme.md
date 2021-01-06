# Better Podcast Parser

A fully-featured podcast parser. Built for [Podrain](https://github.com/podrain/podrain) but can be used in Node or the browser.

## Features
There are a couple of features that help this library stand out:

- Fetch a feed by URL, or just parse XML string directly
- Supports paged feeds as per [RFC 5005](https://tools.ietf.org/html/rfc5005)
## Installation

```bash
## NPM
npm install --save better-podcast-parser

# Yarn
yarn add better-podcast-parser
```

## Usage

The functions used return Promises. You can fetch a feed by URL or parse an XML string directly.

### Options
#### `getAllPages`

Whether to recursively fetch all pages in a paginated feed. Defaults to `false`.

#### `proxyURL`
If you are pulling a feed from a web browser, you will likely need a proxy server to avoid CORS when fetching feeds. Not likely needed for server-side fetching with Node. Of course, the proxy URL will be *prepended* to the feed URL. Defaults to an empty string.

```js
import feedParser from 'better-podcast-parser'

// Options
let options = {
    getAllPages: true, 
    proxyURL: 'https://cors-anywhere.herokuapp.com/'
}

// Parsing a feed at a given URL
feedParser.parseURL('https://changelog.com/gotime/feed', options).then(jsonResult => {
    // jsonResult is the JSON payload
})

// Parsing a feed from an XML string
feedParser.parseFeed(xmlString, options).then(jsonResult => {
     // jsonResult is the JSON payload
})

```

## Todo
- Add some kind of error checking if a feed string or URL is bad