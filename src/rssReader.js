const util = require('util')
const fs = require('fs')
const path = require('path')
const FeedParser = require('feedparser')
const request = require('request')
const Table = require('cli-table')

module.exports = class rssReader {
  constructor() {
    this.write = util.promisify(fs.writeFile)
    if (process.env.NODE_ENV === 'development') {
      this.appDir = path.dirname(require.main.filename)
    } else {
      this.appDir = path.dirname(process.execPath)
    }
    this.feedsPath = `${this.appDir}/feeds`

    try {
      if (!fs.existsSync(this.feedsPath)) {
        fs.mkdirSync(this.feedsPath)
      }
      this.feedsStream = fs.createWriteStream(this.feedsPath + '/feeds.txt', {
        flags: 'a'
      })
    } catch (e) {
      console.error(e)
      console.log('Unable to create the main feeds file')
    }

    this.listArticles = this.listArticles.bind(this)
    this.addFeed = this.addFeed.bind(this)
    this.listFeeds = this.listFeeds.bind(this)
    this.getArticles = this.getArticles.bind(this)
    this.removeFeed = this.removeFeed.bind(this)
  }

  /**
   * Writes a content to a filename inside the writer's directory
   * Also streams the content to a combined log
   * @param {string} name
   * @param {string} content
   */
  writeToFile(name, content) {
    const file = `${this.dirPath}/${name}`
    return this.write(file, content, err => {
      if (err) {
        console.log(err)
        return
      }
    })
  }

  /**
   * Handles a separate file for error messages
   * @param {error} err
   */
  writeToErrorLog(err) {
    return this.write(`${this.dirPath}/errors.txt`, err)
  }

  /**
   * Useful for making the folder names for the text files
   * using the full URLs as the names
   *
   * @param {string} text
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  }

  /**
   * Reads the feed list, splitting the file by newlines and passing
   * individual feeds to a user callback. Returns a promise that
   * resolves when data finishes
   *
   * @param {function} dataCallback Receives a single feed URL and does something with it
   * @param {function} endCallback Called when there's no more data to read. Resolves the promise
   */
  readFeedList(dataCallback, endCallback = () => {}) {
    this.feedsReaderStream = fs.createReadStream(this.feedsPath + '/feeds.txt')
    return new Promise(resolve => {
      this.feedsReaderStream.on('data', chunk => {
        const feeds = chunk.toString()
        console.log(feeds)
        feeds.split('\n').map(dataCallback)
      })

      this.feedsReaderStream.on('error', error => {
        console.error(error)
        reject(error)
      })

      this.feedsReaderStream.on('end', () => {
        resolve(endCallback())
      })
    })
  }

  /**
   * Reads the article list for a given feed.
   * Manages events on the feedparser.
   *
   * Returns a promise that resolves when parsing finishes
   *
   * @param {string} feed A RSS feed URL
   * @param {function} dataCallback
   *  Called when the stream is flowing,
   *  giving the client access to data
   * @param {function} endCallback Called when parsing finishes
   */
  readArticleList(feed, dataCallback, endCallback = () => {}) {
    return new Promise(resolve => {
      const req = request(feed)
      const feedparser = new FeedParser()

      req.on('error', console.error)

      req.on('response', function(res) {
        const stream = this // `this` is `req`, which is a stream

        if (res.statusCode !== 200) {
          this.emit('error', new Error('Bad status code'))
        } else {
          stream.pipe(feedparser)
        }
      })

      feedparser.on('error', console.error)

      feedparser.on('readable', function() {
        // This is where the action is!
        const stream = this // `this` is `feedparser`, which is a stream
        dataCallback(stream)
      })

      feedparser.on('end', () => resolve(endCallback()))
    })
  }

  /**
   * Tries to add a given RSS feed to the list of saved feeds
   * @param {string} feedToAdd A RSS feed URL
   */
  addFeed(feedToAdd) {
    let feedAlreadyAdded = false
    return this.readFeedList(
      feed => {
        if (feed === undefined || feed.trim() === '') {
          return
        }
        feed === feedToAdd
          ? (feedAlreadyAdded = true)
          : (feedAlreadyAdded = false)
      },
      () => {
        if (feedAlreadyAdded) {
          console.log('This RSS feed already exists in the saved feeds!')
          return
        }
        console.log(`Saving ${feedToAdd}....`)
        this.feedsStream.write(feedToAdd + '\n')
      }
    )
  }

  /**
   * Tries to remove a given RSS feed from the list of saved feeds
   * @param {string} feeds All of the save feed URLs
   * @param {string} feedToRemove A RSS feed URL
   */
  async removeFeed(feeds, feedToRemove) {
    await fs.writeFile(this.feedsPath + '/feeds.txt', '', console.error)
    const newFeeds = feeds.filter(feed => feed !== feedToRemove)
    this.feedsStream.write(newFeeds.join('\n'))

    console.log(`Feed ${feedToRemove} removed`)
  }

  /**
   * Lists all saved feeds in a cli table format
   */
  listFeeds() {
    const table = new Table({
      head: ['Feeds'],
      colWidths: [40]
    })

    this.readFeedList(
      feed => feed && table.push([feed]),
      () => console.log(table.toString())
    )
  }

  /**
   * Recovers all saved feeds in array<string> format
   */
  async getFeeds() {
    const feeds = []
    await this.readFeedList(feed => feed && feeds.push(feed))
    return feeds
  }

  /**
   * Lists all the articles from a given feed in cli table format
   * @param {string} feed A feed given from the list of saved feeds
   */
  listArticles(feed) {
    const table = new Table({
      head: ['Title', 'Author', 'Category', 'Publication date'],
      colWidths: [55, 18, 30, 25]
    })
    this.readArticleList(
      feed,
      stream => {
        let item
        while ((item = stream.read())) {
          table.push([
            item.title,
            item.author,
            item.categories.join(', '),
            item['rss:pubdate']['#']
          ])
        }
      },
      () => console.log(table.toString())
    )
  }

  async getArticles(feed) {
    const choices = []
    await this.readArticleList(feed, stream => {
      let item
      while ((item = stream.read())) {
        choices.push(item)
      }
    })

    return choices
  }
}
