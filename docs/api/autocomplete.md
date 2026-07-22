# `useAutocomplete`

```ts
function useAutocomplete<TItem>(options: UseAutocompleteOptions<TItem>): AutocompleteState<TItem>;
```

`useAutocomplete` performs two independent list requests: one for current selected identities and one for the active search query. It merges the results in that order and removes duplicate identities, so currently selected values remain renderable after search criteria change.

## Returned state and actions

| Value                             | Description                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `items`                           | Selected items first, followed by query items not already present. |
| `currentValueItems`, `queryItems` | Raw results of the two requests.                                   |
| `loading`, `error`                | Combined loading flag and latest error.                            |
| `loadCurrentItems()`              | Loads only selected identities.                                    |
| `loadItems()`                     | Loads only search results.                                         |
| `initialize()` / `refresh()`      | Loads both request groups concurrently.                            |

When `itemDisabled` is provided, each returned item receives a derived `disabled` boolean; no server object is mutated.
