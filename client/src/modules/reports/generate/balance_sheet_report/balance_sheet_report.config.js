angular.module('bhima.controllers')
  .controller('balance_sheet_reportController', BalanceSheetReportConfigController);

BalanceSheetReportConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache',
  'reportData', '$state',
];

function BalanceSheetReportConfigController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  const vm = this;
  const cache = new AppCache('configure_balance_sheet_report');
  const reportUrl = 'reports/finance/balance_sheet';
  vm.reportDetails = {};
  vm.previewGenerated = false;
  checkCachedConfiguration();

  vm.onSelectFiscal = function onSelectFiscal(fiscal) {
    vm.reportDetails.fiscal = fiscal;
  };

  vm.onSelectPeriodFrom = function onSelectPeriodFrom(period) {
    vm.reportDetails.periodFrom = period.id;
  };

  vm.onSelectPeriodTo = function onSelectPeriodTo(period) {
    vm.reportDetails.periodTo = period.id;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return; }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);
    SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then((result) => {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
  };

  vm.clearPreview = function clearPreview() {
    vm.previewGenerated = false;
    vm.previewResult = null;
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

  function checkCachedConfiguration() {
    if (cache.reportDetails) {
      vm.reportDetails = angular.copy(cache.reportDetails);
    }
    vm.reportDetails.type = 1;
  }
}
