# IncontextInsightRegistry

`IncontextInsightRegistry` is a TypeScript class that manages the registration and retrieval of `IncontextInsight` items.

## Methods

### open(item: IncontextInsight, suggestion: string)

This method emits an 'onSuggestion' event with the provided suggestion.

### register(item: IncontextInsight | IncontextInsight[])

This method registers a single `IncontextInsight` item or an array of `IncontextInsight` items. Each item is mapped using the `mapper` method before being stored in the registry.

### get(key: string): IncontextInsight

This method retrieves an `IncontextInsight` item from the registry using its key.

### getAll(): IncontextInsight[]

This method retrieves all `IncontextInsight` items from the registry.

### getSummary(key: string)

This method retrieves the summary of an `IncontextInsight` item using its key.

## Usage

```typescript
import { IncontextInsightRegistry } from './incontext_insight_registry';

const registry = new IncontextInsightRegistry();

// Register a single item
registry.register({
  key: 'item1',
  summary: 'This is item 1',
  suggestions: ['suggestion1', 'suggestion2'],
});

// Register multiple items
registry.register([
  {
    key: 'item2',
    summary: 'This is item 2',
    suggestions: ['suggestion3', 'suggestion4'],
  },
  {
    key: 'item3',
    summary: 'This is item 3',
    suggestions: ['suggestion5', 'suggestion6'],
  },
]);

// Retrieve an item
const item1 = registry.get('item1');

// Retrieve all items
const allItems = registry.getAll();

// Retrieve an item's summary
const item1Summary = registry.getSummary('item1');