import api from './api';

export const ENGINEERING_MODULES = [
  'fire_load',
  'fire_load_density',
  'hrr',
  'floor_area',
  'volume',
  'ventilation',
  'occupant_load',
  'exit_width',
  'rset_aset',
  'hydrant',
  'sprinkler',
  'water_tank',
  'foam_system',
  'smoke_detector',
  'heat_detector',
  'smoke_exhaust',
  'fire_resistance',
  'battery_backup',
  'cable_derating',
  'generator',
];

export async function calculateEngineering(module, payload) {
  const { data } = await api.post('/engineering/calculate', { module, payload });
  return data;
}

export async function fetchEngineeringModules() {
  const { data } = await api.get('/engineering/modules');
  return data.modules || [];
}
