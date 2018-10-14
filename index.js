const program = require('commander')
const {
  listFeeds,
  addFeed,
  listArticles,
  seeDescription,
  readArticle,
  removeFeed
} = require('./src/api')

program.version('0.0.1').description('Webcrawler')

program
  .command('list-feeds')
  .alias('lf')
  .description('Lists all saved RSS feeds')
  .action(listFeeds)

program
  .command('add-feed')
  .alias('af')
  .description('Add a given RSS feed to the feeds list')
  .action(addFeed)

program
  .command('list-articles')
  .alias('la')
  .description("Choose from the saved RSS feeds and list it's articles")
  .action(listArticles)

program
  .command('see-description')
  .alias('sd')
  .description('See the description for some article')
  .action(seeDescription)

program
  .command('read-article')
  .alias('ra')
  .description('Read a whole article')
  .action(readArticle)

program
  .command('remove-feed')
  .alias('rf')
  .description('Removes a feed from the list of saved feeds')
  .action(removeFeed)

program.parse(process.argv)
