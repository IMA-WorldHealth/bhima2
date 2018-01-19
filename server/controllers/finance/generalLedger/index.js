/**
 * The /general_ledger HTTP API endpoint
 *
 * @module finance/generalLedger/
 *
 * @description This module is responsible for handling VIEWS (different ways of seeing data) operations
 * against the general ledger table.
 *
 * @requires lodash
 * @requires lib/db
 * @requires FilterParser
 */


// module dependencies
const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');

// GET/ CURRENT FISCAL YEAR PERIOD
const Fiscal = require('../fiscal');

// expose to the api
exports.list = list;
exports.listAccounts = listAccounts;
exports.find = find;

// expose to server controllers
exports.getAccountTotalsMatrix = getAccountTotalsMatrix;

/**
 * @function find
 *
 * @description
 * This function filters the general ledger by query parameters passed in via
 * the options object.  If no query parameters are provided, the method will
 * return all items in the general ledger
 */
function find(options) {
  const filters = new FilterParser(options, {
    tableAlias: 'gl',
  });

  const sql = `
    SELECT BUID(gl.uuid) AS uuid, gl.project_id, gl.fiscal_year_id, gl.period_id,
      gl.trans_id, gl.trans_date, BUID(gl.record_uuid) AS record_uuid,
      dm1.text AS hrRecord, gl.description, gl.account_id, gl.debit, gl.credit,
      gl.debit_equiv, gl.credit_equiv, gl.currency_id, c.name AS currencyName,
      BUID(gl.entity_uuid) AS entity_uuid, em.text AS hrEntity,
      BUID(gl.reference_uuid) AS reference_uuid, dm2.text AS hrReference,
      gl.comment, gl.origin_id, gl.user_id, gl.cc_id, gl.pc_id, pro.abbr,
      pro.name AS project_name, per.start_date AS period_start,
      per.end_date AS period_end, a.number AS account_number, a.label AS account_label, u.display_name
    FROM general_ledger gl
      JOIN project pro ON pro.id = gl.project_id
      JOIN period per ON per.id = gl.period_id
      JOIN account a ON a.id = gl.account_id
      JOIN user u ON u.id = gl.user_id
      JOIN currency c ON c.id = gl.currency_id
      LEFT JOIN entity_map em ON em.uuid = gl.entity_uuid
      LEFT JOIN document_map dm1 ON dm1.uuid = gl.record_uuid
      LEFT JOIN document_map dm2 ON dm2.uuid = gl.reference_uuid
  `;

  filters.period('period', 'trans_date');
  filters.dateFrom('custom_period_start', 'trans_date');
  filters.dateTo('custom_period_end', 'trans_date');

  filters.fullText('description');
  filters.fullText('comment');

  filters.equals('user_id');
  filters.equals('account_id');
  filters.equals('project_id');
  filters.equals('trans_id');
  filters.equals('origin_id');

  filters.custom('uuids', ' gl.uuid IN (?)', [options.uuids]);
  filters.custom('amount', '(credit_equiv = ? OR debit_equiv = ?)', [options.amount, options.amount]);

  filters.setOrder('ORDER BY gl.trans_date DESC');

  const query = filters.applyQuery(sql);

  const parameters = filters.parameters();
  return db.exec(query, parameters);
}

/**
 * GET /general_ledger
 * Getting data from the general ledger
 */
function list(req, res, next) {
  find(req.query)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next);
}

/**
 * GET /general_ledger/accounts
 * list accounts and their solds
 */
function listAccounts(req, res, next) {
  const fiscalYearId = req.query.fiscal_year_id;

  Fiscal.getPeriodByFiscal(fiscalYearId)
    .then((rows) => {
      return getAccountTotalsMatrix(rows);
    })
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    .done();
}

/**
 * @function getAccountTotalsMatrix
 *
 * @description
 * This function gets the period totals for all general ledger accounts from
 * the period totals table.
 */
function getAccountTotalsMatrix(periodsId) {
  let sqlCase = '';
  let getBalance = '';
  let headSql = '';
  let signPlus = '';

  if (periodsId) {
    periodsId.forEach((period) => {
      headSql += `, balance${period.number}`;

      signPlus = period.number === 0 ? '' : '+';
      getBalance += `${signPlus} balance${period.number} `;

      sqlCase += `, SUM(
        IF(period_total.period_id = ${period.id}, period_total.debit - period_total.credit, 0)
      ) AS balance${period.number}
      `;
    });
  }

  const sql =
    `SELECT account.number, account.type_id, account.label, p.account_id AS id,
      (${getBalance}) AS balance ${headSql}
      FROM (
        SELECT period_total.account_id ${sqlCase}
          FROM period_total GROUP BY period_total.account_id
      ) AS p
      JOIN account ON account.id = p.account_id
      ORDER BY account.number ASC`;

  return db.exec(sql);
}
