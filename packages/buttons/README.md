# @stellar-apps/buttons
This package contains helpful wrapper `Button` types around `curls/Button`

## Installation
`yarn add @stellar-apps/buttons`

## Usage
```jsx
import {Button, TypeButton, SubmitButton} from '@stellar-apps/buttons'

<Button outline>
  I'm an outline button variant
</Button>
```

### `Button`
Provides an automated outline variant to the traditional button

### Props
In addition to the props below, this component inherits props from `curls/Button`
- `outline {bool}`
    - Creates an outline-style variant of otherwise solid `background-color` buttons
    - When `true`, `bg` turns into the border color and the `background-color` becomes transparent
    
### defaultTheme
```js
const defaultTheme = {
  ...curlsButtonDefaults,
  outline: {
    bw: 1
  }
}
```
 
------

### `TypeButton`
Automatically inserts a `curls/Type` component into the Button's children. It is configurable
from the `button` property of the theme.

### Props
In addition to the props below, this component inherits props from `Button` above. When `outline` is 
defined, the `Type` color defaults to the `bg` property, but can be overwritten using `typeColor`.

- `typeColor {string}`
    - Overrides the theme default for type color
- `typeSize {string}`
    - Overrides the theme default for type size
- `typeWeight {string}`
    - Overrides the theme default for type weight
    
### defaultTheme
```js
const defaultTheme = {
  ...buttonDefaults,
  type: {
    flex: true,
    row: true,
    sm: true,
    align: 'center',
    weight: 'ultraHeavy',
    face: 'primary',
    color: 'primaryText'
  }
}
```

------

### `LinkButton`
Provides a `react-router-dom` interface to treat Buttons as `react-router-dom/Link`

### Props
In addition to the props below, this component inherits props from `TypeButton` above.
- `to {string|object}`
    - The page to link to

------

### `SpinnerButton`
A button which displays a Spinner instead of its `children` when the `loading` flag is set.

### Props
In addition to the props below, this component inherits props from `TypeButton` above. 
- `loading {bool}`
    - When `true`, this button will display a `@jaredlunde/curls-addons/Spinner` as a child instead
      of the defined children
- `spinnerColor {string}`
    - Overrides the theme default for spinner color. When `outline` is `true` the spinner's color
      will default to whatever the type color is.
- `spinnerSize {string|number}`
    - Overrides the theme default for spinner size  
    
### defaultTheme 
```js
const defaultTheme = {
  ...typeButtonDefaults,
  spinner: {
    size: 16,
    color: 'white'
  }
}
```

------

### `SubmitButton`
This is the same as `SpinnerButton` but has a `type='submit'` prop instead of `type='button'`

------

### `IconButton`
This component provides a `@jaredlunde/curls-addons/Icon` as the only child to the `Button` component above.

### Props
In addition to the props below, this component inherits props from `Button`
- `name {string}`
    - The name of the `@jaredlunde/curls-addons/Icon`
- `size {string|number}`
    - The size of the `@jaredlunde/curls-addons/Icon`
- `color {string}`
    - The color of the `@jaredlunde/curls-addons/Icon`
    
