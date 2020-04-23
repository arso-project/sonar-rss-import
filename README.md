# sonar-rss-import

* Start a [Sonar server](https://github.com/arso-project/sonar/)
* `cd bot`
* `node index.js init` - init an island with the RSS schema
* `node index.js import <pathOrUrl>` - import an RSS file or URL. Wordpress exports are supported too.
* `cd ../frontend; npm start` - start a simple frontend for the imported material
* Use the Sonar UI to share the collection
