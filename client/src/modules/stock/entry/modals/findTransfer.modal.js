angular.module('bhima.controllers')
  .controller('StockFindTransferModalController', StockFindTransferModalController);

StockFindTransferModalController.$inject = [
  '$uibModalInstance', 'StockService', 'NotifyService', 'uiGridConstants',
  'GridFilteringService', 'ReceiptModal', 'data',
];

function StockFindTransferModalController(Instance, StockService, Notify,
  uiGridConstants, Filtering, Receipts, data) {
  var vm = this;

  // global
  vm.selectedRow = {};

  /* ======================= Grid configurations ============================ */
  vm.filterEnabled = false;
  vm.gridOptions = { appScopeProvider: vm };

  var filtering = new Filtering(vm.gridOptions);

  var columns = [
    {
      field: 'reference',
      displayName: 'TABLE.COLUMNS.REFERENCE',
      headerCellFilter: 'translate',
      cellTemplate: 'modules/stock/entry/modals/templates/transfer_reference.tmpl.html'
    },
    {
      field: 'date',
      cellFilter: 'date',
      filter: { condition: filtering.filterByDate },
      displayName: 'TABLE.COLUMNS.DATE',
      headerCellFilter: 'translate',
      sort: { priority: 0, direction: 'desc' },
    },
    {
      field: 'depot_text',
      displayName: 'FORM.LABELS.DEPOT',
      headerCellFilter: 'translate'
    },
  ];

  vm.gridOptions.columnDefs = columns;
  vm.gridOptions.multiSelect = false;
  vm.gridOptions.enableFiltering = vm.filterEnabled;
  vm.gridOptions.onRegisterApi = onRegisterApi;
  vm.toggleFilter = toggleFilter;

  // bind methods
  vm.submit = submit;
  vm.cancel = cancel;
  vm.showReceipt = showReceipt;

  function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
    vm.gridApi.selection.on.rowSelectionChanged(null, rowSelectionCallback);
  }

  function rowSelectionCallback(row) {
    vm.selectedRow = row.entity;
  }

  /** toggle filter */
  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  /** get transfer document */
  function showReceipt(uuid) {
    Receipts.stockExitDepotReceipt(uuid, true);
  }

  /* ======================= End Grid ======================================== */
  StockService.movements.read(null, {
    entity_uuid: data.depot_uuid,
    is_exit: 1,
    finalClauseParameter: 'GROUP BY document_uuid',
  })
    .then(function (transfers) {
      vm.gridOptions.data = transfers;
    })
    .catch(Notify.errorHandler);

  // submit
  function submit() {
    if (!vm.selectedRow) { return; }

    return StockService.movements.read(null, {
      document_uuid: vm.selectedRow.document_uuid,
    })
      .then(function (transfers) {
        Instance.close(transfers);
      })
      .catch(Notify.errorHandler);
  }

  // cancel
  function cancel() {
    Instance.dismiss();
  }

}
