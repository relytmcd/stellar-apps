import React from 'react'
import {Button, ThemeConsumer, createComponent} from 'curls'
import * as buttonDefaults from 'curls/dist/cjs/Button/defaultTheme'


export const defaultTheme = {
  ...buttonDefaults,
  outline: {
    bw: 1
  }
}

export default React.memo(
  React.forwardRef(
    function Button ({outline = false, ...props}, ref) {
      return (
        <ThemeConsumer path='button' defaultTheme={defaultTheme}>
          {({theme}) => {
            props = {...theme.defaultProps, ...props}

            if (outline === true) {
              props.bc = props.bg || theme.bg
              props.bg = 'transparent'
              delete props.sh
              Object.assign(props, theme.outline)
            }

            return <Button ref={ref} {...props}/>
          }}
        </ThemeConsumer>
      )
    }
  )
)