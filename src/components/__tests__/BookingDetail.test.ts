import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import BookingDetail from '../BookingDetail.vue';

const mockBooking = {
  id: '1',
  customerName: 'John Doe',
  startDate: '2025-01-15T10:00:00Z',
  endDate: '2025-01-17T14:00:00Z',
  pickupReturnStationId: 'station-1',
};

const mockStation = {
  id: 'station-1',
  name: 'Central Station',
  bookings: [],
};

describe('BookingDetail', () => {
  const createWrapper = (props = {}) => {
    return mount(BookingDetail, {
      props: {
        booking: mockBooking,
        station: mockStation,
        ...props,
      },
    });
  };

  it('displays booking details correctly', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('#customer-name p').text()).toBe('John Doe');
    expect(wrapper.find('#pickup-return-station p').text()).toBe(
      'Central Station',
    );
  });

  it('shows formatted dates', () => {
    const wrapper = createWrapper();

    const startDate = wrapper.find('#booking-start-date p').text();
    const endDate = wrapper.find('#booking-end-date p').text();

    expect(startDate).toContain('January 15, 2025');
    expect(endDate).toContain('January 17, 2025');
  });

  it('calculates booking duration', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('#booking-duration p').text()).toBe('3 days');
  });

  it('shows singular day for one-day booking', () => {
    const sameDayBooking = {
      ...mockBooking,
      startDate: '2025-01-15T10:00:00Z',
      endDate: '2025-01-15T14:00:00Z',
    };

    const wrapper = createWrapper({ booking: sameDayBooking });

    expect(wrapper.find('#booking-duration p').text()).toBe('1 day');
  });

  it('closes modal when X button is clicked', async () => {
    const wrapper = createWrapper();

    await wrapper
      .find('button[aria-label="Close booking details"]')
      .trigger('click');

    expect(wrapper.emitted('backToCalendar')).toHaveLength(1);
  });

  it('closes modal when backdrop is clicked', async () => {
    const wrapper = createWrapper();

    await wrapper.find('[role="dialog"]').trigger('click');

    expect(wrapper.emitted('backToCalendar')).toHaveLength(1);
  });

  it('does not close when clicking modal content', async () => {
    const wrapper = createWrapper();

    await wrapper.find('.relative.overflow-hidden').trigger('click');

    expect(wrapper.emitted('backToCalendar')).toBeFalsy();
  });

  it('closes modal on escape key', async () => {
    const wrapper = createWrapper();

    await wrapper.find('[role="dialog"]').trigger('keydown.esc');

    expect(wrapper.emitted('backToCalendar')).toHaveLength(1);
  });

  it('has proper modal attributes', () => {
    const wrapper = createWrapper();
    const modal = wrapper.find('[role="dialog"]');

    expect(modal.attributes('aria-modal')).toBe('true');
    expect(modal.attributes('tabindex')).toBe('-1');
  });

  it('applies correct CSS classes to fields', () => {
    const wrapper = createWrapper();

    const customerName = wrapper.find('#customer-name p');
    const duration = wrapper.find('#booking-duration p');

    expect(customerName.classes()).toContain('font-medium');
    expect(duration.classes()).not.toContain('font-medium');
  });

  it('displays all booking fields', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('#customer-name')).toBeTruthy();
    expect(wrapper.find('#booking-start-date')).toBeTruthy();
    expect(wrapper.find('#booking-end-date')).toBeTruthy();
    expect(wrapper.find('#booking-duration')).toBeTruthy();
    expect(wrapper.find('#pickup-return-station')).toBeTruthy();
  });

  it('focuses modal on mount', () => {
    const focusSpy = vi.fn();
    const mockElement = { focus: focusSpy };

    const wrapper = createWrapper();
    wrapper.vm.$refs.modalRef = mockElement;
    wrapper.vm.$nextTick(() => {
      expect(focusSpy).toHaveBeenCalled();
    });
  });
});
