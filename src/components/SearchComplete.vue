<template>
  <div class="pb-4 sm:p-8 lg:p-12">
    <div class="flex justify-center w-full">
      <div class="relative w-full max-w-sm sm:max-w-md lg:max-w-2xl">
        <div
          class="overflow-hidden z-0 relative p-2 sm:p-3 bg-transparent [box-shadow:0_0_10px_5px_#60a5fa55,0_0_80px_10px_#2563eb55]"
          :class="results.length ? 'rounded-2xl' : 'rounded-full'"
          role="search"
          aria-label="Station search component"
        >
          <form
            class="relative flex z-50 bg-white"
            :class="results.length ? 'rounded-t-2xl' : 'rounded-full'"
            @submit.prevent="search"
            aria-label="Search for stations"
          >
            <label for="station-search" class="sr-only">
              Search for a station by name
            </label>
            <input
              id="station-search"
              v-model="query"
              @input="search"
              @keydown="handleKeyDown"
              :placeholder="placeholder"
              class="flex-1 px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base text-gray-700 focus:outline-none bg-transparent"
              :class="results.length ? 'rounded-t-2xl' : 'rounded-full'"
              type="search"
              autocomplete="off"
              aria-autocomplete="list"
              :aria-label="'Search for stations. '"
              role="combobox"
            />
          </form>

          <transition name="fade">
            <div v-if="results.length">
              <ul
                id="search-results"
                class="list-none p-0 m-0 relative z-50 bg-white rounded-b-2xl mt-[3px] max-h-60 sm:max-h-80 overflow-y-auto"
                :aria-label="'Results'"
              >
                <li
                  v-for="(item, index) in results"
                  :key="item.id"
                  :id="`option-${index}`"
                  @click="select(item)"
                  @keydown.enter="select(item)"
                  @keydown.space.prevent="select(item)"
                  class="cursor-pointer px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-gray-200 rounded-lg mx-2 my-1 transition-colors"
                  :class="{
                    'bg-blue-100 border-2 border-blue-500':
                      selectedIndex === index,
                  }"
                  role="option"
                  :tabindex="0"
                  :aria-label="`Select ${item.name} station`"
                  :aria-selected="selectedIndex === index"
                >
                  <span class="font-medium truncate block">{{
                    item.name
                  }}</span>
                  <span
                    v-if="item.address"
                    class="text-xs text-gray-500 truncate block"
                  >
                    {{ item.address }}
                  </span>
                </li>
              </ul>
            </div>
          </transition>

          <div class="absolute inset-0 pointer-events-none">
            <div
              class="glow glow-1 z-10 bg-pink-400 absolute"
              aria-hidden="true"
            ></div>
            <div
              class="glow glow-2 z-20 bg-purple-400 absolute"
              aria-hidden="true"
            ></div>
            <div
              class="glow glow-3 z-30 bg-yellow-400 absolute"
              aria-hidden="true"
            ></div>
            <div
              class="glow glow-4 z-40 bg-blue-400 absolute"
              aria-hidden="true"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  apiSearch: () => Promise<any[]>;
  placeholder?: string;
  searchKey: string;
}>();

const emit = defineEmits<{
  (e: 'stationSelected', value: any): void;
}>();

const query = ref('');
const allResults = ref<any[]>([]);
const results = ref<any[]>([]);
const selectedIndex = ref(-1);

onMounted(async () => {
  allResults.value = await props.apiSearch();
});

watch(results, () => {
  selectedIndex.value = -1;
});

async function search() {
  if (query.value.trim()) {
    const key = props.searchKey;
    results.value = allResults.value.filter((u) =>
      (u[key] || '').toLowerCase().startsWith(query.value.trim().toLowerCase()),
    );
  } else {
    results.value = [];
    selectedIndex.value = -1;
  }
}

function handleKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value =
        selectedIndex.value < results.value.length - 1
          ? selectedIndex.value + 1
          : 0;
      break;

    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value =
        selectedIndex.value > 0
          ? selectedIndex.value - 1
          : results.value.length - 1;
      break;

    case 'Enter':
      event.preventDefault();
      if (selectedIndex.value >= 0) {
        select(results.value[selectedIndex.value]);
      }
      break;
  }
}

function select(item: any) {
  emit('stationSelected', item);
  results.value = [];
  selectedIndex.value = -1;
  query.value = item.name;
}
</script>

<style scoped>
.glow {
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  border-radius: 100%;
}

.glow-1 {
  animation: glow1 4s linear infinite;
}

.glow-2 {
  animation: glow2 4s linear infinite;
  animation-delay: 100ms;
}

.glow-3 {
  animation: glow3 4s linear infinite;
  animation-delay: 200ms;
}

.glow-4 {
  animation: glow4 4s linear infinite;
  animation-delay: 300ms;
}

.transition-colors {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

li[aria-selected='true'] {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

@keyframes glow1 {
  0% {
    transform: translate(10%, 10%) scale(1);
  }
  25% {
    transform: translate(-10%, 10%) scale(1);
  }
  50% {
    transform: translate(-10%, -10%) scale(1);
  }
  75% {
    transform: translate(10%, -10%) scale(1);
  }
  100% {
    transform: translate(10%, 10%) scale(1);
  }
}

@keyframes glow2 {
  0% {
    transform: translate(-10%, -10%) scale(1);
  }
  25% {
    transform: translate(10%, -10%) scale(1);
  }
  50% {
    transform: translate(10%, 10%) scale(1);
  }
  75% {
    transform: translate(-10%, 10%) scale(1);
  }
  100% {
    transform: translate(-10%, -10%) scale(1);
  }
}

@keyframes glow3 {
  0% {
    transform: translate(-10%, 10%) scale(1);
  }
  25% {
    transform: translate(-10%, -10%) scale(1);
  }
  50% {
    transform: translate(10%, -10%) scale(1);
  }
  75% {
    transform: translate(10%, 10%) scale(1);
  }
  100% {
    transform: translate(-10%, 10%) scale(1);
  }
}

@keyframes glow4 {
  0% {
    transform: translate(10%, -10%) scale(1);
  }
  25% {
    transform: translate(10%, 10%) scale(1);
  }
  50% {
    transform: translate(-10%, 10%) scale(1);
  }
  75% {
    transform: translate(-10%, -10%) scale(1);
  }
  100% {
    transform: translate(10%, -10%) scale(1);
  }
}
</style>
