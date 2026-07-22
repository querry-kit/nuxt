# Autocomplete

`useAutocomplete` keeps selected resources available even if they are absent from the active search query.

```ts
const selectedUserIds = ref<string[]>([]);
const users = useAutocomplete({
  api,
  endpoint: 'users',
  currentValue: selectedUserIds,
  query: computed(() => ({ perPage: 20 })),
  identityKey: 'id',
});
```

Selected and searched results are deduplicated by `identityKey`. Use `itemDisabled` when the consumer must annotate options without changing the server response.

| Option         | Default             | Purpose                                                              |
| -------------- | ------------------- | -------------------------------------------------------------------- |
| `query`        | `{}`                | Reactive request for search results.                                 |
| `currentValue` | no selected request | One identity or an array of identities to keep loaded.               |
| `identityKey`  | `id`                | Property used for the selected-resource condition and deduplication. |
| `itemDisabled` | none                | Produces a derived `disabled` boolean per returned item.             |
| `immediate`    | `true`              | Set to `false` and call `initialize()` yourself.                     |

`initialize()` and `refresh()` load selected resources and query results concurrently. `loadCurrentItems()` and `loadItems()` are available when the UI needs more granular control. Empty, `null`, or `undefined` selections do not issue the selected-resource request.
