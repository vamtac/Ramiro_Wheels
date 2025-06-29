import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import RentalManager from '../RentalManager.vue';
import type { Station, Booking } from '../../types';

vi.mock('./CalendarLayout.vue', () => ({
  default: {
    name: 'CalendarLayout',
    template: '<div data-testid="calendar-layout">Calendar Layout</div>',
    props: ['selectedStation'],
    emits: ['bookingSelected'],
  },
}));

vi.mock('./BookingDetail.vue', () => ({
  default: {
    name: 'BookingDetail',
    template: '<div data-testid="booking-detail">Booking Detail</div>',
    props: ['booking', 'station'],
    emits: ['backToCalendar'],
  },
}));

vi.mock('./SearchComplete.vue', () => ({
  default: {
    name: 'SearchComplete',
    template: '<div data-testid="search-complete">Search Complete</div>',
    props: ['apiSearch', 'searchKey', 'placeholder'],
    emits: ['stationSelected'],
  },
}));

const mockStation: Station = {
  id: '1',
  name: 'Test Station',
  bookings: [],
};

const mockBooking: Booking = {
  id: '1',
  customerName: 'John Doe',
  startDate: '2024-01-15',
  endDate: '2024-01-17',
  pickupReturnStationId: '1',
};

describe('RentalManager', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(RentalManager);
  });

  describe('Initial rendering', () => {
    it('should render correctly', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should display logo', () => {
      const logo = wrapper.find('img[alt="Logo"]');
      expect(logo.exists()).toBe(true);
      expect(logo.attributes('src')).toBe('/src/assets/logo.png');
    });

    it('should render SearchComplete component', () => {
      const searchComplete = wrapper.findComponent({ name: 'SearchComplete' });
      expect(searchComplete.exists()).toBe(true);
    });

    it('should pass correct props to SearchComplete', () => {
      const searchComplete = wrapper.findComponent({ name: 'SearchComplete' });
      const props = searchComplete.props();

      expect(props.searchKey).toBe('name');
      expect(props.placeholder).toBe('Search for a station');
      expect(typeof props.apiSearch).toBe('function');
    });

    it('should not render CalendarLayout initially', () => {
      const calendar = wrapper.findComponent({ name: 'CalendarLayout' });
      expect(calendar.exists()).toBe(false);
    });

    it('should not render BookingDetail initially', () => {
      const bookingDetail = wrapper.findComponent({ name: 'BookingDetail' });
      expect(bookingDetail.exists()).toBe(false);
    });
  });

  describe('Station selection', () => {
    it('should show CalendarLayout when station is selected', async () => {
      const searchComplete = wrapper.findComponent({ name: 'SearchComplete' });

      await searchComplete.vm.$emit('stationSelected', mockStation);
      await nextTick();

      const calendar = wrapper.findComponent({ name: 'CalendarLayout' });
      expect(calendar.exists()).toBe(true);
      expect(calendar.props('selectedStation')).toEqual(mockStation);
    });

    it('should update selectedStation when onStationSelect is called', async () => {
      const searchComplete = wrapper.findComponent({ name: 'SearchComplete' });

      await searchComplete.vm.$emit('stationSelected', mockStation);
      await nextTick();

      expect(wrapper.vm.selectedStation).toEqual(mockStation);
    });
  });

  describe('Booking selection', () => {
    beforeEach(async () => {
      const searchComplete = wrapper.findComponent({ name: 'SearchComplete' });
      await searchComplete.vm.$emit('stationSelected', mockStation);
      await nextTick();
    });

    it('should show BookingDetail when booking is selected', async () => {
      const calendar = wrapper.findComponent({ name: 'CalendarLayout' });

      await calendar.vm.$emit('bookingSelected', mockBooking);
      await nextTick();

      const bookingDetail = wrapper.findComponent({ name: 'BookingDetail' });
      expect(bookingDetail.exists()).toBe(true);
      expect(bookingDetail.props('booking')).toEqual(mockBooking);
      expect(bookingDetail.props('station')).toEqual(mockStation);
    });

    it('should update selectedBooking when onBookingSelect is called', async () => {
      const calendar = wrapper.findComponent({ name: 'CalendarLayout' });

      await calendar.vm.$emit('bookingSelected', mockBooking);
      await nextTick();

      expect(wrapper.vm.selectedBooking).toEqual(mockBooking);
    });
  });

  describe('Navigation flow', () => {
    it('should hide BookingDetail when backToCalendar is emitted', async () => {
      const searchComplete = wrapper.findComponent({ name: 'SearchComplete' });
      await searchComplete.vm.$emit('stationSelected', mockStation);
      await nextTick();

      const calendar = wrapper.findComponent({ name: 'CalendarLayout' });
      await calendar.vm.$emit('bookingSelected', mockBooking);
      await nextTick();

      let bookingDetail = wrapper.findComponent({ name: 'BookingDetail' });
      expect(bookingDetail.exists()).toBe(true);

      await bookingDetail.vm.$emit('backToCalendar');
      await nextTick();

      bookingDetail = wrapper.findComponent({ name: 'BookingDetail' });
      expect(bookingDetail.exists()).toBe(false);

      expect(wrapper.vm.selectedBooking).toBe(null);
    });

    it('should show complete flow: search -> calendar -> booking -> back', async () => {
      const searchComplete = wrapper.findComponent({ name: 'SearchComplete' });
      await searchComplete.vm.$emit('stationSelected', mockStation);
      await nextTick();

      expect(wrapper.findComponent({ name: 'CalendarLayout' }).exists()).toBe(
        true,
      );
      expect(wrapper.findComponent({ name: 'BookingDetail' }).exists()).toBe(
        false,
      );

      const calendar = wrapper.findComponent({ name: 'CalendarLayout' });
      await calendar.vm.$emit('bookingSelected', mockBooking);
      await nextTick();

      expect(wrapper.findComponent({ name: 'CalendarLayout' }).exists()).toBe(
        true,
      );
      expect(wrapper.findComponent({ name: 'BookingDetail' }).exists()).toBe(
        true,
      );

      const bookingDetail = wrapper.findComponent({ name: 'BookingDetail' });
      await bookingDetail.vm.$emit('backToCalendar');
      await nextTick();

      expect(wrapper.findComponent({ name: 'CalendarLayout' }).exists()).toBe(
        true,
      );
      expect(wrapper.findComponent({ name: 'BookingDetail' }).exists()).toBe(
        false,
      );
    });
  });

  describe('API function', () => {
    it('should return stations from mock data', async () => {
      const result = await wrapper.vm.searchApi();

      expect(Array.isArray(result)).toBe(true);
      console.log(result);
      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });
  });

  describe('Conditional rendering', () => {
    it('should only show BookingDetail when both booking and station are selected', async () => {
      wrapper.vm.selectedBooking = mockBooking;
      await nextTick();

      expect(wrapper.findComponent({ name: 'BookingDetail' }).exists()).toBe(
        false,
      );

      wrapper.vm.selectedStation = mockStation;
      wrapper.vm.selectedBooking = null;
      await nextTick();

      expect(wrapper.findComponent({ name: 'BookingDetail' }).exists()).toBe(
        false,
      );

      wrapper.vm.selectedBooking = mockBooking;
      await nextTick();

      expect(wrapper.findComponent({ name: 'BookingDetail' }).exists()).toBe(
        true,
      );
    });

    it('should only show CalendarLayout when station is selected', async () => {
      expect(wrapper.findComponent({ name: 'CalendarLayout' }).exists()).toBe(
        false,
      );
      wrapper.vm.selectedStation = mockStation;
      await nextTick();

      expect(wrapper.findComponent({ name: 'CalendarLayout' }).exists()).toBe(
        true,
      );
    });
  });
});
