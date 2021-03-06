import React from 'react'
import PropTypes from 'prop-types'
import Promise from 'cancelable-promise'
import emptyObj from 'empty/object'
import FetcherContext from './FetcherContext'


/*
 <FetcherProvider cache={createCache()}>
 <Fetcher url='https://mcgrathpg.com/1.0/building/151-e-wilson'>
 {({response, status}) => {

 }}
 </Fetcher>
 </FetcherProvider>
 */


const WAITING = 'waiting'
const LOADING = 'loading'
const ABORTED = 'aborted'
const DONE = 'done'
const ERROR = 'error'

function getSignature ({url, method, input}) {
  return `Fetcher.${method.toUpperCase()}('${url}', ${JSON.stringify(input)})`
}

export function withFetcher (Component) {
  return props => <FetcherContext.Consumer children={c => <Component fetcher={c} {...props}/>}/>
}

export default withFetcher(
  class Fetcher extends React.Component {
    isFetcher = true

    static contextTypes = {
      // for react-broker preloading
      waitForPromises: PropTypes.object
    }

    static propTypes = {
      url: PropTypes.string.isRequired,
      method: PropTypes.string.isRequired,
      mode: PropTypes.string,
      credentials: PropTypes.string,
      headers: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
      input: PropTypes.any,
      timeout: PropTypes.number,
      ssr: PropTypes.bool,
      getSignature: PropTypes.func.isRequired
    }

    static defaultProps = {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {},
      timeout: 10 * 1000,
      ssr: true,
      getSignature
    }

    constructor (props, context) {
      super(props)
      this.signature = props.getSignature(props)
      const {status, response} = props.fetcher.cache.get(this.signature) || emptyObj
      this.state =  {
        status: status || WAITING,
        abort: this.abort,
        reload: this.reload,
        response: response || null,
      }
      const isSsr = typeof window === 'undefined'

      if (this.state.status === WAITING) {
        if (isSsr === false || props.ssr === true) {
          const fetchPromise = this.fetch(props, props.fetcher)
          // for preloading with react-broker
          if (context.waitForPromises) {
            context.waitForPromises.chunkPromises.push(fetchPromise)
          }
        }
      }

      props.fetcher.cache.subscribe(this.signature, this)
    }

    fetch = async (props, context) => {
      context.cache.setStatus(this.signature, LOADING)
      let response, result, headers = {}

      try {
        this.commit = new Promise(
          async resolve => {
            context.fetch(
              props.url,
              {
                method: props.method,
                mode: props.mode,
                credentials: props.credentials,
                headers: {
                  'Content-Type': 'application/json',
                  ...(typeof props.headers === 'function' ? await props.headers() : props.headers)
                },
                body: props.input
              }
            ).then(resolve)

            this.timeout = setTimeout(
              () => {
                this.commit.cancel()
                // resolves with a fake, but relevant response since there
                // was no real one
                resolve({
                  ok: false,
                  headers: emptyObj,
                  status: 408,
                  statusText: 'Request Timeout',
                  json: false
                })
              },
              props.timeout
            )
          }
        )

        context.cache.setCommit(this.signature, this.commit)
        response = await this.commit
        clearTimeout(this.timeout)

        for (let name of response.headers.keys()) {
          headers[name] = response.headers.get(name)
        }

        result = {
          ok: response.ok,
          url: response.url,
          headers,
          status: response.status,
          statusText: response.statusText,
          data: response.ok === true ? await response.json() : false
        }

        context.cache.set(this.signature, {status: DONE, response: result})
      }
      catch (errorMsg) {
        clearTimeout(this.timeout)
        // with CORS requests you cannot get the response object evidently
        // so this error mitigates that
        result = {
          ok: false,
          headers: response ? headers : {},
          status: response ? response.status : 520,
          statusText: response ? response.statusText : 'Unknown Error',
          errorMsg: String(errorMsg),
          data: false
        }

        context.cache.set(this.signature, {status: ERROR, response: result})
      }

      return response
    }

    prefetch = () => this.fetch(this.props, this.props.fetcher)

    update = ({response, status}) => this.setState({response, status})

    abort = () => {
      this.props.fetcher.cache.unsubscribe(this.signature, this)
      this.props.fetcher.cache.setStatus(this.signature, ABORTED)

      if (this.timeout) {
        clearTimeout(this.timeout)
      }
    }

    componentDidUpdate () {
      const nextSignature = this.props.getSignature(this.props)
      if (nextSignature !== this.signature) {
        this.props.fetcher.cache.unsubscribe(this.signature, this)
        this.fetch(this.props, {...this.context, ...this.props.fetcher})
        this.props.fetcher.cache.subscribe(this.signature, this)
      }
    }

    componentWillUnmount () {
      this.props.fetcher.cache.unsubscribe(this.signature, this)

      if (this.timeout) {
        clearTimeout(this.timeout)
      }
    }

    reload = () => {
      this.props.fetcher.cache.unsubscribe(this.signature, this)
      this.props.fetcher.cache.setStatus(this.signature, WAITING)
      this.fetch(this.props, this.props.fetcher)
      this.props.fetcher.cache.subscribe(this.signature, this)
    }

    render() {
      return this.props.children(this.state)
    }
  }
)

