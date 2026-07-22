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
