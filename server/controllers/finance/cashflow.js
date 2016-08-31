/**
 * Cashflow Controller
 *
 *
 * This controller is responsible for processing cashflow report.
 *
 * @module finance/cashflow
 *
 * @requires node-uuid
 * @requires moment
 * @requires lib/db
 * @requires lib/util
 * @requires lib/errors/NotFound
 * @requires lib/errors/BadRequest
 * @requires finance/journal/cash
 */

'use strict';

const uuid       = require('node-uuid');
const moment     = require('moment');
const db         = require('../../lib/db');
const util       = require('../../lib/util');
const rm         = require('../../lib/ReportManager');
const NotFound   = require('../../lib/errors/NotFound');
const BadRequest = require('../../lib/errors/BadRequest');

// expose to the API
exports.report = report;
exports.document = document;

/**
 * @function report
 * @desc This function is responsible of generating the cashflow data for the report
 */
function report (req, res, next) {
  let params = req.query;

  processingCashflowReport(params)
  .then(result => {
    res.status(200).json(result);
  })
	.catch(next);
}

/** processingCashflowReport */
function processingCashflowReport(params) {
  let glb = {};

  // get all periods for the the current fiscal year
	return getPeriods(params.dateFrom, params.dateTo)
	.then(function (periods) {
		// get the closing balance (previous fiscal year) for the selected cashbox
    if (!periods.length) {
      throw new BadRequest('Periods not found due to a bad date interval', 'ERRORS.BAD_DATE_INTERVAL');
    }
		glb.periods = periods;
		return closingBalance(params.account_id, glb.periods[0].start_date);
	})
	.then(function (balance) {
		if (!balance.length) { balance[0] = { balance: 0, account_id: params.account_id }; }
		glb.openningBalance = balance[0];
		return queryIncomeExpense(params);
	})
	.then(function (result) {
		return groupingByMonth(glb.periods, result);
	})
	.then(groupingIncomeExpenseByPeriod)
	.then(function (flows) {
		return { openningBalance : glb.openningBalance, flows : flows };
	});
}

/**
 * @function queryIncomeExpense
 * @param {object} params
 * @param {object} dateFrom The stating date to considerate
 * @param {object} dateTo The stop date to considerate
 * @description returns incomes and expenses data in a promise
 */
function queryIncomeExpense (params, dateFrom, dateTo) {
	if (params && dateFrom && dateTo) {
		params.dateFrom = dateFrom;
		params.dateTo = dateTo;
	}
	var requette = `
      SELECT BUID(t.uuid) AS uuid, t.trans_id, t.trans_date, a.number, a.label,
        SUM(t.debit_equiv) AS debit_equiv, SUM(t.credit_equiv) AS credit_equiv,
        t.debit, t.credit, t.currency_id, t.description, t.comment,
        BUID(t.record_uuid) AS record_uuid, t.origin_id, u.display_name,
        x.text AS transactionType
			FROM
      (
  			(
  				SELECT pj.project_id, pj.uuid, pj.record_uuid, pj.trans_date,
            pj.debit_equiv, pj.credit_equiv, pj.debit, pj.credit,
            pj.account_id, pj.entity_uuid, pj.currency_id, pj.trans_id,
            pj.description, pj.comment, pj.origin_id, pj.user_id
  				FROM posting_journal pj
  				WHERE pj.account_id IN (?) AND pj.trans_date >= ? AND pj.trans_date <= ?
  			) UNION (
  				SELECT gl.project_id, gl.uuid, gl.record_uuid, gl.trans_date,
            gl.debit_equiv, gl.credit_equiv, gl.debit, gl.credit,
            gl.account_id, gl.entity_uuid, gl.currency_id, gl.trans_id,
            gl.description, gl.comment, gl.origin_id, gl.user_id
  				FROM general_ledger gl
  				WHERE gl.account_id IN (?) AND gl.trans_date >= ? AND gl.trans_date <= ?
  			)
      ) AS t, account AS a, user as u, transaction_type as x
      WHERE t.account_id = a.id AND t.user_id = u.id AND t.origin_id = x.id
      GROUP BY t.trans_id ;` ;

	return db.exec(requette, [params.account_id, params.dateFrom, params.dateTo, params.account_id, params.dateFrom, params.dateTo]);
}

