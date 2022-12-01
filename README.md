<br>

<h1 align="center">🕺 Discope</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/wildcard-match"><img src="https://img.shields.io/npm/v/discope" alt="npm package"></a>
  &nbsp;
  <a href="https://bundlephobia.com/package/wildcard-match"><img src="https://img.shields.io/bundlephobia/minzip/discope?color=%23b4a&label=size" alt="size"></a>
  &nbsp;
  <a href="https://github.com/axtgr/wildcard-match/actions"><img src="https://img.shields.io/github/workflow/status/axtgr/discope/CI?label=CI&logo=github" alt="CI"></a>
  &nbsp;
  <a href="https://www.buymeacoffee.com/axtgr"><img src="https://img.shields.io/badge/%F0%9F%8D%BA-Buy%20me%20a%20beer-red?style=flat" alt="Buy me a beer"></a>
</p>

<br>

## Quickstart

```
npm install discope
```

```js
import { scope, singleton, factory } from 'discope'
import pino from 'pino'
import { createConfig } from './config.js'
import App from './App.js'

const servicesScope = scope((deps) => {
  const logger = factory(({ name }) => {
    return pino({ name, level: deps.config.logLevel })
  })
  return { logger }
})

const appScope = scope(() => {
  const config = singleton(() => createConfig())
  const { logger } = servicesScope({ config })
  const app = singleton(() => new App({ config: config(), logger: logger('App') }))
  return { app }
})

const app = appScope()()
app.start()
```
