#!/usr/bin/env node

var command = process.argv[2]
var path = process.argv[3]

var usage = 'Usage: `kactus import|parse|find path`'

if (!command) {
  console.error('Missing command. ' + usage)
  process.exit(1)
}

if (command !== 'import' && command !== 'parse' && command !== 'find' && command !== 'parseAll' && command !== 'importAll' && command !== 'createNew') {
  console.error('Command ' + command + ' not recocgnized.')
  console.error('Only `import` and `parse` are supported. ' + usage)
  process.exit(1)
}

if (!path) {
  console.error('Missing path. ' + usage)
  process.exit(1)
}

function catcher (err) {
  console.error(err)
  process.exit(1)
}

if (command === 'import') {
  require('./lib/import')(path).catch(catcher)
} else if (command === 'parse') {
  require('./lib/parse')(path).catch(catcher)
} else if (command === 'importAll') {
  require('./lib/importAll')(path).catch(catcher)
} else if (command === 'parseAll') {
  require('./lib/parseAll')(path).catch(catcher)
} else if (command === 'find') {
  require('./lib/find')(path)
    .then((result) => console.log(JSON.stringify(result, null, '\t')))
    .catch(catcher)
} else if (command === 'createNew') {
  require('./lib/createNew')(path).catch(catcher)
}
