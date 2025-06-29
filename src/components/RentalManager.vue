<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import CalendarLayout from './CalendarLayout.vue';
import BookingDetail from './BookingDetail.vue';
import SearchComplete from './SearchComplete.vue';
import stationsMock from '../assets/stations.mock.json';
import type { Station, Booking } from '../types';
import { STATIONS_URL } from '../constants';

const selectedStation = ref<Station | null>(null);
const selectedBooking = ref<Booking | null>(null);

async function searchApi() {
  //const { data } = await axios.get(STATIONS_URL);
  //return data || [];
  return stationsMock;
}

function onStationSelect(item: Station) {
  selectedStation.value = item;
}

function onBookingSelect(item: Booking) {
  selectedBooking.value = item;
}
</script>

<template>
  <img src="../assets/logo.png" alt="Logo" class="mx-auto w-90 lg:w-120" />

  <SearchComplete
    :apiSearch="searchApi"
    searchKey="name"
    placeholder="Search for a station"
    @stationSelected="onStationSelect"
  />

  <CalendarLayout
    v-if="selectedStation !== null"
    :selectedStation="selectedStation"
    @bookingSelected="onBookingSelect"
  />

  <BookingDetail
    v-if="selectedBooking && selectedStation"
    :booking="selectedBooking"
    :station="selectedStation"
    @backToCalendar="selectedBooking = null"
  />
</template>
