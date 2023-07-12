/**
 * Component Test Wrappers
 *
 * This module exposes individual test wrappers for components created in bhima.
 * The idea is to prevent collisions when updating or working on individual
 * component's tests suites.
 *
 * @module e2e/components
 * @public
 */

/* eslint-disable global-require */

module.exports = {
  accountConfigSelect : require('./bhAccountConfigSelect'),
  accountReferenceSelect : require('./bhAccountReferenceSelect'),
  accountReferenceTypeSelect : require('./bhAccountReferenceTypeSelect'),
  accountSelect : require('./bhAccountSelect'),
  // addItem : require('./bhAddItem'),
  analysisToolTypeSelect : require('./bhAnalysisToolTypeSelect'),
  bhCheckboxTree : require('./bhCheckboxTree'),
  // bhMultipleDepotSearchSelect : require('./bhMultipleDepotSearchSelect'),
  // cashboxSelect : require('./bhCashBoxSelect'),
  choiceListSelect : require('./bhChoiceListSelect'),
  // cronSelect : require('./bhCronSelect'),
  currencyInput : require('./bhCurrencyInput'),
  currencySelect : require('./bhCurrencySelect'),
  // dataCollector : require('./bhDataCollector'),
  dateEditor : require('./bhDateEditor'),
  dateInterval : require('./bhDateInterval'),
  // datePicker : require('./bhDatePicker'),
  debtorGroupSelect : require('./bhDebtorGroupSelect'),
  depotSelect : require('./bhDepotSelect'),
  diagnosisSelect : require('./bhDiagnosisSelect'),
  employeeConfigSelect : require('./bhEmployeeConfigSelect'),
  employeeSelect : require('./bhEmployeeSelect'),
  // entityGroupSelect : require('./bhEntityGroupSelect'),
  entitySelect : require('./bhEntitySelect'),
  entityTypeSelect : require('./bhEntityTypeSelect'),
  // findInvoice : require('./bhFindInvoice'),
  findPatient : require('./bhFindPatient'),
  // fiscalPeriodSelect : require('./bhFiscalPeriodSelect'),
  fiscalYearPeriodSelect : require('./bhFiscalYearPeriodSelect'),
  fiscalYearSelect : require('./bhFiscalYearSelect'),
  fluxSelect : require('./bhFluxSelect'),
  functionSelect : require('./bhFunctionSelect'),
  genderSelect : require('./bhGenderSelect'),
  gradeSelect : require('./bhGradeSelect'),
  inputText : require('./bhInputText'),
  inventoryGroupSelect : require('./bhInventoryGroupSelect'),
  inventorySelect : require('./bhInventorySelect'),
  inventoryTypeSelect : require('./bhInventoryTypeSelect'),
  iprConfigSelect : require('./bhIprConfigSelect'),
  iprScale : require('./bhIprScale'),
  locationSelect : require('./bhLocationSelect'),
  modalAction : require('./bhModalAction'),
  // multipleCashBoxSelect : require('./bhMultipleCashBoxSelect'),
  notification : require('./notify'),
  patientGroupSelect : require('./bhPatientGroupSelect'),
  payrollPeriodSelect : require('./bhPayrollPeriodSelect'),
  payrollStatusSelect : require('./bhPayrollStatusSelect'),
  // percentageInput : require('./bhPercentageInput'),
  periodSelect : require('./bhPeriodSelect'),
  // projectSelect : require('./bhProjectSelect'),
  // purchaseStatusSelect : require('./bhPurchaseStatusSelect'),
  // reportPeriodSelect : require('./bhReportPeriodSelect'),
  // reportSource : require('./bhReportSource'),
  // requisitionSelect : require('./bhRequisitionSelect'),
  // roomSelect : require('./bhRoomSelect'),
  rubricConfigSelect : require('./bhRubricConfigSelect'),
  serviceOrDepotSelect : require('./bhServiceOrDepot'),
  serviceSelect : require('./bhServiceSelect'),
  // servicesMultipleSelect : require('./bhServicesMultipleSelect'),
  // stockEntryExitType : require('./bhStockEntryExitType'),
  supplierSelect : require('./bhSupplierSelect'),
  surveyFormSelect : require('./bhSurveyFormSelect'),
  // surveyFormTypeSelect : require('./bhSurveyFormTypeSelect'),
  // surveyListSelect : require('./bhSurveyListSelect'),
  tagSelect : require('./bhTagSelect'),
  transactionTypeSelect : require('./bhTransactionTypeSelect'),
  userSelect : require('./bhUserSelect'),
  // wardSelect : require('./bhWardSelect'),
  weekConfigSelect : require('./bhWeekConfigSelect'),
  // yesNoRadios : require('./bhYesNoRadios'),
};