/**
 * @function groupingIncomeExpenseByPeriod
 * @description This function help to group incomes or expenses by period
 */
function groupingIncomeExpenseByPeriod(periodicFlows) {
	var grouping = [];
	periodicFlows.forEach(function (pf) {
		var incomes, expenses;
		incomes = pf.flows.filter(function (posting) {
			return posting.debit_equiv > 0;
		});
		expenses = pf.flows.filter(function (posting) {
			return posting.credit_equiv > 0;
		});
		grouping.push({ period: pf.period, incomes : incomes, expenses : expenses });
	});
	return grouping;
}

/**
 * @function groupingByMonth
 * @param {array} periods An array which contains all periods for the fiscal year
 * @param {array} flows The result of queryIncomeExpense i.e. all incomes and expense
 * @description This function help to group incomes or expenses by month
 */
function groupingByMonth(periods, flows) {
	var grouping = [];
	periods.forEach(function (p) {
		var data = [];
		flows.forEach(function (f) {
			var trans_date = new Date(f.trans_date);
			var start_date = new Date(p.start_date);
			var end_date = new Date(p.end_date);
			if (trans_date <= end_date && trans_date >= start_date) {
				data.push(f);
			}
		});
		grouping.push({ period: p, flows : data });
	});
	return grouping;
}

/**
 * @function closingBalance
 * @param {number} accountId An account for which we search to know the balance
 * @param {date} periodStart The first period start of a given fiscal year (current fiscal year)
 * @desc This function help us to get the balance at cloture for a set of accounts
 */
function closingBalance(accountId, periodStart) {
	var query = `
      SELECT SUM(debit_equiv - credit_equiv) as balance, account_id
      FROM
      (
        (
          SELECT debit_equiv, credit_equiv, account_id, currency_id
          FROM posting_journal
          WHERE account_id IN (?) AND fiscal_year_id = ?
        ) UNION ALL (
          SELECT debit_equiv, credit_equiv, account_id, currency_id
          FROM general_ledger
          WHERE account_id IN (?) AND fiscal_year_id = ?
        )
      ) as t;`;

    return getFiscalYear(periodStart)
    .then(function (rows) {
    	var fy = rows[0];
    	return db.exec(query, [accountId, fy.previous_fiscal_year_id, accountId, fy.previous_fiscal_year_id]);
    });
}

/**
 * @function getFiscalYear
 * @param {object} date The date in which we want to get the fiscal year
 * @description
 * This function is responsible of returning a correct fiscal year
 * according a date given
 */
function getFiscalYear(date) {
	var query =
		'SELECT fy.id, fy.previous_fiscal_year_id FROM fiscal_year fy ' +
		'JOIN period p ON p.fiscal_year_id = fy.id ' +
		'WHERE ? BETWEEN p.start_date AND p.end_date';
	return db.exec(query, [date]);
}

/**
 * @function getPeriods
 * @param {date} dateFrom A starting date
 * @param {date} dateTo A stop date
 */
function getPeriods(dateFrom, dateTo) {
	var query =
		'SELECT id, number, start_date, end_date ' +
		'FROM period WHERE DATE(start_date) >= DATE(?) AND DATE(end_date) <= DATE(?)';
	return db.exec(query, [dateFrom, dateTo]);
}

/**
 * @function document
 * @description process and render the cashflow report document
 */
