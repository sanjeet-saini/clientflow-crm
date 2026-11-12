// =====================================================================
// data.js — app ka "logic" (koi UI nahi). Pure functions: same input → same output.
// Isliye inke unit tests likhna aasaan hai (tests/data.test.js).
// =====================================================================
//
// Sales pipeline ke 5 stages, isi order mein Kanban columns bante hain
export const STAGES = ["New", "Contacted", "In Progress", "Won", "Lost"];
// Number ko Indian rupee format mein: 120000 → "₹1,20,000" (Intl.NumberFormat)
export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
// Aaj ki date "YYYY-MM-DD" format mein (local time). padStart(2,'0') → 5 ko "05" banata hai
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// Unique ID: browser ka crypto.randomUUID(); na ho to time + random se fallback
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
// Pehli baar app kholne par dikhne wala nakli (fictional) data.
// Arrays ko map() karke objects banaye — kam code mein zyada records.
export function demoData() {
  const createdAt = new Date().toISOString();
  const customers = [
    ["Aarav Mehta", "aarav@example.com", "9820012345", "Pixel & Co.", "Active"],
    ["Isha Kapoor", "isha@example.com", "9811123456", "Bloom Studio", "Active"],
    [
      "Rohan Shah",
      "rohan@example.com",
      "9844423456",
      "Northstar Labs",
      "Active",
    ],
    [
      "Ananya Rao",
      "ananya@example.com",
      "9833323456",
      "Sunday Coffee",
      "Active",
    ],
    [
      "Kabir Sethi",
      "kabir@example.com",
      "9855523456",
      "Urban Nest",
      "Inactive",
    ],
    [
      "Meera Nair",
      "meera@example.com",
      "9866623456",
      "Evergreen Wellness",
      "Active",
    ],
  ].map(([name, email, phone, company, status], i) => ({
    id: `c${i + 1}`,
    name,
    email,
    phone,
    company,
    status,
    createdAt,
  }));
  // Har lead ka customerId kisi customer (c1..c6) se juda hai — relation
  const leads = [
    ["Brand website redesign", "c1", "In Progress", 85000],
    ["Online store launch", "c2", "Contacted", 120000],
    ["SaaS landing page", "c3", "New", 45000],
    ["Coffee subscription site", "c4", "Won", 65000],
    ["Property listing platform", "c5", "Lost", 95000],
    ["Wellness booking experience", "c6", "New", 70000],
    ["Monthly website care", "c1", "Won", 18000],
    ["Campaign landing pages", "c2", "In Progress", 35000],
  ].map(([title, customerId, stage, value], i) => ({
    id: `l${i + 1}`,
    title,
    customerId,
    stage,
    value,
    createdAt,
  }));
  // Aakhri task (i === 3) pehle se complete dikhaya
  const tasks = [
    ["Send website proposal", "c2", "High"],
    ["Schedule discovery call", "c3", "Medium"],
    ["Review homepage concepts", "c1", "High"],
    ["Share project handover", "c4", "Low"],
  ].map(([title, customerId, priority], i) => ({
    id: `t${i + 1}`,
    title,
    customerId,
    priority,
    dueDate: today(),
    completed: i === 3,
    createdAt,
  }));
  return { customers, leads, tasks };
}
// localStorage se aaya data bharose layak hai ya nahi, check karo.
// Koi bhi check fail → false → app demo data restore karegi (crash nahi).
export function isValidData(data) {
  if (
    !data ||
    !["customers", "leads", "tasks"].every((k) => Array.isArray(data[k]))
  )
    return false;
  // Har record mein string id aur createdAt hona chahiye
  const basic = (row) =>
    row && typeof row.id === "string" && typeof row.createdAt === "string";
  // Set mein duplicate nahi rehte: Set ka size = array length → saari IDs unique
  const unique = (rows) => new Set(rows.map((r) => r.id)).size === rows.length;
  return (
    ["customers", "leads", "tasks"].every((k) => unique(data[k])) &&
    data.customers.every(
      (c) =>
        basic(c) &&
        ["name", "email", "phone", "company"].every(
          (k) => typeof c[k] === "string",
        ) &&
        ["Active", "Inactive"].includes(c.status),
    ) &&
    // Lead ka customer sach mein exist kare, stage valid ho, value 0 ya zyada
    data.leads.every(
      (l) =>
        basic(l) &&
        typeof l.title === "string" &&
        data.customers.some((c) => c.id === l.customerId) &&
        STAGES.includes(l.stage) &&
        Number.isFinite(l.value) &&
        l.value >= 0,
    ) &&
    // Task: priority valid, date ka format sahi (regex), customer optional par ho to exist kare
    data.tasks.every(
      (t) =>
        basic(t) &&
        typeof t.title === "string" &&
        typeof t.completed === "boolean" &&
        ["Low", "Medium", "High"].includes(t.priority) &&
        /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) &&
        (!t.customerId || data.customers.some((c) => c.id === t.customerId)),
    )
  );
}
// Dashboard ke numbers. Store nahi karte, har baar calculate karte hain.
// active  = jo Won ya Lost nahi hain
// revenue = Won leads ki value ka total (filter → reduce)
export function metrics(data) {
  return {
    customers: data.customers.length,
    leads: data.leads.length,
    active: data.leads.filter((l) => !["Won", "Lost"].includes(l.stage)).length,
    won: data.leads.filter((l) => l.stage === "Won").length,
    revenue: data.leads
      .filter((l) => l.stage === "Won")
      .reduce((sum, l) => sum + l.value, 0),
  };
}
// Cascade delete: customer ke saath uske leads aur tasks bhi hatao,
// warna aise records bach jaate jinka customer hi nahi hai (orphan).
// filter() naya array deta hai — original data badalta nahi (immutable).
export function removeCustomer(data, id) {
  return {
    customers: data.customers.filter((c) => c.id !== id),
    leads: data.leads.filter((l) => l.customerId !== id),
    tasks: data.tasks.filter((t) => t.customerId !== id),
  };
}
