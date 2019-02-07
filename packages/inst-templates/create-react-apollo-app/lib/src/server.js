import createRenderer, {
  redirect,
  noFavicon,
  withRobots,
  withCookies,
  pipe
} from '@stellar-apps/ssr/createRenderer'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import Broker from 'react-broker'
import {StaticRouter} from 'react-router-dom'
import {ApolloProvider, getDataFromTree} from 'react-apollo'
import fetch from 'node-fetch'
import apollo from './apollo'
import App from './index'


export const renderApp = ({clientStats}) => async function render (
  {
    // micro server objects
    req,
    res,
    // user device type: mobile, table, desktop
    device
  }
) {
  // keeps track of lazy chunks used by the current page
  const chunkCache = Broker.createChunkCache()
  // provided to react-helmet-async
  const helmetContext = {}
  // tracks redirections and status changes in the Router
  const routerContext = {}
  // creates the Apollo client
  const apolloClient = apollo.createClient({
    res,
    fetch,
    headers: apollo.forwardRequestHeaders(req),
    forwardResponseHeaders: apollo.forwardResponseHeaders(res)
  })
  // creates the App in React
  const app = (
    <ApolloProvider client={apolloClient}>
      <StaticRouter location={req.url} context={routerContext}>
        <App helmetContext={helmetContext} chunkCache={chunkCache} device={device}/>
      </StaticRouter>
    </ApolloProvider>
  )
  // preloads the async components and when done renders the app string
  await Broker.loadAll(app)
  // waits for Apollo to execute Queries and retrieve responses
  await getDataFromTree(app)
  // the string-rendered application
  const page = ReactDOMServer.renderToString(app)
  // sets the status from the router context to the response
  if (routerContext.status) {
    res.statusCode = routerContext.status
  }
  // somewhere a `<Redirect>` was rendered
  if (routerContext.url) {
    // redirect(res, routerContext.status || 301, routerContext.url)
    redirect(res, routerContext.url, routerContext.status || 301)
  }
  // renders the Helmet attributes
  const {helmet} = helmetContext
  // returns the document
  return `
    <!DOCTYPE html>
    <html ${helmet.htmlAttributes}>
      <head>
        <!-- Page Title -->
        ${helmet.title}
        <!-- Helmet meta -->
        ${helmet.meta}
        <!-- Helmet links -->
        ${helmet.link}
        <!-- Helmet styles -->
        ${helmet.style}
        <!-- Bundle scripts -->
        ${chunkCache.getChunkScripts(clientStats)}
        <!-- Helmet scripts -->
        ${helmet.script}
        <!-- Initial Apollo state -->
        <script>
          window.__APOLLO_STATE__ = ${
            JSON.stringify(apolloClient.extract()).replace(/</g, '\\\u003c')
          }
        </script>
      </head>
      <body ${helmet.bodyAttributes}>
        <noscript>
          <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
            Javascript must be enabled in order to view this website
          </div>
        </noscript>
        <div id="⚛️">${page}</div>
      </body>
    </html>
  `.trim()
}

// creates a middleware pipe for micro
const middleware = pipe(
  // 404s on favicon requests
  noFavicon,
  // Sets up robots.txt middleware for micro
  withRobots(
    process.env.STAGE === 'production'
      ? require('./robots.txt')
      : require('./robots.disallow.txt')
  ),
  // sets up cookies
  withCookies()
)

// this is the server renderer that will handle all requests
const serverRenderer = clientStats => middleware(createRenderer(renderApp({clientStats})))

// sets up options for the Serverless lambda function
let clientStats, mainServerless
if (process.env.STAGE !== 'development') {
  clientStats = require(`../dist/${process.env.STAGE}/client/stats.json`)
  mainServerless = require('serverless-http')(serverRenderer(clientStats))
}

// this is the export that Lambda calls as its handler
export const main = function (event, context) {
  // keeps the lambda function warm
  if (event.source === 'serverless-plugin-lambda-warmup') {
    console.log('Warming...')
    return
  }

  return mainServerless(event, context)
}

// by default this just exports the renderer
// this will be used by Webpack dev renderers
export default ({clientStats}) => serverRenderer(clientStats)