function document(req, res, next) {
  let session = {}, params = req.query;

  let pageOptions = {
    orientation: 'landscape',
    lang: params.lang
  };

  processingCashflowReport(params)
  .then(reporting)
  .then(labelization)
  .then(() => {
    return rm.build(req, session, './server/controllers/finance/reports/cashflow.report.handlebars', pageOptions);
  })
  .spread((document, headers) => {
    res.set(headers).send(document);
  })
  .catch(next);

  /**
   * @function reporting
   * @param {array} rows all transactions of the given cashbox
   * @description
   * processing data for the report, the process is as follow :
   * step 1. initialization : initialize all global array and objects
   * step 2. openning balance : process for getting the openning balance
   * step 3. grouping : group incomes and expenses by periods
   * step 4. summarization : get all periodical openning balance
   * step 5. labelization : define unique labels for incomes and expenses,
   * and process all totals needed
   * @todo: Must convert values with enterprise exchange rate
   * @todo: Must use a date utility to format date into 'yyyy-mm-dd'
   */
  function reporting(rows) {
    initialization();

    session.periodicData = rows.flows;
    /** @todo: convert into enterprise currency */
    session.openningBalance = rows.openningBalance.balance;

    session.periodicData.forEach(function (flow) {
      groupingResult(flow.incomes, flow.expenses, moment(flow.period.start_date, 'YYYY-MM-DD'));
    });

    session.periodStartArray = session.periodicData.map(function (flow) {
      return moment(flow.period.start_date, 'YYYY-MM-DD');
    });

    /** openning balance by period */
    session.periodicData.forEach(function (flow) {
      summarization(moment(flow.period.start_date, 'YYYY-MM-DD'));
    });
  }

  /**
   * @function initialization
   * @description initialize global arrays and objects for the cashflow report
   */
  function initialization () {
    session.incomes          = {};
    session.expenses         = {};
    session.summationIncome  = {};
    session.summationExpense = {};
    session.sum_incomes      = {};
    session.sum_expense      = {};
    session.periodicBalance  = {};
    session.periodicOpenningBalance = {};
    session.incomesLabels    = [];
    session.expensesLabels   = [];
    session.totalIncomes     = {};
    session.totalExpenses    = {};
  }

  /**
   * @function summarization
   * @param {object} period An object wich reference a specific period
   * @description process for getting openning balance for each periods
   */
  function summarization (period){
    session.sum_incomes[period] = 0;
    session.sum_expense[period] = 0;

    if(session.summationIncome[period]) {
      session.summationIncome[period].forEach(function (transaction) {
        // if only cashes values must be in only enterprise currency
        /** @todo: convert into enterprise currency */
        session.sum_incomes[period] += transaction.value;
        session.incomesLabels.push(transaction.transfer_type);
      });
    }

    if(session.summationExpense[period]) {
      session.summationExpense[period].forEach(function (transaction) {
        // if only cashes values must be in only enterprise currency
        /** @todo: convert into enterprise currency */
        session.sum_expense[period] += transaction.value;
        session.expensesLabels.push(transaction.transfer_type);
      });
    }

    session.periodicBalance[period] = isFirstPeriod(period) ?
      session.sum_incomes[period] - session.sum_expense[period] :
      session.periodicBalance[previousPeriod(period)] + session.sum_incomes[period] - session.sum_expense[period];

    session.periodicOpenningBalance[period] = isFirstPeriod(period) ?
      session.openningBalance :
      session.periodicBalance[previousPeriod(period)];

  }

  /**
   * @function isFirstPeriod
   * @param {object} period An object wich reference a specific period
   * @description process to know the first period in the fiscal year
   */
  function isFirstPeriod(period) {
    var reference = session.periodStartArray[0];

    var bool = (new Date(reference).getDate() === 1 && new Date(reference).getMonth() === 0) ?
      new Date(period).getDate() === 1 && new Date(period).getMonth() === 0 :
      new Date(period).getDate() === new Date(reference).getDate() &&
      new Date(period).getMonth() === new Date(reference).getMonth() &&
      new Date(period).getYear() === new Date(reference).getYear();

    return bool;
  }

  /**
   * @function previousPeriod
   * @param {object} period An object wich reference a specific period
   * @description process to know the previous period of the given period
   */
  function previousPeriod(period) {
    var currentIndex = session.periodStartArray.indexOf(moment(period, 'YYYY-MM-DD'));
    return (currentIndex !== 0) ? session.periodStartArray[currentIndex - 1] : session.periodStartArray[currentIndex];
  }

  /**
   * @function labelization
   * @description process for getting unique labels for incomes and expenses,
   * and all totals needed
   */
  function labelization () {
    var uniqueIncomes = [], uniqueExpenses = [];
    session.incomesLabels = uniquelize(session.incomesLabels);
    session.expensesLabels = uniquelize(session.expensesLabels);

    /** incomes rows */
    session.periodStartArray.forEach(function (period) {
      session.incomes[period] = {};
      session.incomesLabels.forEach(function (label) {
        session.summationIncome[period].forEach(function (transaction) {
          if (transaction.transfer_type === label) {
            /** @todo: convert into enterprise currency */
            session.incomes[period][label] = transaction.value;
          }
        });
      });
    });

    /** totals incomes rows */
    session.periodStartArray.forEach(function (period) {
      session.totalIncomes[period] = 0;
      session.summationIncome[period].forEach(function (transaction) {
        /** @todo: convert into enterprise currency */
        session.totalIncomes[period] += transaction.value;
      });
    });

    /** expense rows */
    session.periodStartArray.forEach(function (period) {
      session.expenses[period] = {};
      session.expensesLabels.forEach(function (label) {
        session.summationExpense[period].forEach(function (transaction) {
          if (transaction.transfer_type === label) {
            /** @todo: convert into enterprise currency */
            session.expenses[period][label] = transaction.value;
          }
        });
      });
    });

    /** totals expenses rows */
    session.periodStartArray.forEach(function (period) {
      session.totalExpenses[period] = 0;
      session.summationExpense[period].forEach(function (transaction) {
        /** @todo: convert into enterprise currency */
        session.totalExpenses[period] += transaction.value;
      });
    });

  }

  /**
   * @function uniquelize
   * @param {array} array An array in which we want to get only unique values
   * @description return an array which contain only unique values
   */
  function uniquelize (array) {
    var u = {}, a = [];
    for(var i = 0; i < array.length; i++){
      if(u.hasOwnProperty(array[i])) {
         continue;
      }
      a.push(array[i]);
      u[array[i]] = 1;
    }
    return a;
  }

  /**
   * @function groupingResult
   * @param {object} period An object wich reference a specific period
   * @param {array} incomes An array which contain incomes for the period
   * @param {array} expenses An array which contain expenses for the period
   * @description group incomes and expenses by origin_id for each period
   */
  function groupingResult (incomes, expenses, period) {
    var tempIncome  = {},
        tempExpense = {};

    session.summationIncome[period] = [];
    session.summationExpense[period] = [];

    // pick the cashbox account name
    session.accountName = !session.accountName && incomes.length ? incomes[0].label :
      !session.accountName && expenses.lenght ? expenses[0].label : session.accountName;

    // income
    if (incomes) {
      incomes.forEach(function (item, index) {
        tempIncome[item.origin_id] = typeof tempIncome[item.origin_id] !== 'undefined' ? false : true;

        if (tempIncome[item.origin_id] === true) {
          var value = incomes.reduce(function (a, b) {
            return b.origin_id === item.origin_id ? b.debit_equiv + a : a;
          }, 0);
          session.summationIncome[period].push({
            /** @fixme: transfer type must be a nome of transfer type not an id */
            'transfer_type' : item.transactionType,
            'currency_id'   : item.currency_id,
            'value'         : value
          });
        }
      });
    }

    // Expense
    if (expenses) {
      expenses.forEach(function (item, index) {
        tempExpense[item.origin_id] = typeof tempExpense[item.origin_id] !== 'undefined' ? false : true;

        if (tempExpense[item.origin_id] === true) {
          var value = expenses.reduce(function (a, b) {
            return b.origin_id === item.origin_id ? b.credit_equiv + a : a;
          }, 0);
          session.summationExpense[period].push({
            /** @fixme: transfer type must be a nome of transfer type not an id */
            'transfer_type' : item.transactionType,
            'currency_id'   : item.currency_id,
            'value'         : value
          });
        }
      });
    }
  }

}
