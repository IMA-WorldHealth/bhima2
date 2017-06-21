/**
 * @module fiscalPeriod
 *
 * @description
 * This controller is responsible for implementing all crud on the
 * fiscal year period trough the `/period` endpoint.
 *
 * @requires db
 * @requires filter
 */



const db = require('../../lib/db');
const FilterParser = require('../../lib/filter');

const PERIOD_0_NUM = 0;
const PERIOD_13_NUM = 13;

exports.list = list;
exports.find = find;

/**
 * @method list
 *
 * @description
 * Returns an array of periods
 */
function list(req, res, next) {
  find(req.query)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    .done();
}

/**
 * @method find
 *
 * @description
 * This function scans the period of fiscal year find all values
 * matching parameters provided in the options parameter.
 *
 * @param {Object} options - a JSON of query parameters
 * @returns {Promise} - the result of the promise query on the database.
 */
function find(options) {
  const sql =
    `
    SELECT 
      p.id, p.fiscal_year_id, p.number, p.start_date, p.end_date, CONCAT(IFNULL(p.start_date, p.number), '/',  IFNULL(p.end_date, p.number)) AS label
    FROM period AS p `;

  const filters = new FilterParser(options, { tableAlias : 'p', autoParseStatements : false });
  filters.equals('fiscal_year_id', 'fiscal_year_id', 'p');
  const exludePeriods = options.excludeExtremityPeriod === 'true';

  if(exludePeriods){
    filters.custom('excludeExtremityPeriod', `p.number NOT IN (${PERIOD_0_NUM}, ${PERIOD_13_NUM})`);
  }  

  // @TODO Support ordering query
  filters.setOrder('ORDER BY p.id DESC');

  // applies filters and limits to define sql, get parameters in correct order
  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();
  return db.exec(query, parameters);
}

