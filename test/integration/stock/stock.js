/* global expect, agent */
/* jshint expr : true */

const helpers = require('../helpers');
const shared = require('./shared');

describe('(/stock/) The Stock HTTP API', () => {

  // create new stock lots
  it('POST /stock/lots create a new stock lots entry', () => {
    return agent.post('/stock/lots')
      .send(shared.movementFirstLots)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  // create stock movement to patient
  it('POST /stock/lots/movements distribute lots to patients from a depot', () => {
    let docUuid;
    let mvtsByDocument;
    let firstMvt;
    return agent.post('/stock/lots/movements')
      .send(shared.movementOutPatient)
      .then((res) => {
        helpers.api.created(res);
        // get details of the movement
        docUuid = res.body.uuid;
        return agent.get(`/stock/lots/movements?document_uuid=${docUuid}`);
      })
      .then((res) => {
        mvtsByDocument = res.body;
        [firstMvt] = mvtsByDocument;
        return agent.get(`/stock/lots/movements?reference=${firstMvt.documentReference}`);
      })
      .then(res => {
        /**
         * check if the result with document_uuid is the same with
         * the reference
         */
        expect(res.body).to.be.deep.equal(mvtsByDocument);
      })
      .catch(helpers.handler);
  });

  // create stock movement to depot
  it('POST /stock/lots/movements distributes stock lots to a depot', () => agent.post('/stock/lots/movements')
    .send(shared.movementDepot)
    .then((res) => {
      helpers.api.created(res);
    })
    .catch(helpers.handler));

  // list all movement relatives to 'Depot Principal'
  it(
    `GET /stock/lots/movements?depot_uuid=...
    returns movements for Depot Principal (13: 10 IN + 3 OUT)`,
    () => agent.get(`/stock/lots/movements?depot_uuid=${shared.depotPrincipalUuid}`)
      .then((res) => {
        helpers.api.listed(res, shared.depotPrincipalMvt);
      })
      .catch(helpers.handler),
  );

  // list all movement relatives to patient 'PA.TPA.2'
  it(
    `GET /stock/lots/movements?patientReference=PA.TPA.2 returns two movements for patient PA.TPA.2`,
    () => agent.get('/stock/lots/movements')
      .query({ patientReference : 'PA.TPA.2' })
      .then((res) => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler),
  );

  // list all movement relatives to 'Service Administration'
  it(
    `GET /stock/lots/movements?service_uuid=...
    returns movements for Service Uuid (1 OUT)`,
    () => agent.get(`/stock/lots/movements?service_uuid=${shared.serviceAdministrationUuid}`)
      .then((res) => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler),
  );

  // list all stock exit relatives to 'Depot Principal'
  it(
    `GET /stock/lots/movements?is_exit=1&depot_uuid=...
    returns exits for Depot Principal (3 OUT)`,
    () => agent.get(`/stock/lots/movements?is_exit=1&depot_uuid=${shared.depotPrincipalUuid}`)
      .then((res) => {
        helpers.api.listed(res, 6);
      })
      .catch(helpers.handler),
  );

  // (report) render all stock exit
  it(
    `GET /reports/stock/lots?renderer=json
    returns exits for all depots (10 OUT)`,
    () => agent.get(`/reports/stock/lots?renderer=json`)
      .then((res) => {
        expect(res.body.rows.length).to.equal(22);
      })
      .catch(helpers.handler),
  );

  // (report) render all stock exit relatives to 'Depot Principal'
  it(
    `GET /reports/stock/lots?renderer=json
    returns exits for Depot principal(10 OUT)`,
    () => agent.get(`/reports/stock/lots?renderer=json&depot_uuid=${shared.depotPrincipalUuid}`)
      .then((res) => {
        expect(res.body.rows.length).to.equal(20);
      })
      .catch(helpers.handler),
  );

  // list all stock entry relatives to 'Depot Principal'
  it(
    `GET /stock/lots/movements?is_exit=0&depot_uuid=... returns entries for Depot Principal (10 IN)`,
    () => agent.get(`/stock/lots/movements?is_exit=0&depot_uuid=${shared.depotPrincipalUuid}`)
      .then((res) => {
        helpers.api.listed(res, 20);
      })
      .catch(helpers.handler),
  );

  // get initial quantity of QUININE-A in 'Depot Principal'
  it(`GET /stock/lots?lot_uuid=...&depot_uuid=... returns initial
      quantity of QUININE-A in Depot Principal (100pcs)`, () => agent.get('/stock/lots')
    .query({
      lot_uuid : shared.lotQuinineUuid,
      depot_uuid : shared.depotPrincipalUuid,
    })
    .then(res => {
      helpers.api.listed(res, 1);
      const lotQuinine = res.body[0];
      expect(lotQuinine.initial_quantity).to.be.equal(100);
    })
    .catch(helpers.handler));

  // list exit of QUININE-A from 'Depot Principal'
  it(`GET /stock/lots/movements?is_exit=1&lot_uuid=...&depot_uuid=... returns
    exit of QUININE-A from Depot Principal (101pcs)`, () => agent.get('/stock/lots/movements')
    .query({
      is_exit : 1,
      lot_uuid : shared.lotQuinineUuid,
      depot_uuid : shared.depotPrincipalUuid,
    })
    .then((res) => {
      helpers.api.listed(res, 2);
      let totalExit = 1;
      res.body.forEach(row => {
        totalExit += row.quantity;
      });
      expect(totalExit).to.be.equal(101);
    })
    .catch(helpers.handler));

  it(`GET /stock/lots/movements filters on user`, () => agent.get('/stock/lots/movements')
    .query({
      user_id : 1, // super user
    })
    .then(res => {
      helpers.api.listed(res, 28);
    })
    .catch(helpers.handler));

  // returns quantity of QUININE-A in 'Depot Principal'
  it(
    `
    GET /stock/lots/depots?lot_uuid=...&depot_uuid=...
    returns remaining quantity of QUININE-A in Depot Principal (80pcs)`,
    () => agent.get(`/stock/lots/depots?lot_uuid=${shared.lotQuinineUuid}&depot_uuid=${shared.depotPrincipalUuid}`)
      .then((res) => {

        helpers.api.listed(res, 1);
        expect(res.body[0].quantity).to.be.equal(0);
      })
      .catch(helpers.handler),
  );

  it(`GET /stock/inventories/depots filters on expired lots`,
    () => agent.get(`/stock/inventories/depots`)
      .query({ limit : 1000, includeEmptyLot : 0, is_expired : 1 })
      .then(res => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler));

  it(`GET /stock/inventories/depots filters on non-expired lots`,
    () => agent.get(`/stock/inventories/depots`)
      .query({ limit : 1000, includeEmptyLot : 0, is_expired : 0 })
      .then(res => {
        helpers.api.listed(res, 5);
      })
      .catch(helpers.handler));

  it(`GET /stock/inventories/depots Get Inventories in Stock By Depot`, () => agent.get(`/stock/inventories/depots`)
    .query({ depot_uuid : shared.depotPrincipalUuid, limit : 1000, includeEmptyLot : 0 })
    .then((res) => {
      helpers.api.listed(res, 4);

      // This is the test of automatically calculated key values
      /*
        expect(res.body[1].quantity).to.be.equal(155);
        expect(res.body[1].avg_consumption).to.be.equal(10);
        expect(res.body[1].S_SEC).to.be.equal(10);
        expect(res.body[1].S_MIN).to.be.equal(20);
        expect(res.body[1].S_MAX).to.be.equal(20);
        expect(res.body[1].S_MONTH).to.be.equal(15);

        expect(res.body[2].quantity).to.be.equal(180300);
        expect(res.body[2].avg_consumption).to.be.equal(49916.67);
        expect(res.body[2].S_SEC).to.be.equal(49916.67);
        expect(res.body[2].S_MIN).to.be.equal(99833.34);
        expect(res.body[2].S_MAX).to.be.equal(99833.34);
        expect(res.body[2].S_MONTH).to.be.equal(3);
        */

      expect(res.body[1].quantity).to.be.equal(150);
      expect(res.body[1].avg_consumption).to.be.equal(10);
      expect(res.body[1].S_SEC).to.be.equal(10);
      expect(res.body[1].S_MIN).to.be.equal(20);
      expect(res.body[1].S_MAX).to.be.equal(20);
      expect(res.body[1].S_MONTH).to.be.equal(15);

      expect(res.body[2].quantity).to.be.equal(180300);
      expect(res.body[2].avg_consumption).to.be.equal(49916.67);
      expect(res.body[2].S_SEC).to.be.equal(49916.67);
      expect(res.body[2].S_MIN).to.be.equal(99833.34);
      expect(res.body[2].S_MAX).to.be.equal(99833.34);
      expect(res.body[2].S_MONTH).to.be.equal(3);

    })
    .catch(helpers.handler));
});

/*
  // create new stock lots from donation
  it('POST /stock/lots create a new stock lots entry from donation', async () => {
    const result = await agent.post('/stock/lots').send(shared.movementFromDonation);
    const res = await agent.get(`/receipts/stock/${result.body.uuid}?lang=fr&posReceipt=0&renderer=pdf`);
    expect(res.headers['content-type']).to.equal('application/pdf');
    expect(res.type).to.equal('application/pdf');
  });
*/
