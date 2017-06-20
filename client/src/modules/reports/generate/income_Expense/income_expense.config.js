angular.module('bhima.controllers')
  .controller('income_expenseController', IncomeExpenseConfigController);

IncomeExpenseConfigController.$inject = [
  '$sce', 'NotifyService', 'BaseReportService', 'AppCache', 'reportData', '$state',
];

function IncomeExpenseConfigController($sce, Notify, SavedReports, AppCache, reportData, $state) {
  var vm = this;
  var cache = new AppCache('configure_income_expense');
  var reportUrl = 'reports/finance/income_expense';
  vm.reportDetails = {};

  vm.reportTypes = [
    { id: 1, label: 'FORM.LABELS.INCOME_EXPENSE' },
    { id: 2, label: 'FORM.LABELS.INCOME' },
    { id: 3, label: 'FORM.LABELS.EXPENSE' },
  ];

  vm.onSelectFiscalPeriod = function onSelectFiscalPeriod(periods) {
    vm.reportDetails.periods = periods;
  };

  vm.preview = function preview(form) {
    if (form.$invalid) { return; }

    // update cached configuration
    cache.reportDetails = angular.copy(vm.reportDetails);

    return SavedReports.requestPreview(reportUrl, reportData.id, angular.copy(vm.reportDetails))
      .then(function (result) {
        vm.previewGenerated = true;
        vm.previewResult = $sce.trustAsHtml(result);
      })
      .catch(Notify.handleError);
  }; 
}
