const {
  _, db, ReportManager, STOCK_VALUE_REPORT_TEMPLATE,
} = require('../common');

const Exchange = require('../../../finance/exchange');

/**
 * @method stockInventoryReport
 *
 * @description
 * This method builds the stock value report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/value
 */
function stockValue(req, res, next) {
  reporting(req.query, req.session).then(result => {
    res.set(result.headers).send(result.report);
  }).catch(next);
}

async function reporting(_options, session) {
  const { lang } = _options;
  const data = {};
  const enterpriseId = session.enterprise.id;

  const optionReport = _.extend(_options, {
    filename : 'TREE.STOCK_VALUE',
  });

  const report = new ReportManager(STOCK_VALUE_REPORT_TEMPLATE, session, optionReport);

  const options = (typeof (_options.params) === 'string') ? JSON.parse(_options.params) : _options.params;
  data.dateTo = options.dateTo;
  data.depot = await db.one('SELECT * FROM depot WHERE uuid=?', [db.bid(options.depot_uuid)]);

  // Get inventories movemented
  const sqlGetInventories = `
    SELECT DISTINCT(BUID(mov.inventory_uuid)) AS inventory_uuid, mov.inventory_uuid AS uuid,
      mov.text AS inventory_name, mov.code AS inventory_code, mov.inventory_price
    FROM(
      SELECT inv.uuid AS inventory_uuid, inv.text, inv.code,
        inv.price as inventory_price, sm.date
      FROM stock_movement AS sm
      JOIN lot AS l ON l.uuid = sm.lot_uuid
      JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
      WHERE sm.depot_uuid = ? AND DATE(sm.date) <= DATE(?)
    ) AS mov
    ORDER BY mov.text ASC;
  `;

  /*
   * Here we first search for all the products that have
   * been stored in stock in a warehouse,
   * then we collect all the movements of stocks linked to a warehouse
  */
  const stockValues = await db.exec(sqlGetInventories, [db.bid(options.depot_uuid), options.dateTo]);

  // Compute stock value only for concerned inventories for having updated wac
  const mapRecomputeInventoryStockValue = stockValues.map(inventory => {
    return db.exec('CALL RecomputeInventoryStockValue(?, NULL);', [inventory.uuid]);
  });

  await Promise.all(mapRecomputeInventoryStockValue);

  const sqlGetMovementByDepot = `
    SELECT sm.document_uuid, sm.depot_uuid, sm.lot_uuid, sm.quantity, sm.unit_cost, sm.date, sm.is_exit,
    sm.created_at, BUID(inv.uuid) AS inventory_uuid, inv.text AS inventory_text, map.text AS docRef,
    sv.wac
    FROM stock_movement AS sm
    JOIN lot AS l ON l.uuid = sm.lot_uuid
    JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
    JOIN document_map AS map ON map.uuid = sm.document_uuid
    JOIN stock_value AS sv ON sv.inventory_uuid = inv.uuid
    WHERE sm.depot_uuid = ? AND DATE(sm.date) <= DATE(?)
    ORDER BY inv.text, DATE(sm.date), sm.created_at ASC
  `;

  const allMovements = await db.exec(sqlGetMovementByDepot, [db.bid(options.depot_uuid), options.dateTo]);

  stockValues.forEach(stock => {
    stock.movements = allMovements.filter(movement => (movement.inventory_uuid === stock.inventory_uuid));
  });

  let stockTotalValue = 0;
  let stockTotalSaleValue = 0;
  const exchangeRate = await Exchange.getExchangeRate(enterpriseId, options.currency_id, new Date());
  const rate = exchangeRate.rate || 1;

  // calculate quantity in stock since wac is globally calculated
  stockValues.forEach(stock => {
    let quantityInStock = 0;
    let weightedAverageUnitCost = 0;

    stock.movements.forEach(item => {
      const isExit = item.is_exit ? (-1) : 1;
      quantityInStock += (item.quantity * isExit);
      item.quantityInStock = quantityInStock;
      weightedAverageUnitCost = item.wac;
    });

    stock.inventoryPrice = stock.inventory_price * rate;

    stock.stockQtyPurchased = quantityInStock;
    stock.stockUnitCost = weightedAverageUnitCost;
    stock.stockValue = (quantityInStock * weightedAverageUnitCost);
    stock.saleValue = (quantityInStock * stock.inventoryPrice);

    // warn the user if the stock sales price is equivalent or _lower_ than the value of the stock
    // the enterprise will not make money on this stock.
    stock.hasWarning = stock.inventoryPrice <= weightedAverageUnitCost;

    stockTotalValue += stock.stockValue;
    stockTotalSaleValue += stock.saleValue;
  });

  const stockValueElements = options.exclude_zero_value
    ? stockValues.filter(item => item.stockValue > 0) : stockValues;

  data.stockValues = stockValueElements || [];

  data.stockTotalValue = stockTotalValue;
  data.stockTotalSaleValue = stockTotalSaleValue;
  data.emptyResult = data.stockValues.length === 0;

  data.exclude_zero_value = options.exclude_zero_value;

  data.currency_id = options.currency_id;
  data.isEnterpriseCurrency = Number(options.currency_id) === session.enterprise.currency_id;
  data.exchangeRateMsg = await Exchange.exchangeRateMsg(data.currency_id,
    rate, session.enterprise, lang);

  return report.render(data);
}

module.exports.document = stockValue;
module.exports.reporting = reporting;
