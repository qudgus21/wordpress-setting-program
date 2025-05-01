import { create } from 'zustand';

const useInstanceStore = create(set => ({
  instances: [],
  isLoaded: false,
  setIsLoaded: value => set({ isLoaded: value }),
  setInstances: newInstances =>
    set(state => ({
      instances: Array.isArray(newInstances) ? newInstances : state.instances,
    })),
  updateInstance: (instanceId, updates) =>
    set(state => ({
      instances: state.instances.map(instance => (instance.id === instanceId ? { ...instance, ...updates } : instance)),
    })),
}));

export default useInstanceStore;
