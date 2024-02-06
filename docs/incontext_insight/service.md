# IncontextInsights and Chat Interaction

`IncontextInsights` can be used to enhance the chat experience by providing contextual insights based on the ongoing conversation. 

The `assistantDashboards` is should be an optional property in the `PluginSetupDeps` interface. It represents a plugin that might be available during the setup phase of a plugin.

Here's an example of how you might use the `assistantDashboards` plugin in the `AlertingPlugin` setup:

```typescript
import { CoreSetup } from 'src/core/public';
import { AssistantPublicPluginSetup } from 'src/plugins/assistant/public';

interface AlertingSetupDeps {
  expressions: any;
  uiActions: any;
  assistantDashboards?: AssistantPublicPluginSetup;
}

class AlertingPlugin implements Plugin<{}, {}, AlertingSetupDeps> {
  public setup(core: CoreSetup, { assistantDashboards }: AlertingSetupDeps) {
    if (assistantDashboards) {
      // Use the assistantDashboards plugin
     assistantDashboards.registerIncontextInsight([
        {
          key: 'query_level_monitor',
          summary:
            'Per query monitors are a type of alert monitor that can be used to identify and alert on specific queries that are run against an OpenSearch index; for example, queries that detect and respond to anomalies in specific queries. Per query monitors only trigger one alert at a time.',
          suggestions: ['How to better configure my monitor?'],
        },
        {
          key: 'content_panel_Data source',
          summary:
            'OpenSearch data sources are the applications that OpenSearch can connect to and ingest data from.',
          suggestions: ['What are the indices in my cluster?'],
        },
      ]);
    }
  }
}
```

In this example, we're checking if the `assistantDashboards` plugin is available during the setup phase. If it is, we're using it to register incontext insights for specific keys with a seed suggestion.

## How it works

When a chat message is sent or received, the `IncontextInsightRegistry` can be queried for relevant insights based on the content of the message. These insights can then be displayed in the chat interface to provide additional information or suggestions to the user.

## Usage

Here's an example of how you might use `IncontextInsights` in a chat application:

```typescript
import { IncontextInsightRegistry } from './incontext_insight_registry';

const registry = new IncontextInsightRegistry();

// Register some insights
registry.register([
  { key: 'greeting', summary: 'This is a greeting', suggestions: ['Hello', 'Hi', 'Hey'] },
  { key: 'farewell', summary: 'This is a farewell', suggestions: ['Goodbye', 'See you', 'Take care'] },
]);

// When a message is sent or received...
const message = 'Hello, how are you?';

// Query the registry for relevant insights
const insights = registry.getAll().filter(insight => message.includes(insight.summary));

// Display the insights in the chat interface
insights.forEach(insight => {
  console.log(`Suggestion: ${insight.suggestions[0]}`);
});
```
