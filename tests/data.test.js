// =====================================================================
// Unit tests — Node ka built-in test runner (koi extra library nahi).
// Chalane ke liye: npm test
// Sirf data.js ke pure functions test hote hain (UI nahi).
// assert.equal = dono barabar hone chahiye; assert.ok = condition true honi chahiye
// =====================================================================
import test from "node:test";
import assert from "node:assert/strict";
import { demoData, isValidData, metrics, removeCustomer } from "../src/data.js";
// Test 1: dashboard numbers sahi calculate hote hain, aur data badalne par numbers bhi badalte hain
test("demo metrics are calculated from records", () => {
  const data = demoData();
  assert.equal(isValidData(data), true);
  assert.deepEqual(metrics(data), {
    customers: 6,
    leads: 8,
    active: 5,
    won: 2,
    revenue: 83000,
  });
  // Ek In Progress lead (₹85,000) ko Won kiya → active 5→4, revenue 83,000→1,68,000
  data.leads[0].stage = "Won";
  assert.equal(metrics(data).active, 4);
  assert.equal(metrics(data).revenue, 168000);
});
// Test 2: customer delete par uske leads/tasks bhi hatte hain, aur original data nahi badalta (immutable)
test("customer deletion cleans linked leads and tasks without mutating input", () => {
  const original = demoData();
  const next = removeCustomer(original, "c1");
  assert.equal(next.customers.length, 5);
  assert.ok(next.leads.every((l) => l.customerId !== "c1"));
  assert.ok(next.tasks.every((t) => t.customerId !== "c1"));
  // Original abhi bhi 6 customers ka hai → function ne input mutate nahi kiya
  assert.equal(original.customers.length, 6);
  assert.equal(isValidData(next), true);
});
// Test 3: kharab data reject; lekin khaali (valid) workspace accept — use demo data se overwrite nahi karte
test("invalid persisted data is rejected and valid empty workspace is accepted", () => {
  assert.equal(isValidData(null), false);
  assert.equal(isValidData({ customers: [], leads: [], tasks: [] }), true);
  const data = demoData();
  data.leads[0].value = -1;
  assert.equal(isValidData(data), false);
  data.leads[0].value = 10;
  data.tasks[0].customerId = "missing";
  assert.equal(isValidData(data), false);
});
// Test 4: do records ki same id ho to data invalid
test("duplicate record identifiers are rejected", () => {
  const data = demoData();
  data.customers.push(data.customers[0]);
  assert.equal(isValidData(data), false);
});
