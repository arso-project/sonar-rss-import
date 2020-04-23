const hyperquest = require('hyperquest')
const p = require('path')
const pretty = require('pretty-bytes')
const Client = require('@arso-project/sonar-client')

const SCHEMA = 'sonar/wordpress-import'
const SUBSCRIPTION_NAME = 'sonar.wordpress.import'

module.exports = async function run (args) {
  const client = new Client(args)

  while (true) {
    const batch = await client.pullSubscription(SUBSCRIPTION_NAME)
    for (const message of batch.messages) {
      await onmessage(client, message)
      await client.ackSubscription(SUBSCRIPTION_NAME, message.lseq)
    }
    console.log('ok', batch.messages.length, batch.cursor, batch.finished)
    // finished = batch.finished
    if (batch.finished) {
      console.log('done, wait and continue')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

async function onmessage (client, record) {
  const { id, schema, value } = record
  if (schema !== SCHEMA) return
  const results = []
  const errors = []
  if (value.media && value.media.length) {
    console.log('  process %s (medias: $s)', id, value.media.length)
    let i = 0
    for (const item of value.media) {
      i++
      try {
        const result = await process(id, item)
        // const result = true
        console.log(`  success (${i} / ${value.media.length})`)
        results.push(result)
      } catch (err) {
        console.log(`  error (${i} / ${value.media.length})`)
        console.log(`  ${err.message}`)
        console.log(err)
        errors.push(err)
      }
    }
  } else {
    console.log('skip', id)
  }
  return results
  // done(null, results)

  async function process (id, item) {
    let urlstring = item.url
    if (!urlstring || !urlstring.startsWith('http')) throw new Error('Invalid URL')
    if (urlstring.endsWith('\r')) urlstring = urlstring.substring(0, urlstring.length - 1)
    console.log('    import', urlstring)
    const url = new URL(item.url)
    const pathname = url.pathname
    const basename = p.basename(pathname)

    const size = parseInt(item.size)
    const record = await client.createResource({
      filename: basename,
      prefix: 'rss',
      encodingFormat: item.mimetype,
      contentSize: size,
      partOf: [id]
    }, { update: true })

    console.log('    using resource: ' + record.id)
    console.log('    starting import (' + pretty(size) + ')')

    const readStream = hyperquest(urlstring)
    reportProgress(readStream, { msg: 'Uploading', total: item.size })
    await client.writeResourceFile(record, readStream)
    console.log('ok')

    return record
  }
}

function reportProgress (stream, { total, msg, bytes = true, interval = 1000 }) {
  let len = 0
  if (msg) msg = msg + ' ... '
  else msg = ''
  const report = setInterval(status, interval)
  stream.on('data', d => (len = len + d.length))
  stream.on('end', stop)
  function status () {
    if (!total) console.log(`      ${msg} ${pretty(len)}`)
    else {
      const percent = Math.round((len / total) * 100)
      console.log(`      ${msg} ${percent}% ${pretty(len)}`)
    }
  }
  function stop () {
    clearInterval(report)
    status()
  }
}
