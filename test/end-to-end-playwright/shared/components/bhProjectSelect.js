const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-project-select]';

module.exports = {

  set : async function set(project, id) {
    const locator = (id) ? by.id(id) : selector;
    const target = await TU.locator(locator);

    await target.click();

    await TU.uiSelect('$ctrl.projectId', project, target);
  },
};
