const { prompt } = require('inquirer')

const Table = require('cli-table')
const striptags = require('striptags')
const chalk = require('chalk')
const RssReader = require('./rssReader')
const reader = new RssReader()

const listFeeds = () => reader.listFeeds

const addFeedQuestions = [
  {
    type: 'input',
    name: 'feed',
    message: 'Which RSS feed do you want to add to the list?'
  }
]
const addFeed = async () => {
  //Wait for the user to input a RSS feed
  const { feed } = await prompt(addFeedQuestions)
  //Try to add the feed to the list of saved feeds
  reader.addFeed(feed)
}

const listArticleQuestions = [
  {
    type: 'list',
    name: 'feed',
    message: 'From which RSS Feed do you want to list articles?'
  }
]
const listArticles = async () => {
  //Get the choices dynamically
  listArticleQuestions[0].choices = await reader.getFeeds()
  //Wait for the user to choose a RSS feed
  const { feed } = await prompt(listArticleQuestions)
  //List the articles from the feed
  reader.listArticles(feed)
}

const seeDescriptionQuestions = [
  {
    type: 'list',
    name: 'article',
    message: "What article's description do you want to read?"
  }
]

const chooseArticle = async callback => {
  //Get the choices dynamically
  listArticleQuestions[0].choices = await reader.getFeeds() //Wait for the user to choose a RSS feed
  const { feed } = await prompt(listArticleQuestions)
  //Get the possible article choices from the feed
  const articles = await reader.getArticles(feed)
  //COnstruct the choices by using the article titles
  seeDescriptionQuestions[0].choices = articles.map(article => article.title)
  //Wait for the user to chose an article
  const { article: chosenArticle } = await prompt(seeDescriptionQuestions)
  //Find it in the list of choices
  const article = articles.find(article => article.title === chosenArticle)
  //If all is good, invoke the user callback
  if (article !== undefined) {
    callback(article)
  }
}
const seeDescription = () => {
  chooseArticle(article => {
    const table = new Table()
    table.push({ title: article.title }, { description: article.summary })

    console.log(table.toString())
  })
}
const readArticle = () => {
  chooseArticle(article => {
    content = striptags(article.description)
    console.log('\n' + chalk.red.bold.underline(article.title))
    console.log(content)
  })
}

const removeFeedQuestions = [
  {
    type: 'list',
    name: 'feed',
    message: 'Which RSS Feed do you wish to remove?'
  }
]
const removeFeed = async () => {
  //Get the choices dynamically
  const feeds = await reader.getFeeds()
  removeFeedQuestions[0].choices = feeds
  //Wait for the user to choose a RSS feed
  const { feed } = await prompt(removeFeedQuestions)
  //remove the feed from the list of saved feeds
  reader.removeFeed(feeds, feed)
}

module.exports = {
  listFeeds,
  addFeed,
  listArticles,
  seeDescription,
  readArticle,
  removeFeed
}
