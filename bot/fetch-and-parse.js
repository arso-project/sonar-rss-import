const parser = require('fast-xml-parser')
const hyperquest = require('hyperquest')
const collect = require('collect-stream')

module.exports = async function fetchAndParse (path, opts) {
  // const { fs } = opts
  let result = await read(path, opts)
  if (Buffer.isBuffer(result)) result = result.toString()
  const parsed = parseXml(result)
  const channel = toChannel(parsed)
  return channel
}

async function read (path, opts) {
  if (path.match(/^https?:\/\//)) {
    return readUrl(path, opts)
  } else {
    return readFile(path, opts)
  }
}

async function readFile (path, opts) {
  const fs = opts.fs || require('fs')
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, buf) => {
      if (err) reject(err)
      else resolve(buf)
    })
  })
}

async function readUrl (path, opts) {
  return new Promise((resolve, reject) => {
    const req = hyperquest(path)
    req.once('error', reject)
    collect(req, (err, buf) => {
      if (err) reject(err)
      else resolve(buf)
    })
  })
}

function toChannel (xml) {
  return xml.rss.channel
}

function parseXml (str, cb) {
  const parsed = parser.parse(str)
  return parsed
}
