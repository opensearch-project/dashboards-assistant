# IncontextInsight

`IncontextInsight` is a React component that provides a context for displaying insights in your application. It uses services such as `getChrome`, `getNotifications`, and `getIncontextInsightRegistry` to manage and display insights.

## Props

`IncontextInsight` takes the following props:

- `children`: ReactNode. The child components to be rendered within the `IncontextInsight` context.

## Usage

```typescriptreact
import { IncontextInsight } from '../incontext_insight';

<IncontextInsight>
  <div>Your content here</div>
</IncontextInsight>
```

In this example, IncontextInsight is used to wrap a div element. The div and its content will be rendered within the context provided by IncontextInsight.
