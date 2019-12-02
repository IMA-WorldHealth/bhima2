angular.module('bhima.controllers')
  .controller('analysisAuxiliaryCashController', AnalysisAuxiliaryCashController);

AnalysisAuxiliaryCashController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache',
  'reportData', '$state', 'AccountService', 'FormatTreeDataService',
];

function AnalysisAuxiliaryCashController($sce, Notify, SavedReports, AppCache,
  reportData, $state, Accounts, FormatTreeData) {
  const vm = this;
  const cache = new AppCache('analysisAuxiliaryCash');
  const reportUrl = 'reports/finance/analysis_auxiliary_cashbox';

  vm.previewGenerated = false;
  vm.reportDetails = {};

  Accounts.read()
    .then(elements => {
      // bind the accounts to the controller
      const accounts = FormatTreeData.order(elements);
      vm.accounts = accounts;
    });

  vm.onSelectFiscalYear = (fiscalYear) => {
    vm.reportDetails.fiscal_id = fiscalYear.id;
  };

  vm.onChangeShowDetails = value => {
    vm.reportDetails.shouldShowDetails = value;
  };

  vm.onSelectPeriod = (period) => {
    vm.reportDetails.period_id = period.id;
    vm.reportDetails.periodLabel = period.hrLabel;
    vm.reportDetails.end_date = period.end_date;
    vm.reportDetails.start_date = period.start_date;
  };

  vm.onSelectCashbox = (cashbox) => {
    vm.reportDetails.cashboxId = cashbox.id;
    vm.reportDetails.cashboxLabel = cashbox.hrlabel;
    vm.reportDetails.account_id = cashbox.account_id;
    vm.reportDetails.transfer_account_id = cashbox.transfer_account_id;
    vm.reportDetails.currency_id = cashbox.currency_id;
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
    }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then(result => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
  };

  vm.requestSaveAs = function requestSaveAs() {
    const options = {
      url : reportUrl,
      report : reportData,
      reportOptions : angular.copy(vm.reportDetails),
    };

    return SavedReports.saveAsModal(options)
      .then(() => {
        $state.go('reportsBase.reportsArchive', { key : options.report.report_key });
      })
      .catch(Notify.handleError);
  };

  checkCachedConfiguration();

  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
  }
}
