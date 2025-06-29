<template>
  <div
    class="flex flex-col items-center p-4 rounded-2xl relative overflow-hidden [box-shadow:0_0_10px_5px_#60a5fa55,0_0_80px_10px_#2563eb55]"
    role="region"
    aria-label="Calendar view for selected station"
  >
    <div
      class="absolute inset-0 pointer-events-none z-0 bg-diagonal-stripes bg-blue-400"
      aria-hidden="true"
    ></div>

    <div class="relative z-10 w-full max-w-xs sm:max-w-2xl md:max-w-4xl">
      <div
        class="flex justify-between items-center mb-4 gap-4"
        role="toolbar"
        aria-label="Week navigation"
      >
        <button
          @click="prevWeek"
          class="px-3 py-1 rounded border border-yellow-300 bg-yellow-400 hover:bg-gray-300 hover:border-yellow-400 text-gray-700 transition"
          aria-label="Go to previous week"
        >
          ←
        </button>

        <div
          class="font-bold text-sm sm:text-lg transition-all duration-300 text-center flex-1"
          :class="{
            'animate-shake-right': isChangingNextWeek,
            'animate-shake-left': isChangingPrevWeek,
          }"
          role="status"
          aria-live="polite"
          aria-label="Current week range"
        >
          {{ weekRange }}
        </div>

        <button
          @click="nextWeek"
          class="px-3 py-1 rounded border border-yellow-300 bg-yellow-400 hover:bg-gray-300 hover:border-yellow-400 text-gray-700 transition"
          aria-label="Go to next week"
        >
          →
        </button>
      </div>

      <div
        ref="weekGrid"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2 bg-pink-400 rounded-2xl shadow p-4 transition-all duration-300"
        :class="{
          'animate-shake-right': isChangingNextWeek,
          'animate-shake-left': isChangingPrevWeek,
        }"
        role="grid"
        aria-label="Weekly calendar grid"
      >
        <div
          v-for="(day, index) in days"
          :key="day.date"
          class="flex flex-col rounded-xl border border-gray-200 bg-purple-400 p-2 min-h-[100px] transition relative"
          :class="{
            'bg-green-400 border-green-300': dragOverDay === day.dateStr,
            'opacity-50': isDragging,
          }"
          role="gridcell"
          :aria-label="'booking'"
          :tabindex="0"
          @dragover.prevent="handleDragOver(day.dateStr)"
          @drop="handleDrop($event, day.dateStr)"
        >
          <div class="text-center mb-2">
            <div class="font-semibold text-xs md:text-base" aria-hidden="true">
              {{ day.label }}
            </div>
            <div class="text-xs text-gray-100 break-all" aria-hidden="true">
              {{ day.dateStr }}
            </div>
          </div>

          <div class="flex-1 space-y-1" v-if="day.bookings.length > 0">
            <div
              v-for="(booking, bookingIndex) in day.bookings"
              :key="booking.id"
              role="listitem"
            >
              <button
                class="booking-item w-full bg-white/20 rounded px-2 py-1 cursor-move border-2 border-transparent hover:border-yellow-400 transition-all"
                :class="{
                  'border-yellow-400 shadow-lg scale-105':
                    draggedBooking?.id === booking.id,
                  'opacity-30': isDragging && draggedBooking?.id !== booking.id,
                }"
                draggable="true"
                @dragstart="handleDragStart($event, booking, day.dateStr)"
                @dragend="handleDragEnd"
                @click="emit('bookingSelected', booking)"
              >
                <p class="text-xs text-gray-100 truncate text-left">
                  {{ booking.customerName }}
                </p>
                <p class="text-[8px] opacity-75 text-left">
                  {{ getBookingType(booking, day.dateStr) }}
                </p>
              </button>
            </div>
          </div>

          <div
            v-else
            class="flex-1 flex items-center justify-center py-2 text-xs text-gray-300 italic"
            :class="{ 'text-white font-semibold': dragOverDay === day.dateStr }"
            aria-hidden="true"
          >
            No bookings
          </div>

          <div
            v-if="dragOverDay === day.dateStr"
            class="absolute inset-0 border-4 border-dashed border-white-500 rounded-xl pointer-events-none"
            aria-hidden="true"
          ></div>
        </div>
      </div>

      <div
        v-if="isDragging"
        class="mt-4 text-center text-white bg-purple-400 rounded-lg p-3"
        role="status"
        aria-live="polite"
      >
        <p class="text-sm">
          Dragging {{ draggedBooking?.customerName }}'s booking
        </p>
        <p class="text-xs opacity-90 mt-1">
          Drop on a different day to reschedule {{ draggedBookingType }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Station, Booking } from '../types';

