/**
 * Currency Input Component
 *
 * This is a currency input form based on <input type="number">, with specific
 * validation based on the currency being validated.
 */

function CurrencyInputController() {
  var ctrl = this;

  /** atach empty function if no callback is provided**/
  ctrl.onCurrencyChange = ctrl.onCurrencyChange || angular.noop();  

  function handleCurrencyChange (currency){
    /**the currency input component can update this object, to manage his own view**/
    ctrl.currency = currency; 

    /**the currency input component can not update the currencyId, it is not his responsability**/
    ctrl.onCurrencyChange({currency : currency});    
  }
  
  ctrl.handleCurrencyChange = handleCurrencyChange;
}

angular.module('bhima.components')
.component('bhCurrencyInput', {
  templateUrl : 'partials/templates/bhCurrencyInput.tmpl.html',
  controller: CurrencyInputController,
  bindings : {
    onCurrencyChange : '&', //external method
    currencyId : '<',       // one-way binding
    model : '=',            // two way binding
    maxValue : '<',         // one way binding
    form : '<',             // one-way binding
    validationTrigger : '<' // one-way binding
  }
});
