angular.module('bhima.controllers')
.controller('ModalCreditNoteController', ModalCreditNoteController);

ModalCreditNoteController.$inject = [
  '$uibModalInstance', 'PatientInvoiceService', 'util', 'data', 'VoucherService'
];

function ModalCreditNoteController( $uibModalInstance, Invoices, Util, data, Vouchers) {
  var vm = this;
  vm.patientInvoice = data.invoice; 
  vm.submit = submit;
  vm.cancel = cancel;
  vm.creditNote;

  // transfer type
  vm.transferType = Vouchers.transferType;

  var typeId = vm.transferType.filter(function (item) {
    return item.incomeExpense === 'creditNote';
  });

  var transferTypeId = typeId[0].id;


  Invoices.read(vm.patientInvoice.uuid)    
    .then(function (data){
      vm.patientInvoiceItems = data.items;
    });

  function submit(uuid, creditNote) {
    creditNote.type_id = transferTypeId;
    
    if (!uuid || !creditNote) { return; }
    var journal = Vouchers.reverse(uuid, creditNote);
    
    journal
      .then(function (response) {
        var data = {
          response : response
        };
        return $uibModalInstance.close(data);
      });
  }

  function cancel() {
    $uibModalInstance.dismiss();
  }
}
