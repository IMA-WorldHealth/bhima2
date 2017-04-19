/* global browser, element, by */
const chai = require('chai');
const helpers = require('../shared/helpers');
const FU = require('../shared/FormUtils');
const GU = require('../shared/GridUtils');
const components = require('../shared/components');

helpers.configure(chai);
const expect = chai.expect;

describe('Edit Posting Journal', () => {
  const path = '#!/journal';
  const gridId = 'journal-grid';
  before(() => helpers.navigate(path));

  var accountKey = 11;

  it('edits a transaction change an account', function () {
    // click the "grouping" button
    FU.buttons.grouping();
    element.all(by.css('[class="ui-grid-icon-plus-squared"]')).get(0).click();
    element.all(by.css('[class="fa fa-edit"]')).get(0).click();
    const accountNumberCell = GU.getCellName(gridId, 1, 4);
    // simulate dbl click
    browser.actions().mouseMove(accountNumberCell).doubleClick().perform();
    
    accountNumberCell.element(by.css("input")).sendKeys(protractor.Key.chord(protractor.Key.CONTROL, "a"));
    accountNumberCell.element(by.css("input")).sendKeys(protractor.Key.BACK_SPACE);

    accountNumberCell.element(by.css("input")).sendKeys(accountKey);
    element.all(by.css('[title="1100 - Test Capital One"]')).click();

    element.all(by.css('[class="fa fa-save"]')).click();

    components.notification.hasSuccess();
    element.all(by.css('[class="ui-grid-icon-minus-squared"]')).get(0).click();
    FU.buttons.grouping();
  });


  it('edits a transaction change value of Debit and Credit', function () {
    FU.buttons.grouping();
    element.all(by.css('[class="ui-grid-icon-plus-squared"]')).get(1).click();
    element.all(by.css('[class="fa fa-edit"]')).get(1).click();
    
    const debitCell = GU.getCellName(gridId, 2, 5);
    const creditCell = GU.getCellName(gridId, 3, 6);
    // simulate dbl click
    browser.actions().mouseMove(debitCell).doubleClick().perform();
    debitCell.element(by.css("input")).sendKeys(50);

    browser.actions().mouseMove(creditCell).doubleClick().perform();
    creditCell.element(by.css("input")).sendKeys(50);

    element.all(by.css('[class="fa fa-save"]')).click();

    components.notification.hasSuccess();
    element.all(by.css('[class="ui-grid-icon-minus-squared"]')).get(0).click();
    FU.buttons.grouping();
  });

  // Test for validation 
  it('Preventing a single-line transaction', function () {
    FU.buttons.grouping();
    element.all(by.css('[class="ui-grid-icon-plus-squared"]')).get(1).click();
    element.all(by.css('[class="fa fa-edit"]')).get(1).click();

    element.all(by.css('[class="ui-grid-selection-row-header-buttons ui-grid-icon-ok ng-scope"]')).get(3).click();

    element.all(by.css('[class="fa fa-trash"]')).click();
    element.all(by.css('[class="fa fa-save"]')).click();

    components.notification.hasWarn();
    element.all(by.css('[class="fa fa-ban"]')).click();
    element.all(by.css('[class="ui-grid-icon-minus-squared"]')).get(0).click();
    FU.buttons.grouping();
  });

  it('Preventing unbalanced transaction', function () {
    FU.buttons.grouping();
    element.all(by.css('[class="ui-grid-icon-plus-squared"]')).get(1).click();
    element.all(by.css('[class="fa fa-edit"]')).get(1).click();
    
    const debitCell = GU.getCellName(gridId, 2, 5);
    const creditCell = GU.getCellName(gridId, 3, 6);
    // simulate dbl click
    browser.actions().mouseMove(debitCell).doubleClick().perform();
    debitCell.element(by.css("input")).sendKeys(100);

    browser.actions().mouseMove(creditCell).doubleClick().perform();
    creditCell.element(by.css("input")).sendKeys(50);

    element.all(by.css('[class="fa fa-save"]')).click();

    components.notification.hasWarn();
    element.all(by.css('[class="fa fa-ban"]')).click();
    element.all(by.css('[class="ui-grid-icon-minus-squared"]')).get(0).click();
    FU.buttons.grouping();
  });

  it('Preventing transaction who have debit and Credit null', function () {
    FU.buttons.grouping();
    element.all(by.css('[class="ui-grid-icon-plus-squared"]')).get(1).click();
    element.all(by.css('[class="fa fa-edit"]')).get(1).click();
    
    const debitCell = GU.getCellName(gridId, 2, 5);
    const creditCell = GU.getCellName(gridId, 2, 6);
    // simulate dbl click
    browser.actions().mouseMove(debitCell).doubleClick().perform();
    debitCell.element(by.css("input")).sendKeys(0);

    browser.actions().mouseMove(creditCell).doubleClick().perform();
    creditCell.element(by.css("input")).sendKeys(0);

    element.all(by.css('[class="fa fa-save"]')).click();

    components.notification.hasWarn();
    element.all(by.css('[class="fa fa-ban"]')).click();
    element.all(by.css('[class="ui-grid-icon-minus-squared"]')).get(0).click();
    FU.buttons.grouping();
  });

  it('Preventing transaction who was debited and Credited in a same line', function () {
    FU.buttons.grouping();
    element.all(by.css('[class="ui-grid-icon-plus-squared"]')).get(1).click();
    element.all(by.css('[class="fa fa-edit"]')).get(1).click();
    
    const debitCell = GU.getCellName(gridId, 2, 5);
    const creditCell = GU.getCellName(gridId, 2, 6);
    // simulate dbl click
    browser.actions().mouseMove(debitCell).doubleClick().perform();
    debitCell.element(by.css("input")).sendKeys(50);

    browser.actions().mouseMove(creditCell).doubleClick().perform();
    creditCell.element(by.css("input")).sendKeys(50);

    element.all(by.css('[class="fa fa-save"]')).click();

    components.notification.hasWarn();
    element.all(by.css('[class="fa fa-ban"]')).click();
    element.all(by.css('[class="ui-grid-icon-minus-squared"]')).get(0).click();
    FU.buttons.grouping();
  });


});
