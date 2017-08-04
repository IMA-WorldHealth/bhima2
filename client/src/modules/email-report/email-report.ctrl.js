angular.module('bhima.controllers')
.controller('EmailReportController', EmailReportController);

EmailReportController.$inject = [
  '$state', 'EmailReportService',
  'ReportGroupService', 'SessionService', 'util',
  'NotifyService', 'ScrollService', 'bhConstants', 'uiGridConstants', '$uibModal',
];

/**
 * Report group Controller
 *
 * @description
 *this controller interact with the view in order to manage
 * people's profiles (emails and name)
 * The report is automaticly generated by bhima and  will be sent throw those emails
 */

function EmailReportController($state, EmailReportSvc, ReportGroupSvc, Session, util, Notify, ScrollTo, bhConstants, uiGridConstants, $uibModal) {

  var vm = this;
  /*
   emailReport is the object
   that contains : name,email, frequence and report-group code
   in UI form
   */
  vm.emailReport = {};
  vm.selectedEmailReport = { selected : false };
  vm.save = save;
  vm.remove = remove;
  vm.frequencies = [];
  /*
    when saving the profile, the user should select a report group
    in orther to specify what report this email will get
    the bellow array will contains those report
  */
  vm.report_groups = [];

  init();

  /*
   initialise importants values for the UI form
   such as the frequencies and report groups
   that should be loaded from ReportGroupService

   */


  function init() {
    /* loading frequencies*/
    vm.frequencies = EmailReportSvc.frequencies;

    /* If the user has selected a profile, fill name and email field */
    try {
      if ($state.params.data.email) {
        vm.emailReport.email = $state.params.data.email;
        vm.emailReport.name = $state.params.data.name;
      }
    } catch (ex) {
        // exception
    }

    // IF the user want to edit an email report, action->edit
    try {

      if ($state.params.data.selectedEmailReport.id) {
        vm.emailReport = $state.params.data.selectedEmailReport;
        vm.selectedEmailReport = vm.emailReport;
        vm.selectedEmailReport.selected = true;
      }
    } catch (ex) {
      // execption
    }


    // loading report groups
    ReportGroupSvc.read().then(function (reportGroups) {
      vm.report_groups = reportGroups;
    })
      .catch(Notify.handleError);


  }

  vm.getFrequencyLabel = function(key) {

    for (let i = 0; i < vm.frequencies.length; i++) {
      const fq=vm.frequencies[i];
      if (fq.key === key) {
        return fq.label;
      }
    }

  }


  function confirmDeleteProfile() {



  }
  // reset the form state
  function resetForm(RegistrationForm) {

    vm.emailReport = {};
    vm.selectedEmailReport = {};
    vm.selectedEmailReport.selected = false;

    RegistrationForm.$setPristine();
    RegistrationForm.$setUntouched();
    ScrollTo('anchor');
  }


  // inserting a new email for a  reporting in the database
  function save(RegistrationForm) {

    // end propagation for invalid state - this could scroll to an $invalid element on the form
    if (RegistrationForm.$invalid) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    const isCreateReport = vm.selectedEmailReport.selected === false;

    let operation;

    if (isCreateReport) {
      operation = EmailReportSvc.create(vm.emailReport);
    } else {
      operation = EmailReportSvc.update(vm.emailReport);
    }

    operation.then(function (confirmation) {

      if (confirmation) {
        alert('operation successeded');
      }
      // fill the ui grid
      load();
            // reset the form state
      resetForm(RegistrationForm);
    })
    .catch(Notify.handleError);

    }


  // delete a record
  function remove(RegistrationForm) {


    // calling the EmailReportService remove method
    return EmailReportSvc.remove(vm.selectedEmailReport.id)
   .then(function (confirmation) {

      if (confirmation) {
        alert('deleted successfully');
      }
      // fille the ui grid
      load();
      // reset the form state
      resetForm(RegistrationForm) ;

    })
    .catch(Notify.handleError)

  }
  // the ui grid

  vm.loading = false;
  vm.hasError = false;

  // grid columns
  const columns = [
    {
      field: 'name',
      displayName: 'FORM.LABELS.NAME',
      headerCellFilter: 'translate',
      aggregationType: uiGridConstants.aggregationTypes.count,
    },
    {
      field: 'email',
      displayName: 'FORM.LABELS.EMAIL',
      headerCellFilter: 'translate',
    },
    {
      field: 'frequency',
      displayName: 'FORM.LABELS.FREQUENCY',
      headerCellFilter: 'translate',
      cellTemplate: '/modules/email-report/templates/frequency.cell.html',

    },
    {
      field: 'report_group',
      displayName: 'FORM.LABELS.REPORT_GROUP',
      headerCellFilter: 'translate',
    },
    {
      field: 'action',
      displayName: '',
      cellTemplate: '/modules/email-report/templates/email-report-action-cell.html',
      enableFiltering: false,
      enableSorting: false,
      enableColumnMenu: false,
    },

  ];


  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider: vm,
    enableColumnMenus: false,
    columnDefs: columns,
    enableSorting: true,
    showColumnFooter: true,
    fastWatch: true,
    flatEntityAccess: true,
  };


  // fill the grid
  function load() {

    EmailReportSvc.read().then(function (reportGroups) {
      vm.loading = false;
      vm.gridOptions.data = reportGroups;

    })
      .catch(Notify.handleError);
  }

  load();

  return this;

}

