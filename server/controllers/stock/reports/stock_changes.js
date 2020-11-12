const {
  _, ReportManager, Stock, db,
} = require('./common');

const Periods = require('../../finance/period');

const DEFAULT_PARAMS = {
  csvKey : 'rows',
  filename : 'REPORTS.STOCK_CHANGES.TITLE',
  orientation : 'landscape',
};

const STOCK_CHANGES_REPORT_TEMPLATE = './server/controllers/stock/reports/stock_changes.handlebars';

/**
 * @function generate
 *
 * @description
 * Generates the stock changes report.
 *
 */
async function generate(req, res, next) {

  try {
    const options = _.extend(req.query, DEFAULT_PARAMS);

    const report = new ReportManager(STOCK_CHANGES_REPORT_TEMPLATE, req.session, options);

    // get query the period dates and the depot for the name
    const [period, depot] = await Promise.all([
      Periods.lookupPeriodById(options.period_id),
      db.one('SELECT * FROM depot WHERE uuid = ?', db.bid(options.depot_uuid)),
    ]);

    // get the stock in the depot as of the end of the period
    const lots = await Stock.getLotsDepot(depot.uuid, { dateTo : period.end_date });
    const data = _.groupBy(lots, 'text');

    const result = await report.render({ data, depot, period });
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);
  }
}

module.exports = generate;
