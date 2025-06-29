import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Configuración global para los tests
config.global.components = {
  // Registrar componentes globales si los hay
};

config.global.mocks = {
  // Mocks globales si los necesitas
  $router: {
    push: vi.fn(),
  },
};

// Configuraciones adicionales
config.global.plugins = [];
