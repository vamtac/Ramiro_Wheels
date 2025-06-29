<template>
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    role="dialog"
    aria-modal="true"
    @click="closeModal"
    @keydown.esc="closeModal"
    tabindex="-1"
    ref="modalRef"
  >
    <div
      class="relative overflow-hidden [box-shadow:0_0_10px_5px_#c683ff,0_0_80px_10px_#c37aff] rounded-2xl shadow-2xl p-4 sm:p-6 max-w-xs sm:max-w-md lg:max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <div
        class="absolute inset-0 pointer-events-none z-0 bg-diagonal-stripes bg-purple-400"
      ></div>

      <div class="relative z-10 space-y-4 sm:space-y-6">
        <div class="flex justify-end">
          <button
            @click="closeModal"
            class="text-white hover:text-gray-300 text-xl sm:text-2xl font-bold bg-black/20 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
            aria-label="Close booking details"
          >
            ✕
          </button>
        </div>

        <div class="text-center space-y-2 sm:space-y-4">
          <h1
            class="text-xl sm:text-2xl font-bold text-white eighties-font"
            id="booking-detail-title"
          >
            Booking Details
          </h1>
          <div class="h-1 bg-yellow-400 mx-auto rounded w-16 sm:w-20"></div>
        </div>

        <div class="space-y-3 sm:space-y-4">
          <div
            v-for="(value, label) in bookingData"
            :key="label"
            class="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm space-y-1 sm:space-y-2"
            :id="label.toLowerCase().replace(/\s+/g, '-')"
          >
            <label class="text-xs sm:text-sm font-semibold text-gray-200">
              {{ label }}
            </label>
            <p
              class="text-sm sm:text-lg text-white break-words"
              :class="getFieldClass(label)"
            >
              {{ value }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Booking, Station } from '../types';

const props = defineProps<{
  booking: Booking;
  station: Station;
}>();

const emit = defineEmits<{
  (e: 'backToCalendar'): void;
}>();

const modalRef = ref<HTMLElement>();

const bookingDuration = computed(() => {
  const start = new Date(props.booking.startDate);
  const end = new Date(props.booking.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const bookingData = computed(() => ({
  'Customer Name': props.booking.customerName,
  'Booking Start Date': formatDate(props.booking.startDate),
  'Booking End Date': formatDate(props.booking.endDate),
  'Booking Duration': `${bookingDuration.value} ${bookingDuration.value === 1 ? 'day' : 'days'}`,
  'Pickup-Return Station': props.station.name,
}));

const getFieldClass = (label: string) => {
  return label === 'Customer Name' || label === 'Pickup-Return Station'
    ? 'text-lg font-medium'
    : 'text-lg';
};

const closeModal = () => {
  emit('backToCalendar');
};

onMounted(() => {
  if (modalRef.value) {
    modalRef.value.focus();
  }
});
</script>
