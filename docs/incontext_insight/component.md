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

In usage of a plugin, IncontextInsight is used to wrap an element. The div and its content will be rendered within the context provided by IncontextInsight.
To ensure your plugin does not require the Assistant Dashboards plugin bundle define a functional component that will render a div with props by default and
if the Assistant Dashboards plugin is available then on plugin setup call renderIncontextInsightComponent passing the same props. For example:

```typescriptreact
import React from 'react';
import { OuiLink } from '@opensearch-project/oui';

// export default component
export let ExampleIncontextInsightComponent = (props: any) => <div {...props} />;

//====== plugin setup ======//
// check Assistant Dashboards is installed
if (assistantDashboards) {
  // update default component
  ExampleIncontextInsightComponent = (props: any) => (
    <>{assistantDashboards.renderIncontextInsight(props)}</>
  );
}
//====== plugin setup ======//


function ExampleComponent() {
  return (
    // Use your component
    <ExampleIncontextInsightComponent>
      <OuiLink
        key="exampleKey"
        data-test-subj="exampleSubject"
        href="http://example.com"
      >
        Example Link
      </OuiLink>
    </ExampleIncontextInsightComponent>
  );
}

export default ExampleComponent;
```

The ExampleIncontextInsightComponent is a React component used in this code to wrap an OuiLink component with a `<div>` or the functional component defined by Assistant Dashboards. The OuiLink component is a part of the OpenSearch UI framework and is used to create a hyperlink.
