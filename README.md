# kactus-cli

## Installation

```
npm install --save kactus-cli
```

## Usage

### Via cli

```
kactus import path/to/folder
```

```
kactus parse path/to/file.sketch
```

### Via Node
```js
const { importFolder, parseFile } = require('kactus-cli')

importFolder('path/to/folder').then(...)

parseFile('path/to/file.sketch').then(...)
```
