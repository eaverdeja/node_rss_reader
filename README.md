# node_rss_reader

Repo for the RSS reader assignment for the Competitive Inteligence Systems class at PUC-Rio

This project enables users to add and remove RSS feeds from a local file. Users can then list articles from the feeds and, when available, read the content from the articles.

# usage

`npm run add-feed` - Adds an RSS feed to the saved feeds list
  
`npm run list-feeds` - Lists all of the saved feeds
  
`npm run list-articles` - Prompts the user to choose a feed and shows it's articles
  
`npm run see-description` - Prompts the user to choose an article and shows the descriptions of the article
  
`npm run read-article` - Prompts the user to choose an article and shows the contents of the article
  
`npm run remove-feed` - Removes a feed from the list of saved feeds
  
`npm run help` - Shows the description for the different commands

`npm run build:all` - Builds the executables for the different platforms. Needs `zeit/pkg` installed globally to work.

# executables

This project uses `zeit/pkg` to create windows (x64 and x86) and linux executables. All of them can be found in the `dist/` directory.
