<template>
  <main>
    <h1>Query Kit Nuxt example</h1>
    <p>Mocked resource API responses are configured in <code>app/plugins/api.ts</code>.</p>
    <pre>{{ JSON.stringify(items, null, 2) }}</pre>
  </main>
</template>

<script setup lang="ts">
const { $booksApi } = useNuxtApp();
const items = ref<unknown[]>([]);

onMounted(async () => {
  const response = await $booksApi.query({ page: 1, perPage: 10 });
  items.value = response.data.items;
});
</script>
