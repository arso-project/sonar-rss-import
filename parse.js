const parser = require('fast-xml-parser')

module.exports = async function parse (opts, cb) {
  const { path, fs } = opts
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, buf) => {
      if (err) return reject(err)
      const xmlstr = buf.toString()
      parseXml(xmlstr, finish)

      function finish (err, result) {
        if (err) reject(err)
        result = fix(result)
        resolve(result)
      }
    })
  })
}

function fix (xml) {
  return xml.rss.channel
}

function parseXml (str, cb) {
  const parsed = parser.parse(str)
  cb(null, parsed)
}

// function parse (str, cb) {
//   // Both choke on invalid XML.
//   // const RssParser = require('rss-parser')
//   // const parser = new RssParser()
//   // parser.parseString(str, cb)
//   // const Xml = require('xml2js')
//   // Xml.parseString(str, (err, result) => {
//   //   cb(err, result)
//   // })
// }