const props = defineProps<{
  selectedStation: Station;
}>();

const emit = defineEmits<{
  (e: 'bookingSelected', value: any): void;
  (
    e: 'bookingRescheduled',
    value: { booking: Booking; newDate: string; type: 'start' | 'end' },
  ): void;
}>();

const isDragging = ref(false);
const draggedBooking = ref<Booking | null>(null);
const draggedBookingType = ref<'pickup' | 'return' | ''>('');
const dragOverDay = ref<string>('');

const weekGrid = ref<HTMLDivElement | null>(null);
const isChangingNextWeek = ref(false);
const isChangingPrevWeek = ref(false);

const today = new Date();
const currentMonday = ref(getMonday(today));
const weekOffset = ref(0);

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const days = computed(() => {
  const weekStart = addDays(currentMonday.value, weekOffset.value * 7);

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => {
    const date = addDays(weekStart, i);
    const dateStr = date.toISOString().split('T')[0];

    const bookings = props.selectedStation.bookings.filter(
      (booking) =>
        booking.startDate.includes(dateStr) ||
        booking.endDate.includes(dateStr),
    );

    return { label, dateStr, bookings };
  });
});

const weekRange = computed(() => {
  const first = days.value[0].dateStr;
  const last = days.value[6].dateStr;
  return `${first} / ${last}`;
});

function getBookingType(booking: Booking, dateStr: string): string {
  const startDate = booking.startDate.slice(0, 10);
  const endDate = booking.endDate.slice(0, 10);

  if (dateStr === startDate && dateStr === endDate) {
    return 'Pickup & Return';
  } else if (dateStr === startDate) {
    return 'Pickup';
  } else if (dateStr === endDate) {
    return 'Return';
  }
  return '';
}

function handleDragStart(event: DragEvent, booking: Booking, fromDate: string) {
  isDragging.value = true;
  draggedBooking.value = booking;

  const bookingType = getBookingType(booking, fromDate);
  draggedBookingType.value = bookingType.toLowerCase().includes('pickup')
    ? 'pickup'
    : 'return';

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        bookingId: booking.id,
        fromDate,
        type: draggedBookingType.value,
      }),
    );
  }
}

function handleDragOver(dayStr: string) {
  dragOverDay.value = dayStr;
}

function handleDrop(event: DragEvent, targetDate: string) {
  event.preventDefault();

  if (!draggedBooking.value || !event.dataTransfer) {
    resetDragState();
    return;
  }

  const data = JSON.parse(event.dataTransfer.getData('text/plain'));
  const { fromDate, type } = data;

  if (fromDate === targetDate) {
    resetDragState();
    return;
  }

  fakeApi(draggedBooking.value, targetDate, type);
  resetDragState();
}

function fakeApi(booking: Booking, newDate: string, type: 'pickup' | 'return') {
  const bookingIndex = props.selectedStation.bookings.findIndex(
    (b) => b.id === booking.id,
  );
  if (bookingIndex === -1) return;

  const updatedBooking = { ...props.selectedStation.bookings[bookingIndex] };

  if (type === 'pickup') {
    updatedBooking.startDate = newDate;
  } else {
    updatedBooking.endDate = newDate;
  }

  props.selectedStation.bookings[bookingIndex] = updatedBooking;
}

function handleDragEnd() {
  resetDragState();
}

function resetDragState() {
  isDragging.value = false;
  draggedBooking.value = null;
  draggedBookingType.value = '';
  dragOverDay.value = '';
}

function prevWeek() {
  isChangingPrevWeek.value = true;
  weekOffset.value--;
  setTimeout(() => {
    isChangingPrevWeek.value = false;
  }, 600);
}

function nextWeek() {
  isChangingNextWeek.value = true;
  weekOffset.value++;
  setTimeout(() => {
    isChangingNextWeek.value = false;
  }, 600);
}
</script>

<style scoped>
@keyframes shake-right {
  50% {
    transform: translateX(10px);
    opacity: 0.5;
  }
  0%,
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes shake-left {
  50% {
    transform: translateX(-10px);
    opacity: 0.5;
  }
  0%,
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.animate-shake-right {
  animation: shake-right 0.5s ease-in-out;
}
.animate-shake-left {
  animation: shake-left 0.5s ease-in-out;
}
button:hover {
  transform: scale(1.1);
}

button:active {
  transform: scale(0.95);
}
.booking-item {
  transition: all 0.2s ease;
}

.booking-item:hover {
  transform: translateY(-1px);
}

.booking-item.dragging {
  transform: rotate(5deg) scale(1.05);
  z-index: 1000;
}
</style>
