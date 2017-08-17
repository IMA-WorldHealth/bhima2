/* global element, by, browser */
'use strict';

const FU = require('../shared/FormUtils');
const GU = require('../shared/GridUtils');
const helpers = require('../shared/helpers');
const components = require('../shared/components');

function StockMovementsRegistryTests() {

  // navigate to the page
  before(() => helpers.navigate('#/stock/movements'));

  const gridId = 'stock-movements-grid';

  const depotGroupingRow = 1;

  it('find entry/exit movements', () => {

    // entry movements
    FU.buttons.search();
    FU.radio('$ctrl.bundle.is_exit', 0);
    FU.modal.submit();
    GU.expectRowCount(gridId, 17 + (3 * depotGroupingRow));

    // exit movements
    FU.buttons.search();
    FU.radio('$ctrl.bundle.is_exit', 1);
    FU.modal.submit();
    GU.expectRowCount(gridId, 8 + depotGroupingRow);

    // clear filters
    FU.buttons.clear();
  });

  it('find movements by depot', () => {

    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.depot_uuid', 'Depot Secondaire');
    FU.modal.submit();
    GU.expectRowCount(gridId, 6 + depotGroupingRow);

    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.depot_uuid', 'Depot Principal');
    FU.modal.submit();
    GU.expectRowCount(gridId, 17 + depotGroupingRow);

    // clear filters
    FU.buttons.clear();
  });

  it('find movements by inventory', () => {

    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.inventory_uuid', 'First Test Inventory Item');
    FU.modal.submit();
<<<<<<< HEAD
    GU.expectRowCount(gridId, 15 + (3 * depotGroupingRow));
=======
    GU.expectRowCount(gridId, 13 + (2 * depotGroupingRow));
>>>>>>> e8ed3696d2bc3992c3b6e653b0566c311e3cb56e

    // clear filters
    FU.buttons.clear();
  });


  it('find movements by lot name', () => {

    FU.buttons.search();
    FU.input('$ctrl.bundle.label', 'VITAMINE-A');
    FU.modal.submit();
    GU.expectRowCount(gridId, 5 + depotGroupingRow);

    // clear filters
    FU.buttons.clear();
  });

  it('find by lots reasons', () => {
    // FIXME: reasons must not depend on translations
    //        selection with `id` works but it is not completed

    // from purchase
    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.flux_id', 'Commande d\'achat');
    FU.modal.submit();
<<<<<<< HEAD
    GU.expectRowCount(gridId, 24 + (3 * depotGroupingRow));
=======
    GU.expectRowCount(gridId, 24 + depotGroupingRow);
>>>>>>> e8ed3696d2bc3992c3b6e653b0566c311e3cb56e

    // to patient
    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.flux_id', 'Vers un patient');
    FU.modal.submit();
<<<<<<< HEAD
    GU.expectRowCount(gridId, 24 + (3 * depotGroupingRow));
=======
    GU.expectRowCount(gridId, 24 + depotGroupingRow);
>>>>>>> e8ed3696d2bc3992c3b6e653b0566c311e3cb56e

    // to depot
    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.flux_id', 'Vers un depot');
    FU.modal.submit();
    GU.expectRowCount(gridId, 24 + depotGroupingRow);

    // from depot
    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.flux_id', 'En provenance d\'un depot');
    FU.modal.submit();
    GU.expectRowCount(gridId, 24 + depotGroupingRow);

    // positive adjustment
    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.flux_id', 'Ajustement (Positif)');
    FU.modal.submit();
    GU.expectRowCount(gridId, 24 + depotGroupingRow);

    // negative adjustment
    FU.buttons.search();
    FU.uiSelect('$ctrl.bundle.flux_id', 'Ajustement (Negatif)');
    FU.modal.submit();
    GU.expectRowCount(gridId, 24 + depotGroupingRow);

    // clear filters
    FU.buttons.clear();
  });

  it('find lots by date - Fev 2017', () => {

    FU.buttons.search();
    components.dateInterval.range('02/02/2017', '02/02/2017');
    FU.modal.submit();
    GU.expectRowCount(gridId, 8 + depotGroupingRow);

    FU.buttons.search();
    components.dateInterval.range('01/01/2015', '30/01/2015');
    FU.modal.submit();
    GU.expectRowCount(gridId, 0);

    // clear filters
    FU.buttons.clear();
  });
}

describe('Stock Movement Registry', StockMovementsRegistryTests);
