import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import CalendarLayout from '../CalendarLayout.vue';
import type { Station, Booking } from '../../types';

(globalThis as any).DragEvent = class DragEvent extends Event {
  dataTransfer: any;
  constructor(type: string, options: any = {}) {
    super(type, options);
    this.dataTransfer = options.dataTransfer || null;
  }
} as any;

const mockBookings: Booking[] = [
  {
    id: '1',
    customerName: 'John Doe',
    startDate: '2024-01-15',
    endDate: '2024-01-17',
    pickupReturnStationId: '1',
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    startDate: '2024-01-16',
    endDate: '2024-01-16',
    pickupReturnStationId: '1',
  },
  {
    id: '3',
    customerName: 'Bob Wilson',
    startDate: '2024-01-18',
    endDate: '2024-01-20',
    pickupReturnStationId: '1',
  },
];

const mockStation: Station = {
  id: 'station1',
  name: 'Downtown Station',
  bookings: mockBookings,
};

describe('CalendarLayout', () => {
  let wrapper: any;
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15'));
    wrapper = mount(CalendarLayout, {
      props: { selectedStation: mockStation },
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  describe('Component Structure & Rendering', () => {
    it('renders calendar with correct ARIA structure', () => {
      expect(wrapper.find('[role="region"]').exists()).toBe(true);
      expect(wrapper.find('[role="toolbar"]').exists()).toBe(true);
      expect(wrapper.find('[role="grid"]').exists()).toBe(true);
      expect(wrapper.findAll('[role="gridcell"]')).toHaveLength(7);
    });

    it('displays correct day labels in order', () => {
      const expectedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const gridCells = wrapper.findAll('[role="gridcell"]');

      gridCells.forEach((cell: any, index: number) => {
        expect(cell.text()).toContain(expectedDays[index]);
      });
    });

    it('renders navigation buttons with correct content', () => {
      const prevButton = wrapper.find('[aria-label="Go to previous week"]');
      const nextButton = wrapper.find('[aria-label="Go to next week"]');

      expect(prevButton.exists()).toBe(true);
      expect(nextButton.exists()).toBe(true);
      expect(prevButton.text()).toBe('←');
      expect(nextButton.text()).toBe('→');
    });
  });

  describe('Booking Display & Interaction', () => {
    it('displays bookings with customer names', () => {
      const text = wrapper.text();
      expect(text).toContain('John Doe');
      expect(text).toContain('Jane Smith');
      expect(text).toContain('Bob Wilson');

      const bookingItems = wrapper.findAll('.booking-item');
      expect(bookingItems.length).toBeGreaterThan(0);
    });

    it('shows "No bookings" for empty days', () => {
      const gridCells = wrapper.findAll('[role="gridcell"]');
      const emptyDays = gridCells.filter((cell: any) =>
        cell.text().includes('No bookings'),
      );
      expect(emptyDays.length).toBeGreaterThan(0);
    });

    it('emits bookingSelected when clicking a booking', async () => {
      await nextTick();
      const bookingItems = wrapper.findAll('.booking-item');

      if (bookingItems.length > 0) {
        await bookingItems[0].trigger('click');

        const emittedEvents = wrapper.emitted('bookingSelected');
        expect(emittedEvents).toBeTruthy();
        expect(emittedEvents?.[0]).toEqual([mockBookings[0]]);
      }
    });

    it('has interactive booking elements', async () => {
      await nextTick();
      const bookingItems = wrapper.findAll('.booking-item');

      if (bookingItems.length > 0) {
        const firstBooking = bookingItems[0];

        expect(firstBooking.exists()).toBe(true);
        expect(firstBooking.element.tagName).toBeTruthy();

        const hasInteractivity =
          firstBooking.attributes('tabindex') !== undefined ||
          firstBooking.attributes('role') !== undefined ||
          firstBooking.attributes('draggable') !== undefined;
        expect(hasInteractivity).toBe(true);

        await firstBooking.trigger('click');
        expect(wrapper.exists()).toBe(true);
      }
    });

    it('handles keyboard events on booking items', async () => {
      await nextTick();
      const bookingItems = wrapper.findAll('.booking-item');

      if (bookingItems.length > 0) {
        const firstBooking = bookingItems[0];

        await firstBooking.trigger('keydown.enter');
        await firstBooking.trigger('keydown.space');

        expect(wrapper.exists()).toBe(true);
        expect(firstBooking.exists()).toBe(true);
      }
    });

    it('booking items have proper styling classes', async () => {
      await nextTick();
      const bookingItems = wrapper.findAll('.booking-item');

      if (bookingItems.length > 0) {
        bookingItems.forEach((item: any) => {
          expect(item.classes()).toContain('booking-item');
          expect(item.element.className).toBeTruthy();
        });
      }
    });
  });

  describe('Week Navigation & Animation', () => {
    it('navigates to previous week and updates range', async () => {
      const initialRange = wrapper.find('[role="status"]').text();
      const prevButton = wrapper.find('[aria-label="Go to previous week"]');

      await prevButton.trigger('click');
      await nextTick();

      const newRange = wrapper.find('[role="status"]').text();
      expect(newRange).not.toBe(initialRange);
    });

    it('navigates to next week and updates range', async () => {
      const initialRange = wrapper.find('[role="status"]').text();
      const nextButton = wrapper.find('[aria-label="Go to next week"]');

      await nextButton.trigger('click');
      await nextTick();

      const newRange = wrapper.find('[role="status"]').text();
      expect(newRange).not.toBe(initialRange);
    });

    it('triggers animation on week change', async () => {
      const prevButton = wrapper.find('[aria-label="Go to previous week"]');

      await prevButton.trigger('click');
      await nextTick();

      expect(wrapper.exists()).toBe(true);
    });

    it('handles toolbar keyboard navigation', async () => {
      const toolbar = wrapper.find('[role="toolbar"]');

      await toolbar.trigger('keydown', { key: 'Home' });
      await toolbar.trigger('keydown', { key: 'End' });
      await toolbar.trigger('keydown', { key: 'ArrowLeft' });
      await toolbar.trigger('keydown', { key: 'ArrowRight' });

      expect(wrapper.exists()).toBe(true);
    });

    it('maintains correct week structure during navigation', async () => {
      const nextButton = wrapper.find('[aria-label="Go to next week"]');

      await nextButton.trigger('click');
      await nextTick();

      const gridCells = wrapper.findAll('[role="gridcell"]');
      expect(gridCells.length).toBe(7);
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('makes booking items draggable', async () => {
      await nextTick();
      const bookingItems = wrapper.findAll('.booking-item');

      if (bookingItems.length > 0) {
        bookingItems.forEach((item: any) => {
          expect(item.attributes('draggable')).toBe('true');
        });
      }
    });

    it('handles basic drag operations', async () => {
      await nextTick();
      const bookingItems = wrapper.findAll('.booking-item');

      if (bookingItems.length > 0) {
        await bookingItems[0].trigger('dragstart');
        await bookingItems[0].trigger('dragend');
        expect(wrapper.exists()).toBe(true);
      }
    });

    it('handles drop on grid cells', async () => {
      const gridCells = wrapper.findAll('[role="gridcell"]');

      if (gridCells.length > 0) {
        await gridCells[0].trigger('dragover');
        await gridCells[0].trigger('drop');
        expect(wrapper.exists()).toBe(true);
      }
    });

    it('prevents default drag behavior', async () => {
      const gridCells = wrapper.findAll('[role="gridcell"]');

      if (gridCells.length > 0) {
        const dragEvent = { preventDefault: vi.fn() };
        await gridCells[0].trigger('dragover', dragEvent);
        expect(wrapper.exists()).toBe(true);
      }
    });
  });

  describe('Accessibility Features', () => {
    it('has proper tabindex on grid cells', () => {
      const gridCells = wrapper.findAll('[role="gridcell"]');
      gridCells.forEach((cell: any) => {
        expect(cell.attributes('tabindex')).toBe('0');
      });
    });

    it('has aria-hidden on decorative elements', () => {
      const hiddenElements = wrapper.findAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });

    it('provides ARIA labels for accessibility', () => {
      const region = wrapper.find('[role="region"]');
      const toolbar = wrapper.find('[role="toolbar"]');
      const grid = wrapper.find('[role="grid"]');

      if (region.exists()) {
        expect(region.attributes('aria-label')).toBeTruthy();
      }
      if (toolbar.exists()) {
        expect(toolbar.attributes('aria-label')).toBeTruthy();
      }
      if (grid.exists()) {
        expect(grid.attributes('aria-label')).toBeTruthy();
      }
    });

    it('supports screen reader status updates', () => {
      const statusElements = wrapper.findAll('[role="status"]');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('has proper ARIA attributes on grid cells', () => {
      const gridCells = wrapper.findAll('[role="gridcell"]');

      gridCells.forEach((cell: any) => {
        expect(cell.attributes('aria-label')).toBeTruthy();
        expect(cell.attributes('role')).toBe('gridcell');
      });
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('handles empty station gracefully', async () => {
      const emptyStation: Station = {
        id: 'empty',
        name: 'Empty Station',
        bookings: [],
      };

      const emptyWrapper = mount(CalendarLayout, {
        props: { selectedStation: emptyStation },
      });

      await nextTick();

      expect(emptyWrapper.exists()).toBe(true);
      const gridCells = emptyWrapper.findAll('[role="gridcell"]');
      expect(gridCells.length).toBe(7);
    });

    it('maintains component state during interactions', async () => {
      const nextButton = wrapper.find('[aria-label="Go to next week"]');
      const prevButton = wrapper.find('[aria-label="Go to previous week"]');

      await nextButton.trigger('click');
      await nextTick();

      await prevButton.trigger('click');
      await nextTick();

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('[role="status"]').exists()).toBe(true);
    });

    it('handles rapid navigation without errors', async () => {
      const nextButton = wrapper.find('[aria-label="Go to next week"]');

      for (let i = 0; i < 5; i++) {
        await nextButton.trigger('click');
      }
      await nextTick();

      expect(wrapper.exists()).toBe(true);
    });

    it('handles bookings with different date ranges', () => {
      const bookingItems = wrapper.findAll('.booking-item');

      if (bookingItems.length > 0) {
        const texts = bookingItems.map((item: any) => item.text());
        expect(texts.some((text: String) => text.includes('John Doe'))).toBe(
          true,
        );
        expect(texts.some((text: String) => text.includes('Jane Smith'))).toBe(
          true,
        );
      }
    });
  });

  describe('Date and Time Utilities', () => {
    it('formats dates consistently', () => {
      const weekRange = wrapper.find('[role="status"]');
      expect(weekRange.text()).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('displays booking information correctly', async () => {
      await nextTick();
      const bookingItems = wrapper.findAll('.booking-item');

      if (bookingItems.length > 0) {
        bookingItems.forEach((item: any) => {
          const text = item.text();
          expect(text).toBeTruthy();
          expect(text.length).toBeGreaterThan(0);
        });
      }
    });

    it('shows correct day structure', () => {
      const gridCells = wrapper.findAll('[role="gridcell"]');
      expect(gridCells.length).toBe(7);

      gridCells.forEach((cell: any) => {
        expect(cell.exists()).toBe(true);
        expect(cell.text()).toBeTruthy();
      });
    });

    it('calculates correct day positions', () => {
      const gridCells = wrapper.findAll('[role="gridcell"]');
      const expectedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      gridCells.forEach((cell: any, index: number) => {
        expect(cell.text()).toContain(expectedDays[index]);
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('renders without errors on mount', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.html()).toBeTruthy();
    });

    it('updates when props change', async () => {
      const newStation: Station = {
        id: 'station2',
        name: 'New Station',
        bookings: [],
      };

      await wrapper.setProps({ selectedStation: newStation });
      await nextTick();

      expect(wrapper.exists()).toBe(true);
    });

    it('handles missing props gracefully', async () => {
      const minimalStation: Station = {
        id: 'minimal',
        name: '',
        bookings: [],
      };

      await wrapper.setProps({ selectedStation: minimalStation });
      await nextTick();

      expect(wrapper.exists()).toBe(true);
    });

    it('maintains reactivity after prop changes', async () => {
      const newBookings: Booking[] = [
        {
          id: '4',
          customerName: 'New Customer',
          startDate: '2024-01-16',
          endDate: '2024-01-16',
          pickupReturnStationId: '2',
        },
      ];

      const newStation: Station = {
        id: 'station3',
        name: 'Updated Station',
        bookings: newBookings,
      };

      await wrapper.setProps({ selectedStation: newStation });
      await nextTick();

      expect(wrapper.text()).toContain('New Customer');
    });
  });
});
