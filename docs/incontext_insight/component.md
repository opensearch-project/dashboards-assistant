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

In usage of a plugin, IncontextInsight is used to wrap a div element. The div and its content will be rendered within the context provided by IncontextInsight.

```typescriptreact
import React from 'react';
import { IncontextInsightComponent, OuiLink } from '@opensearch-project/oui';

function ExampleComponent() {
  return (
    <IncontextInsightComponent>
      <OuiLink
        key="exampleKey"
        data-test-subj="exampleSubject"
        href="http://example.com"
      >
        Example Link
      </OuiLink>
    </IncontextInsightComponent>
  );
}

export default ExampleComponent;
```

The IncontextInsightComponent is a React component used in this code to wrap an OuiLink component. The OuiLink component is a part of the OpenSearch UI framework and is used to create a hyperlink.
