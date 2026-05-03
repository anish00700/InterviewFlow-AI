'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// Stub mongoose model so no DB connection is needed
const mongoose = require('mongoose');
mongoose.model = (name) => ({
  findById: () => ({ select: () => Promise.resolve(null) }),
});

const { protect } = require('../middleware/auth.middleware');

function mockRes() {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

test('protect — rejects request with no Authorization header', async () => {
  const req = { headers: {} };
  const res = mockRes();
  await protect(req, res, () => { throw new Error('next() should not be called'); });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Not authorized, no token');
});

test('protect — rejects request with malformed token', async () => {
  const req = { headers: { authorization: 'Bearer not-a-real-jwt' } };
  const res = mockRes();
  await protect(req, res, () => { throw new Error('next() should not be called'); });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Not authorized, token invalid');
});
