export default class Scenario {
  constructor({
    name,
    baseScenarioName,
  }) {
    if (!this.baseScenarioName) {
      this.baseScenarioName = 'baseline';
    }
  }
}
