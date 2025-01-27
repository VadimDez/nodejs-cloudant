// Copyright © 2018 IBM Corp. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global describe it before after */
'use strict';

const assert = require('assert');
const Client = require('../../lib/client.js');
const Cloudant = require('../../cloudant.js');
const nock = require('../nock.js');
const uuidv4 = require('uuid/v4'); // random

const ME = process.env.cloudant_username || 'nodejs';
const PASSWORD = process.env.cloudant_password || 'sjedon';
const SERVER = process.env.SERVER_URL || `https://${ME}.cloudant.com`;
const DBNAME = `nodejs-cloudant-${uuidv4()}`;

describe('#db Issue #292', function() {
  before(function(done) {
    var mocks = nock(SERVER)
      .put(`/${DBNAME}`)
      .reply(201, { ok: true });

    var cloudantClient = new Client({ plugins: 'retry' });

    var options = {
      url: `${SERVER}/${DBNAME}`,
      auth: { username: ME, password: PASSWORD },
      method: 'PUT'
    };
    cloudantClient.request(options, function(err, resp) {
      assert.equal(err, null);
      assert.equal(resp.statusCode, 201);
      mocks.done();
      done();
    });
  });

  after(function(done) {
    var mocks = nock(SERVER)
      .delete(`/${DBNAME}`)
      .reply(200, { ok: true });

    var cloudantClient = new Client({ plugins: 'retry' });

    var options = {
      url: `${SERVER}/${DBNAME}`,
      auth: { username: ME, password: PASSWORD },
      method: 'DELETE'
    };
    cloudantClient.request(options, function(err, resp) {
      assert.equal(err, null);
      assert.equal(resp.statusCode, 200);
      mocks.done();
      done();
    });
  });

  it('lists all query indices', function(done) {
    var mocks = nock(SERVER)
      .get(`/${DBNAME}/_index`)
      .reply(200, { total_rows: 1, indexes: [ { name: '_all_docs' } ] });

    var cloudant = Cloudant({ url: SERVER, username: ME, password: PASSWORD });
    var db = cloudant.db.use(DBNAME);

    db.index().then((d) => {
      assert.equal(d.total_rows, 1);
      mocks.done();
      done();
    })
    .catch((err) => { assert.fail(`Unexpected error: ${err}`); });
  });

  it('creates new query index', function(done) {
    var definition = {
      index: { fields: [ 'foo' ] },
      name: 'foo-index',
      type: 'json'
    };

    var mocks = nock(SERVER)
      .post(`/${DBNAME}/_index`, definition)
      .reply(200, { result: 'created' });

    var cloudant = Cloudant({ url: SERVER, username: ME, password: PASSWORD });
    var db = cloudant.db.use(DBNAME);

    db.index(definition).then((d) => {
      assert.equal(d.result, 'created');
      mocks.done();
      done();
    })
    .catch((err) => { assert.fail(`Unexpected error: ${err}`); });
  });
});
