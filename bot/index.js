const fs = require('fs')
const yargs = require('yargs')
const collect = require('stream-collector')

const Client = require('@arso-project/sonar-client')
const fetchAndParse = require('./fetch-and-parse')

const DEFAULT_ISLAND = 'default'
const SCHEMA = 'sonar/wordpress-import'

yargs
  .usage('wp-import <command>')
  .env('SONAR')
  .options({
    endpoint: {
      alias: 'e',
      describe: 'api endpoint url',
      default: 'http://localhost:9191/api'
    },
    island: {
      alias: 'i',
      describe: 'island key or name',
      default: DEFAULT_ISLAND
    }
  })
  .command({
    command: 'init',
    describe: 'init (create island and schema)',
    handler: init
  })
  .command({
    command: 'import [path]',
    describe: 'import file',
    handler: importer
  })
  .command({
    command: 'inspect [path]',
    describe: 'inspect file',
    handler: inspect
  })
  .command({
    command: 'process',
    describe: 'process record',
    handler: require('./transform')
  })
  .help()
  .demandCommand()
  .argv

async function init (argv) {
  const client = new Client(argv)
  const schema = require('./schema.json')
  try {
    const res = await client.createIsland(argv.island)
    console.log('island created', res)
  } catch (err) {
  }
  await client.putSchema(SCHEMA, schema)
}

async function inspect (argv) {
  const path = argv.path

  try {
    const channel = await fetchAndParse(path)
    const records = transform(channel)
    console.log('Items: %s', records.length)
  } catch (err) {
    console.error('Error', err.message)
  }
}

async function importer (argv) {
  const client = new Client(argv)
  const { path } = argv
  try {
    const channel = await fetchAndParse(path)
    const records = transform(channel)
    await put(records)
  } catch (err) {
    console.error(err.message)
  }
  client.close()

  async function put (records, opts = {}) {
    const ids = []
    const errs = []
    let skip = 0
    for (const record of records) {
      try {
        const has = await client.query('index', {
          schema: SCHEMA,
          prop: 'guid',
          value: record.value.guid
        })
        if (has.length && !opts.force) {
          skip++
          console.log('skip')
          continue
        }
        const res = await client.put(record)
        console.log('put', res.id)
        ids.push(res.id)
      } catch (err) {
        console.log('err', err.message)
        errs.push(err)
      }
    }
    console.log('done')
    console.log('total   ', records.length)
    console.log('imported', ids.length)
    console.log('skipped ', skip)
    console.log('errors  ', errs.length)
  }
}

function transform (xml) {
  const records = []
  for (const item of xml.item) {
    for (const key of Object.keys(item)) {
      if (key === 'pubDate') {
        item[key] = new Date(Date.parse(item[key]))
      }
      if (key === 'wp:postmeta') {
        item.media = transformPostmeta(item[key])
        delete item[key]
        continue
      }
      if (key.startsWith('dc:') || key.startsWith('wp:')) {
        item[key.substring(3)] = item[key]
        delete item[key]
      }
      if (key === 'content:encoded') {
        item.content = item[key]
        delete item[key]
      }
    }

    const record = {
      schema: SCHEMA,
      value: item
    }
    records.push(record)
  }
  return records
}

function transformPostmeta (meta) {
  if (!Array.isArray(meta)) meta = [meta]
  const results = []
  for (const row of meta) {
    if (row['wp:meta_key'] === 'enclosure') {
      const value = row['wp:meta_value']
      const [url, size, mimetype] = value.split('\n')
      results.push({ url, size, mimetype })
    }
  }
  return results
}
