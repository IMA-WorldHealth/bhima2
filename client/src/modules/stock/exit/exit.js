angular.module('bhima.controllers')
  .controller('StockExitController', StockExitController);

// dependencies injections
StockExitController.$inject = [
  'NotifyService', 'SessionService', 'util',
  'bhConstants', 'ReceiptModal', 'StockExitFormService',
  'StockModalService', 'uiGridConstants', '$translate',
  'GridExportService', '$timeout', 'BarcodeService',
];

/**
 * @class StockExitController
 *
 * @description
 * This controller is responsible to handle stock exit module.
 */
function StockExitController(
  Notify, Session, util, bhConstants, ReceiptModal, StockForm,
  StockModal, uiGridConstants, $translate, GridExportService, $timeout, Barcode,
) {
  const vm = this;

  vm.stockForm = new StockForm('StockExit');

  vm.gridApi = {};
  vm.ROW_ERROR_FLAG = bhConstants.grid.ROW_ERROR_FLAG;
  vm.DATE_FMT = bhConstants.dates.format;

  // bind methods
  vm.maxLength = util.maxLength;
  vm.enterprise = Session.enterprise;

  vm.onSelectExitType = onSelectExitType;
  vm.submit = submit;

  const gridFooterTemplate = `
    <div style="margin-left: 10px;">
      {{ grid.appScope.gridApi.core.getVisibleRows().length }}
      <span translate>TABLE.AGGREGATES.ROWS</span>
    </div>
  `;

  const gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableColumnMenus : false,
    rowTemplate : 'modules/templates/grid/error.row.html',
    columnDefs : [{
      field : 'status',
      width : 25,
      displayName : '',
      cellTemplate : 'modules/stock/exit/templates/status.tmpl.html',
    }, {
      field : 'code',
      width : 120,
      displayName : 'INVENTORY.CODE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/code.tmpl.html',
    }, {
      field : 'description',
      displayName : 'TABLE.COLUMNS.DESCRIPTION',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/description.tmpl.html',
    }, {
      field : 'lot',
      width : 250,
      displayName : 'TABLE.COLUMNS.LOT',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/lot.tmpl.html',
    }, {
      field : 'quantity',
      width : 150,
      displayName : 'TABLE.COLUMNS.QUANTITY',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/quantity.tmpl.html',
      aggregationType : uiGridConstants.aggregationTypes.sum,
    }, {
      field : 'unit',
      width : 75,
      displayName : 'TABLE.COLUMNS.UNIT',
      headerCellFilter : 'translate',
    }, {
      field : 'available_lot',
      width : 150,
      displayName : 'TABLE.COLUMNS.AVAILABLE',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/available.tmpl.html',
    }, {
      field : 'expiration_date',
      width : 150,
      displayName : 'TABLE.COLUMNS.EXPIRE_IN',
      headerCellFilter : 'translate',
      cellTemplate : 'modules/stock/exit/templates/expiration.tmpl.html',
    }, {
      displayName : '',
      field : 'actions',
      width : 25,
      cellTemplate : 'modules/stock/exit/templates/actions.tmpl.html',
    }],
    data : vm.stockForm.store.data,

    // fastWatch to false is required for updating the grid correctly for
    // inventories loaded from an invoice for patient exit
    fastWatch : false,
    flatEntityAccess : true,
    showGridFooter : true,
    gridFooterTemplate,
    onRegisterApi,
  };

  // exposing the grid options to the view
  vm.gridOptions = gridOptions;

  const exportation = new GridExportService(vm.gridOptions);

  // runs validation and updates the messages for the user
  vm.validate = () => {
    vm.stockForm.validate();
    vm.messages = vm.stockForm.messages();
  };

  vm.setDepot = function setDepot(depot) {
    vm.stockForm.setDepot(depot);
    vm.validate();
  };

  vm.configureItem = function configureItem(row, lot) {
    vm.stockForm.configureItem(row, lot);
    vm.validate();
  };

  vm.removeItem = function removeItem(uuid) {
    vm.stockForm.removeItem(uuid);
    vm.validate();
  };

  /**
   * @method exportGrid
   * @description export the content of the grid to csv.
   */
  vm.exportGrid = () => {
    exportation.exportToCsv('Stock_Exit_', exportation.defaultColumnFormatter, vm.stockForm.formatRowsForExport);
  };

  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  }

  //
  function onSelectExitType(exitType, entity) {
    vm.stockForm.setExitType(exitType.label);

    switch (exitType.label) {
    case 'patient':
      vm.stockForm.setPatientDistribution(entity);
      break;
    case 'service':
      vm.stockForm.setServiceDistribution(entity);
      break;
    case 'depot':
      vm.stockForm.setDepotDistribution(entity);
      break;
    case 'loss':
      vm.stockForm.setLossDistribution();
      break;
    default:
      break;
    }

    vm.validate();
  }

  vm.setDate = function setDate(date) {
    vm.stockForm.setDate(date);
    vm.validate();
  };

  vm.clear = function clear() {
    vm.stockForm.clear();
    vm.validate();
  };

  function startup() {
    // setting params for grid loading state
    vm.loading = true;
    vm.hasError = false;

    vm.stockForm.setup();
    vm.validate();
  }

  vm.addItems = function addItems(numItems) {
    vm.stockForm.addItems(numItems);
    vm.validate();
  };

  vm.getLotByBarcode = function getLotByBarcode() {
    Barcode.modal({ shouldSearch : false })
      .then(record => {
        if (record.uuid) {
          vm.stockForm.addLotByBarcode(record.uuid);
          vm.messages = vm.stockForm.messages();
        }
      });
  };

  /**
   * @function errorLineHighlight
   *
   * @description
   * Sets the grid's error flag on the row to render a red highlight
   * on the row.
   *
   */
  function errorLineHighlight(row) {
    const { ROW_ERROR_FLAG } = bhConstants.grid;
    // set and unset error flag for allowing to highlight again the row
    // when the user click again on the submit button
    row[ROW_ERROR_FLAG] = true;
    $timeout(() => { row[ROW_ERROR_FLAG] = false; }, 3000);
  }

  function submit(form) {
    if (form.$invalid) { return null; }

    // run validation
    vm.validate();

    const isValidForSubmission = vm.stockForm.validate();

    // check if the form is valid
    if (isValidForSubmission === false) {

      let firstElement = true;

      vm.stockForm.store.data.forEach(row => {
        const hasErrors = row.errors().length > 0;
        if (hasErrors) {
          // flash the error highlight
          errorLineHighlight(row);

          // scroll to the first invalid item
          if (firstElement) {
            vm.gridApi.core.scrollTo(row);
            firstElement = false;
          }
        }
      });

      // flash the first error message to the user
      const [msg] = vm.stockForm.messages();
      Notify.danger(msg.text, 5000);

      return null;
    }

    const renderReceipt = ReceiptModal.getReceiptFnByFluxId(vm.stockForm.details.flux_id);

    return vm.stockForm.submit()
      .then(result => renderReceipt(result.uuid, true))
      .then(() => {
        vm.stockForm.clear();
        vm.validate();
      })
      .catch(Notify.handleError);
  }

  startup();
}
