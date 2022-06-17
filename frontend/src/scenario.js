import localforage from 'localforage';

const scenarioStore = localforage.createInstance({
  name: 'scenarios'
});

function newScenario(name) {
  return { name: name, features: {} };
}

export default {
  getAllScenarios: async () => {
    const scenarioLookup = {};
    await scenarioStore.iterate((value, key, idx) => {
      scenarioLookup[key] = value.name;
    });
    return scenarioLookup;
  },

  clearStore: async () => {
    await scenarioStore.clear();
  },

  save: async (id, scene) => {
    await scenarioStore.setItem(id, scene);
  },

  new: (name) => {
    const id = window.crypto.getRandomValues(new Uint16Array(1))[0]
    return [id, newScenario(name)];
  },

  getScenario: async (id) => {
    const scenario = await scenarioStore.getItem(id);
    return scenario;
  }
};
