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
      console.log(value);
      console.log(key);
      scenarioLookup[key] = value.name;
    });
    console.log(scenarioLookup);
    return scenarioLookup;
  },

  clearStore: async () => {
    await scenarioStore.clear();
  },

  save: async (id, scene) => {
    console.log('save key', id)
    console.log('save value', scene)
    await scenarioStore.setItem(id, scene);
    // return Scenario.getScenarioStore();
  },

  addFeature: async (feature, scenarioName) => {
    const scenario = await scenarioStore.getItem(scenarioName);
    console.log('addfeature to ', scenario);
    scenario.features[feature.fid] = feature;
    await scenarioStore.setItem(scenarioName, scenario);
  },

  new: (name) => {
    const id = window.crypto.getRandomValues(new Uint16Array(1))[0]
    return [id, newScenario(name)];
  },

  getScenario: async (id) => {
    const scenario = await scenarioStore.getItem(id);
    console.log(scenario);
    return scenario;
  }
};
