angular.module('bhima.controllers')
.controller('CashboxController', CashboxController);

CashboxController.$inject = [
  'SessionService', 'ProjectService', 'CashboxService', 'util',
  'NotifyService', '$state',
];

/**
 * Cashbox Controller
 *
 * This controller is responsible for creating new cashboxes for the enterprise.
 * A valid cashbox must have accounts defined for each enterprise currency, for
 * ease of use thought the application.
 */
function CashboxController(Session, Projects, Boxes, util, Notify, $state) {
  var vm = this;

  // bind variables
  vm.state = $state;

  vm.enterprise = Session.enterprise;
  vm.project = Session.project;
  vm.maxLength = util.maxTextLength;

  /* ------------------------------------------------------------------------ */

  // fired on startup
  function startup() {
    // load projects
    Projects.read().then(function (projects) {
      vm.projects = projects;
    }).catch(Notify.handleError);

    // load cashboxes
    Boxes.read().then(function (cashboxes) {
      vm.cashboxes = cashboxes;
    }).catch(Notify.handleError);
  }

  startup();
}
