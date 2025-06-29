import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import SearchComplete from '../SearchComplete.vue';

// Mock data para las pruebas
const mockStations = [
  { id: '1', name: 'Downtown Station' },
  { id: '2', name: 'Airport Station' },
  { id: '3', name: 'Central Station' },
  { id: '4', name: 'North Station' },
  { id: '5', name: 'Coast Station' },
];

describe('SearchComplete', () => {
  let wrapper: any;
  let mockApiSearch: any;

  beforeEach(() => {
    // Mock de la función API
    mockApiSearch = vi.fn().mockResolvedValue(mockStations);

    wrapper = mount(SearchComplete, {
      props: {
        apiSearch: mockApiSearch,
        placeholder: 'Search for a station',
        searchKey: 'name',
      },
    });
  });

  describe('Renderizado inicial', () => {
    it('debería renderizar correctamente', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('debería mostrar el placeholder correcto', () => {
      const input = wrapper.find('input');
      expect(input.attributes('placeholder')).toBe('Search for a station');
    });

    it('debería tener las aria-labels correctas', () => {
      const input = wrapper.find('input');
      expect(input.attributes('aria-label')).toContain('Search for stations');
      expect(input.attributes('role')).toBe('combobox');
      expect(input.attributes('aria-autocomplete')).toBe('list');
    });

    it('debería tener autocomplete="off"', () => {
      const input = wrapper.find('input');
      expect(input.attributes('autocomplete')).toBe('off');
    });

    it('no debería mostrar resultados inicialmente', () => {
      const resultsList = wrapper.find('#search-results');
      expect(resultsList.exists()).toBe(false);
    });
  });

  describe('Funcionalidad de búsqueda', () => {
    beforeEach(async () => {
      // Esperar a que se carguen los datos mock
      await nextTick();
    });

    it('debería cargar datos al montar el componente', () => {
      expect(mockApiSearch).toHaveBeenCalledOnce();
    });

    it('debería filtrar resultados al escribir', async () => {
      const input = wrapper.find('input');

      await input.setValue('down');
      await input.trigger('input');
      await nextTick();

      const resultsList = wrapper.find('#search-results');
      expect(resultsList.exists()).toBe(true);

      const listItems = wrapper.findAll('[role="option"]');
      expect(listItems).toHaveLength(1);
      expect(listItems[0].text()).toBe('Downtown Station');
    });

    it('debería ser case-insensitive', async () => {
      const input = wrapper.find('input');

      await input.setValue('AIRPORT');
      await input.trigger('input');
      await nextTick();

      const listItems = wrapper.findAll('[role="option"]');
      expect(listItems).toHaveLength(1);
      expect(listItems[0].text()).toBe('Airport Station');
    });

    it('debería mostrar múltiples resultados para búsquedas generales', async () => {
      const input = wrapper.find('input');

      await input.setValue('C');
      await input.trigger('input');
      await nextTick();

      const listItems = wrapper.findAll('[role="option"]');
      expect(listItems.length).toBeGreaterThan(1);
    });

    it('debería limpiar resultados cuando el input está vacío', async () => {
      const input = wrapper.find('input');

      // Primero agregar texto
      await input.setValue('down');
      await input.trigger('input');
      await nextTick();

      expect(wrapper.find('#search-results').exists()).toBe(true);

      // Luego limpiar
      await input.setValue('');
      await input.trigger('input');
      await nextTick();

      expect(wrapper.find('#search-results').exists()).toBe(false);
    });
  });

  describe('Selección de elementos', () => {
    beforeEach(async () => {
      const input = wrapper.find('input');
      await input.setValue('down');
      await input.trigger('input');
      await nextTick();
    });

    it('debería emitir evento al hacer click en un resultado', async () => {
      const firstOption = wrapper.find('[role="option"]');
      await firstOption.trigger('click');

      expect(wrapper.emitted('stationSelected')).toBeTruthy();
      expect(wrapper.emitted('stationSelected')[0]).toEqual([mockStations[0]]);
    });

    it('debería emitir evento al presionar Enter', async () => {
      const firstOption = wrapper.find('[role="option"]');
      await firstOption.trigger('keydown.enter');

      expect(wrapper.emitted('stationSelected')).toBeTruthy();
      expect(wrapper.emitted('stationSelected')[0]).toEqual([mockStations[0]]);
    });

    it('debería emitir evento al presionar Space', async () => {
      const firstOption = wrapper.find('[role="option"]');
      await firstOption.trigger('keydown.space');

      expect(wrapper.emitted('stationSelected')).toBeTruthy();
      expect(wrapper.emitted('stationSelected')[0]).toEqual([mockStations[0]]);
    });

    it('debería actualizar el input con el nombre seleccionado', async () => {
      const firstOption = wrapper.find('[role="option"]');
      await firstOption.trigger('click');
      await nextTick();

      const input = wrapper.find('input');
      expect(input.element.value).toBe('Downtown Station');
    });

    it('debería limpiar los resultados después de la selección', async () => {
      const firstOption = wrapper.find('[role="option"]');
      await firstOption.trigger('click');
      await nextTick();

      expect(wrapper.find('#search-results').exists()).toBe(false);
    });
  });

  describe('Accesibilidad', () => {
    it('debería tener el componente search con role correcto', () => {
      const searchComponent = wrapper.find('[role="search"]');
      expect(searchComponent.exists()).toBe(true);
      expect(searchComponent.attributes('aria-label')).toBe(
        'Station search component',
      );
    });

    it('debería tener label oculto para screen readers', () => {
      const label = wrapper.find('label[for="station-search"]');
      expect(label.exists()).toBe(true);
      expect(label.classes()).toContain('sr-only');
    });

    it('debería tener tabindex="0" en las opciones', async () => {
      const input = wrapper.find('input');
      await input.setValue('down');
      await input.trigger('input');
      await nextTick();

      const options = wrapper.findAll('[role="option"]');
      options.forEach((option: VueWrapper<Element>) => {
        expect(option.attributes('tabindex')).toBe('0');
      });
    });

    it('debería tener aria-selected="false" en todas las opciones', async () => {
      const input = wrapper.find('input');
      await input.setValue('station');
      await input.trigger('input');
      await nextTick();

      const options = wrapper.findAll('[role="option"]');
      options.forEach((option: VueWrapper<Element>) => {
        expect(option.attributes('aria-selected')).toBe('false');
      });
    });
  });

  describe('Props opcionales', () => {
    it('debería usar searchKey personalizada', async () => {
      const customWrapper = mount(SearchComplete, {
        props: {
          apiSearch: mockApiSearch,
          searchKey: 'id',
        },
      });
      await nextTick();

      const input = customWrapper.find('input');
      await input.setValue('1');
      await input.trigger('input');
      await nextTick();

      const listItems = customWrapper.findAll('[role="option"]');
      expect(listItems).toHaveLength(1);
      expect(listItems[0].text()).toBe('Downtown Station');
    });

    it('debería manejar placeholder undefined cuando no se proporciona', () => {
      const wrapperWithoutPlaceholder = mount(SearchComplete, {
        props: {
          apiSearch: mockApiSearch,
          searchKey: 'name',
        },
      });

      const input = wrapperWithoutPlaceholder.find('input');
      expect(input.attributes('placeholder')).toBeUndefined();
    });

    it('debería usar placeholder cuando se proporciona', () => {
      const customPlaceholder = 'Custom placeholder text';
      const wrapperWithPlaceholder = mount(SearchComplete, {
        props: {
          apiSearch: mockApiSearch,
          placeholder: customPlaceholder,
          searchKey: 'name',
        },
      });

      const input = wrapperWithPlaceholder.find('input');
      expect(input.attributes('placeholder')).toBe(customPlaceholder);
    });
  });

  describe('Efectos visuales y clases CSS', () => {
    it('debería cambiar clases según estado de resultados', async () => {
      const container = wrapper.find('.overflow-hidden');

      // Sin resultados - rounded-full
      expect(container.classes()).toContain('rounded-full');

      const input = wrapper.find('input');
      await input.setValue('down');
      await input.trigger('input');
      await nextTick();

      // Con resultados - rounded-2xl
      expect(container.classes()).toContain('rounded-2xl');
    });

    it('debería tener elementos glow ocultos para screen readers', () => {
      const glowElements = wrapper.findAll('.glow');
      expect(glowElements).toHaveLength(4);

      glowElements.forEach((glow: VueWrapper<Element>) => {
        expect(glow.attributes('aria-hidden')).toBe('true');
      });
    });

    it('debería aplicar hover styles correctamente', async () => {
      const input = wrapper.find('input');
      await input.setValue('down');
      await input.trigger('input');
      await nextTick();

      const option = wrapper.find('[role="option"]');
      expect(option.classes()).toContain('hover:bg-gray-200');
    });
  });

  describe('Manejo de errores', () => {
    it('debería manejar API que falla', async () => {
      const failingApiSearch = vi
        .fn()
        .mockRejectedValue(new Error('API Error'));

      const errorWrapper = mount(SearchComplete, {
        props: {
          apiSearch: failingApiSearch,
          searchKey: 'name',
        },
      });

      await nextTick();

      // No debería crashear la aplicación
      expect(errorWrapper.exists()).toBe(true);
    });

    it('debería manejar datos null/undefined', async () => {
      const nullApiSearch = vi.fn().mockResolvedValue(null);

      const nullWrapper = mount(SearchComplete, {
        props: {
          apiSearch: nullApiSearch,
          searchKey: 'name',
        },
      });

      await nextTick();

      const input = nullWrapper.find('input');
      await input.setValue('test');
      await input.trigger('input');
      await nextTick();

      // No debería mostrar resultados
      expect(nullWrapper.find('#search-results').exists()).toBe(false);
    });
  });
});
