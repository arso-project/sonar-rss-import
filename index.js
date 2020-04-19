const fs = require('fs')
// const ajv = require('ajv')
const yargs = require('yargs')
const collect = require('stream-collector')

const Client = require('@arso-project/sonar-client')
const parse = require('./parse')

const DEFAULT_ISLAND = 'default'
const SCHEMA = 'sonar/wordpress-import'

const run = require('./transform')

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
    command: 'run',
    describe: 'run bot',
    handler: run
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
  .help()
  .demandCommand()
  .argv

// function run (args) {
//   const client = new Client(args.endpoint, args.island)
//   const commands = {
//     import: {
//       describe: 'import a file',
//       // args: [
//       //   { type: 'file', describe: 'wordpress xml epxort file to import' }
//       // ],
//       input: {
//         schema: 'sonar/resource',
//         filter: [
//           { mimetype: 'application/xml' },
//           { tag: 'wordpress-export' }
//         ]
//       },
//       handler: importer
//     }
//   }
//   client.createCommandStream({ commands })
// }

async function init (argv) {
  const client = new Client(argv)
  const schema = require('./schema.json')
  try {
    let res = await client.createIsland(argv.island)
    console.log('create island', res)
  } catch (err) {
    // TODO
  }
  const res = await client.putSchema(SCHEMA, schema)
  console.log('put schema', res)
}

async function inspect (argv) {
  const path = argv.path

  try {
    const xml = await parse({ path, fs })
    const records = transform(xml)
    console.log(records[0])
    console.log(records[records.length - 1])
  } catch (err) {
    console.error('Error', err.message)
  }
}

async function importer (argv) {
  const client = new Client(argv)
  const { path } = argv
  try {
    const xml = await parse({ path, fs })
    const records = transform(xml)
    await put(records)
  } catch (err) {
    console.error(err.message)
  }
  client.close()

  async function query (...args) {
    const qs = await client.createQueryStream(...args)
    return new Promise((resolve, reject) => {
      collect(qs, (err, result) => {
        err ? reject(err) : resolve(result)
      })
    })
  }

  async function put (records, opts = {}) {
    const ids = []
    const errs = []
    let skip = 0


    const timer = clock()
    // let existing = await query('index', { schema: SCHEMA, prop: 'guid' }, { load: false })
    // console.log(existing)
    // console.log(existing.length)
    // console.log(timer())
    // existing = existing.reduce((res, x) => {
    //   res[x.value.guid] = true
    //   return res
    // }, {})
    // console.log(Object.keys(existing).length)

    for (const record of records) {
      // console.log(record)
      try {
        // const existing = await client.query('index', {
        //   schema: SCHEMA,
        //   prop: 'guid',
        //   value: record.value.guid
        // })
        // if (existing.length && !opts.force) {
        const has = await query('index', {
          schema: SCHEMA,
          prop: 'guid',
          value: record.value.guid
        })
        if (has.length && !opts.force) {
        // if (existing[record.value.guid]) {
          skip++
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
    console.log('time: ', timer())
    console.log('done')
    console.log('total   ', records.length)
    console.log('imported', ids.length)
    console.log('skipped ', skip)
    console.log('errors  ', errs.length)
    // console.log(errs)
  }
}

function transform (xml) {
  const records = []
  for (let item of xml.item) {
    for (let key of Object.keys(item)) {
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
  for (let row of meta) {
    if (row['wp:meta_key'] === 'enclosure') {
      let value = row['wp:meta_value']
      let [url, size, mimetype] = value.split('\n')
      results.push({ url, size, mimetype })
    }
  }
  return results
}

// function logItem (item) {
//   // console.log(typeof item['content:encoded'])
//   logKeys(item, ['title', 'post_name', 'post_type', 'post_parent'])
//   console.log()
//   logKeys(item, ['link', 'guid', 'post_id'])
//   console.log()
//   logKeys(item, ['pubDate', 'post_date', 'post_date_gmt'])
//   console.log()
//   logKeys(item, ['postmeta'])
//   console.log()
// }

// function logKeys (item, fields) {
//   for (let key of Object.keys(item)) {
//     if (fields.indexOf(key) !== -1) console.log(key + ':', item[key])
//   }
// }
// const keys = {}
// for (let item of xml.item) {
//   for (let key of Object.keys(item)) {
//     keys[key] = keys[key] ? keys[key] + 1 : 1
//   }
// }
//
    // existing = existing.reduce((res, x) => {
    //   res[x.value.guid] = true
    //   return res
    // }, {})


function clock () {
  const start = process.hrtime()
  let last = start
  function time () {
    const diff = process.hrtime(last)
    last = process.hrtime()
    return format(diff)
  }
  time.total = function () {
    return format(process.hrtime(start))
  }
  return time
  function format (diff) {
    const [ds, dn] = diff
    const ns = (ds * 1e9) + dn
    const ms = round(ns / 1e6)
    const s = round(ms / 1e3)
    if (s >= 1) return s + 's'
    if (ms >= 0.01) return ms + 'ms'
    if (ns) return ns + 'ns'
  }
  function round (num, decimals = 2) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }
}
