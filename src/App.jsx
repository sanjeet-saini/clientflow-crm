// =====================================================================
// App.jsx — poori app ka UI yahin hai.
// Is file mein kya hai (upar se neeche):
//   1. Chhote helper components: Badge, Empty, Modal, RecordForm
//   2. App()       → main component: data rakhta hai + CRUD functions (save/remove/update)
//   3. Pages       → Dashboard, Customers, Leads, Tasks
// Data flow: App ke paas state hai → pages ko props se data aur functions milte hain
// → page koi function call karta hai → App state badalta hai → React screen dobara banata hai.
// =====================================================================
//
// React hooks: useState (data yaad rakhna), useEffect (side effect chalana), useRef (DOM element pakadna)
import { useEffect, useRef, useState } from "react";
// React Router: pages ke beech navigation (bina page reload ke)
import { NavLink, Route, Routes, useLocation, Link } from "react-router-dom";
// lucide-react: ready-made SVG icons, har icon ek React component hai
import {
  ArrowUpRight,
  ArrowRight,
  Users,
  LayoutDashboard,
  Columns3,
  CheckCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RotateCcw,
  Leaf,
  CalendarDays,
  CircleCheck,
  BriefcaseBusiness,
} from "lucide-react";
// Hamara custom hook: data load + localStorage mein save karta hai
import { useCRM } from "./useCRM";
// data.js se pure functions (UI se alag logic)
import {
  STAGES,
  demoData,
  metrics,
  money,
  removeCustomer,
  today,
  uid,
} from "./data";

// Naam se initials banana: "Aarav Mehta" → "AM" (avatar circle ke liye)
const initials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
// "In Progress" → "in-progress": CSS class ke naam mein space nahi chal sakta
const stageClass = (stage) => stage.toLowerCase().replaceAll(" ", "-");
// Badge: chhota rangeen label (stage/status/priority). Rang CSS class se aata hai.
function Badge({ children }) {
  return (
    <span className={`badge ${stageClass(String(children))}`}>{children}</span>
  );
}
// Empty: jab list khaali ho tab dikhne wala message. onAdd diya ho to 'Add new' button bhi.
function Empty({ text = "No records yet.", onAdd }) {
  return (
    <div className="empty">
      <Users size={30} />
      <h3>{text}</h3>
      <p>Try a different filter or add your first record.</p>
      {onAdd && (
        <button onClick={onAdd} className="primary">
          <Plus size={16} /> Add new
        </button>
      )}
    </div>
  );
}

// Modal: popup dialog. Browser ka native <dialog> use kiya hai, jisse
// Escape se band hona aur focus andar hi rehna (focus trap) apne aap milta hai.
// children = jo bhi andar rakhna ho (form ya confirm message).
function Modal({ title, children, onClose }) {
  // ref se asli <dialog> DOM element milta hai, taaki uska showModal() call kar sakein
  const ref = useRef(null);
  useEffect(() => {
    // Dialog khulne se pehle kis button par focus tha, woh yaad rakho
    const previous = document.activeElement;
    const dialog = ref.current;
    // Agar pehle se open nahi hai tabhi kholo. Development mein React StrictMode
    // effect ko do baar chalata hai — yeh check dobara kholne ki galti se bachata hai.
    if (!dialog.open) dialog.showModal();
    // Cleanup: dialog band (unmount) hone par focus wapas usi button par (accessibility)
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      // onCancel = Escape key dabane par
      onCancel={onClose}
      // Dialog ke bahar (dark backdrop) click karne par band
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

// RecordForm: EK hi form teeno ke liye — customer, lead aur task.
// kind   = "customers" | "leads" | "tasks" (kaunsa form dikhana hai)
// record = edit ke time purana record; add ke time undefined
// Inputs "controlled" hain: value state se aati hai, onChange state update karta hai.
function RecordForm({ kind, record, customers, onSave, onClose }) {
  // Shuruaati values: edit ho to purana record, warna kind ke hisaab se khaali form
  const [values, setValues] = useState(
    record ||
      (kind === "customers"
        ? { name: "", email: "", phone: "", company: "", status: "Active" }
        : kind === "leads"
          ? {
              title: "",
              customerId: customers[0]?.id || "",
              stage: "New",
              value: "",
            }
          : {
              title: "",
              customerId: "",
              dueDate: today(),
              priority: "Medium",
              completed: false,
            }),
  );
  // Validation ka error message (khaali = koi error nahi)
  const [error, setError] = useState("");
  // Helper: ek label + input banata hai. Baar-baar same JSX likhne se bachaata hai.
  // [name]: e.target.value → sirf wahi field badlo, baaki values copy (spread ...values)
  const field = (name, label, type = "text", required = false) => (
    <label>
      {label}
      <input
        name={name}
        type={type}
        value={values[name]}
        required={required}
        maxLength={type === "text" ? 120 : undefined}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
      />
    </label>
  );
  // Helper: dropdown. options string ho sakte hain ya {id, name} objects (customers)
  const select = (name, label, options) => (
    <label>
      {label}
      <select
        value={values[name]}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
      >
        {options.map((o) => (
          <option
            key={typeof o === "string" ? o : o.id}
            value={typeof o === "string" ? o : o.id}
          >
            {typeof o === "string" ? o : o.name}
          </option>
        ))}
      </select>
    </label>
  );
  // Form submit hone par: pehle validation, sab sahi ho to onSave()
  function submit(e) {
    // Browser ka default (page reload) rokna
    e.preventDefault();
    // Har text value ke aage-peeche ke spaces hatao (trim)
    const clean = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() : v,
      ]),
    );
    // Rule 1: naam/title sirf spaces nahi ho sakta
    if (!(kind === "customers" ? clean.name : clean.title))
      return setError("Please enter a name or title, not just spaces.");
    // Rule 2: phone diya ho to 7–20 characters, sirf digits + space ( ) - (regex se check)
    if (
      kind === "customers" &&
      clean.phone &&
      !/^[+\d\s()-]{7,20}$/.test(clean.phone)
    )
      return setError(
        "Enter a valid phone number (7–20 characters: digits, +, spaces, brackets or hyphens).",
      );
    // Rule 3: lead ke liye customer hona zaroori + deal value number aur 0 ya zyada
    if (kind === "leads") {
      if (!customers.some((c) => c.id === clean.customerId))
        return setError("Add a customer before creating a lead.");
      clean.value = Number(clean.value);
      if (!Number.isFinite(clean.value) || clean.value < 0)
        return setError("Enter a valid non-negative deal value.");
    }
    // Sab theek → record save karo. Edit mein purana id/createdAt rakho,
    // naye record ke liye naya unique id (uid) aur abhi ka time
    onSave({
      ...clean,
      id: record?.id || uid(),
      createdAt: record?.createdAt || new Date().toISOString(),
    });
  }
  return (
    <Modal
      // "customers".slice(0,-1) = "customer" (aakhri 's' hata kar title banaya)
      title={`${record ? "Edit" : "Add"} ${kind.slice(0, -1)}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <p className="form-help">
          Keep the details up to date. Every relationship starts here.
        </p>
        {kind === "customers" ? (
          <>
            <div className="form-grid">
              {field("name", "Full name", "text", true)}
              {field("email", "Email address", "email", true)}
              {field("phone", "Phone number")}
              {field("company", "Company")}
            </div>
            {select("status", "Customer status", ["Active", "Inactive"])}
          </>
        ) : (
          <>
            {field(
              "title",
              kind === "leads" ? "Opportunity title" : "Task title",
              "text",
              true,
            )}
            {select(
              "customerId",
              kind === "leads" ? "Customer" : "Customer (optional)",
              [
                ...(kind === "tasks"
                  ? [{ id: "", name: "No linked customer" }]
                  : []),
                ...customers,
              ],
            )}
            <div className="form-grid">
              {kind === "leads" ? (
                <>
                  {field("value", "Deal value (INR)", "number", true)}
                  {select("stage", "Stage", STAGES)}
                </>
              ) : (
                <>
                  {field("dueDate", "Due date", "date", true)}
                  {select("priority", "Priority", ["Low", "Medium", "High"])}
                </>
              )}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" type="submit">
            {record ? "Save changes" : "Create " + kind.slice(0, -1)}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// =====================================================================
// App: main component. Saara CRM data yahi rakhta hai (single source of truth).
// =====================================================================
export default function App() {
  // data = {customers, leads, tasks}; setData se badlo; storageError = save fail hone ka message
  const { data, setData, storageError } = useCRM();
  // UI state:
  // form    = kaunsa form khula hai ({kind, record}) ya null
  // confirm = delete/reset confirmation popup ka data ya null
  // toast   = neeche dikhne wala chhota success message
  const [form, setForm] = useState(null),
    [confirm, setConfirm] = useState(null),
    [toast, setToast] = useState("");
  const location = useLocation();
  // URL se current page ka naam (top bar ke breadcrumb ke liye)
  const page = location.pathname.split("/")[1] || "overview";
  // Toast 4 second baad apne aap gayab. Cleanup timer clear karta hai taaki purana timer na chale.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = (text) => setToast(text);
  // Add button → khaali form kholo
  const add = (kind) => setForm({ kind });
  // CREATE / UPDATE
  // setData(prev => ...) : hamesha latest state se naya state banao.
  // Edit:  map() se same id wala record replace
  // Naya:  [record, ...purani list] → naya record sabse upar
  // Purana array badalte nahi, naya banate hain (immutable update) — tabhi React ko change pata chalta hai.
  function save(record) {
    setData((prev) => ({
      ...prev,
      [form.kind]: form.record
        ? prev[form.kind].map((r) => (r.id === record.id ? record : r))
        : [record, ...prev[form.kind]],
    }));
    notify(
      `${form.kind.slice(0, -1)} ${form.record ? "updated" : "created"} successfully`,
    );
    setForm(null);
  }
  // DELETE: seedha delete nahi, pehle confirm popup.
  // Customer ho to gino uske kitne leads/tasks bhi saath mein delete honge (user ko batane ke liye).
  function remove(kind, record) {
    const linked =
      kind === "customers"
        ? data.leads.filter((l) => l.customerId === record.id).length +
          data.tasks.filter((t) => t.customerId === record.id).length
        : 0;
    setConfirm({
      title: "Delete " + kind.slice(0, -1) + "?",
      text: `“${record.name || record.title}” will be permanently removed.${linked ? ` This also deletes ${linked} linked lead/task record(s).` : ""}`,
      // Yeh function tabhi chalega jab user 'Confirm' dabayega
      action: () => {
        // Customer → cascade delete (data.js). Baaki → filter() se bas woh ek record hatao.
        setData((prev) =>
          kind === "customers"
            ? removeCustomer(prev, record.id)
            : { ...prev, [kind]: prev[kind].filter((r) => r.id !== record.id) },
        );
        notify("Record deleted");
      },
    });
  }
  // Chhota UPDATE: ek-do field badalna (jaise lead ka stage, task complete).
  // { ...r, ...changes } = purana record copy + naye changes upar likh do
  const update = (kind, id, changes) => {
    setData((prev) => ({
      ...prev,
      [kind]: prev[kind].map((r) => (r.id === id ? { ...r, ...changes } : r)),
    }));
    notify("Changes saved");
  };
  // Customer id se naam dhoondo; na mile to "Unassigned". ?. = optional chaining (undefined par crash nahi)
  const customerName = (id) =>
    data.customers.find((c) => c.id === id)?.name || "Unassigned";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Leaf size={22} />
          </span>
          clientflow<span className="brand-dot">.</span>
        </Link>
        <div className="workspace">
          <span className="workspace-logo">S</span>
          <div>
            Studio workspace<small>Personal workspace</small>
          </div>
          <span className="workspace-mark">⌘</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {/* Sidebar links ek array se map() karke banaye. NavLink active page par 'active' class lagata hai. */}
          {[
            ["/", "Overview", LayoutDashboard],
            ["/customers", "Customers", Users],
            ["/leads", "Sales pipeline", Columns3],
            ["/tasks", "Tasks & follow-ups", CheckCheck],
          ].map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon size={19} />
              {label}
              {to === "/tasks" && (
                <span className="nav-count">
                  {data.tasks.filter((t) => !t.completed).length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note">
            <span className="live-dot" /> YOUR DEMO WORKSPACE
            <p>
              A little more organized.
              <br />A lot more connected.
            </p>
            <small>Fictional data · Saved in this browser</small>
          </div>
          <button
            className="reset"
            onClick={() =>
              setConfirm({
                title: "Reset demo workspace?",
                text: "All changes in this browser will be replaced with the original fictional demo records.",
                action: () => {
                  setData(demoData());
                  notify("Demo workspace reset");
                },
              })
            }
          >
            <RotateCcw size={16} /> Reset demo data
          </button>
          <div className="profile">
            <span className="avatar">SS</span>
            <div>
              Sanjeet Saini<small>Workspace owner</small>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div>
            Workspace <span>/</span>{" "}
            <strong>
              {page === "overview"
                ? "Overview"
                : page === "leads"
                  ? "Sales pipeline"
                  : page === "tasks"
                    ? "Tasks & follow-ups"
                    : "Customers"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="saved">
              <span className="live-dot" /> Browser workspace
            </span>
            <span className="avatar small">SS</span>
          </div>
        </header>
        <main>
          {storageError && (
            <div role="alert" className="storage-alert">
              {storageError}
            </div>
          )}
          {/* Routes: URL ke hisaab se kaunsa page dikhe. Har page ko zaroorat ka data + functions PROPS mein milte hain.
             path="*" = koi bhi galat URL → 404 message */}
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  data={data}
                  add={add}
                  customerName={customerName}
                  update={update}
                />
              }
            />
            <Route
              path="/customers"
              element={
                <Customers
                  data={data}
                  add={add}
                  edit={(record) => setForm({ kind: "customers", record })}
                  remove={remove}
                />
              }
            />
            <Route
              path="/leads"
              element={
                <Leads
                  data={data}
                  add={add}
                  edit={(record) => setForm({ kind: "leads", record })}
                  remove={remove}
                  update={update}
                  customerName={customerName}
                />
              }
            />
            <Route
              path="/tasks"
              element={
                <Tasks
                  data={data}
                  add={add}
                  edit={(record) => setForm({ kind: "tasks", record })}
                  remove={remove}
                  update={update}
                  customerName={customerName}
                />
              }
            />
            <Route
              path="*"
              element={<Empty text="This page doesn't exist." />}
            />
          </Routes>
          <footer>
            Made for better relationships.
            <span>ClientFlow CRM · Frontend demo</span>
          </footer>
        </main>
      </div>
      {/* form state set ho tabhi form dikhana (conditional rendering: condition && <JSX/>) */}
      {form && (
        <RecordForm
          {...form}
          customers={data.customers}
          onSave={save}
          onClose={() => setForm(null)}
        />
      )}
      {/* Confirm popup: Confirm dabane par pehle se rakha action() chalao, phir popup band */}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="confirm-copy">{confirm.text}</p>
          <div className="modal-actions">
            <button onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className="danger"
              onClick={() => {
                confirm.action();
                setConfirm(null);
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
      {/* role="status" se screen reader bhi message padh leta hai */}
      {toast && (
        <div role="status" className="toast">
          <CircleCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

// PageHeading: har page ka title block. children = right side ke buttons.
function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
// =====================================================================
// DASHBOARD (Overview page)
// Saare numbers yahin data se CALCULATE hote hain — alag se store nahi kiye.
// Isliye data badalte hi numbers apne aap sahi ho jaate hain (derived state).
// =====================================================================
function Dashboard({ data, add, customerName, update }) {
  // m = {customers, leads, active, won, revenue} (data.js ka metrics())
  const m = metrics(data);
  // Adhoore tasks, jo pehle due hai woh upar (localeCompare se date string compare)
  const pending = data.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  // Active pipeline ki total value: Won/Lost chhod kar baaki leads ka reduce() se sum
  const activeValue = data.leads
    .filter((l) => !["Won", "Lost"].includes(l.stage))
    .reduce((s, l) => s + l.value, 0);
  return (
    <>
      <PageHeading
        eyebrow="YOUR BUSINESS, AT A GLANCE"
        title="A good day to grow."
        description="Here’s what’s happening with your customer relationships."
      >
        <button onClick={() => add("leads")}>
          <Plus size={17} /> Add lead
        </button>
        <button className="primary" onClick={() => add("customers")}>
          <Plus size={17} /> Add customer
        </button>
      </PageHeading>
      <section className="welcome-banner">
        <div>
          <span className="banner-tag">
            <span className="live-dot" /> KEEP THE MOMENTUM GOING
          </span>
          <h2>
            Great relationships.
            <br />
            Better business.
          </h2>
          <p>
            You have <strong>{m.active} active opportunities</strong> and{" "}
            <strong>{pending.length} follow-ups</strong>.<br />
            Your next big win starts with a small conversation.
          </p>
          <Link to="/leads">
            Explore your pipeline <ArrowRight size={17} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-card card-a">
            <span className="art-icon">
              <Users size={22} />
            </span>
            <span>
              Relationships
              <br />
              <strong>Built to last.</strong>
            </span>
            <span className="art-tick">✓</span>
          </div>
          <div className="art-card card-b">
            <span className="art-icon">
              <ArrowUpRight size={25} />
            </span>
            <span>
              One step closer
              <br />
              <strong>to your next win.</strong>
            </span>
          </div>
          <div className="art-spark">✳</div>
        </div>
      </section>
      <section className="stats">
        {[
          ["Total customers", m.customers, Users, "Your growing network"],
          [
            "Total leads",
            m.leads,
            BriefcaseBusiness,
            "Every opportunity, in one place",
          ],
          ["Active deals", m.active, Columns3, "Conversations in progress"],
          [
            "Won deals",
            m.won,
            CheckCheck,
            `${money(m.revenue)} in closed value`,
          ],
        ].map(([label, value, Icon, note]) => (
          <article className="stat-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{value.toString().padStart(2, "0")}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="panel pipeline-panel">
          <div className="panel-head">
            <div>
              <h2>Pipeline snapshot</h2>
              <p>A clear view of your next opportunities</p>
            </div>
            <Link to="/leads" aria-label="View sales pipeline">
              <ArrowUpRight size={21} />
            </Link>
          </div>
          <div className="pipeline-value">
            <strong>{money(activeValue)}</strong>
            <span>in active pipeline</span>
          </div>
          <div className="segmented-bar">
            {STAGES.map((stage) => (
              <span
                key={stage}
                className={stageClass(stage)}
                style={{
                  flex:
                    data.leads.filter((l) => l.stage === stage).length || 0.001,
                }}
              />
            ))}
          </div>
          <div className="stage-legend">
            {STAGES.map((stage) => (
              <div key={stage}>
                <span className={`legend-dot ${stageClass(stage)}`} />
                <span>{stage}</span>
                <strong>
                  {data.leads.filter((l) => l.stage === stage).length}
                </strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>
                On your to-do list{" "}
                <span className="count">{pending.length}</span>
              </h2>
              <p>Small actions that move things forward</p>
            </div>
            <Link to="/tasks">
              <ArrowUpRight size={21} />
            </Link>
          </div>
          <div className="mini-tasks">
            {pending.slice(0, 3).map((t) => (
              <div className="mini-task" key={t.id}>
                <input
                  type="checkbox"
                  aria-label={`Complete ${t.title}`}
                  checked={false}
                  onChange={() => update("tasks", t.id, { completed: true })}
                />
                <div>
                  <strong>{t.title}</strong>
                  <small>
                    {customerName(t.customerId)} ·{" "}
                    {t.dueDate === today() ? "Today" : t.dueDate}
                  </small>
                </div>
                <span
                  className={`priority-dot ${t.priority.toLowerCase()}`}
                  title={`${t.priority} priority`}
                />
              </div>
            ))}
            {!pending.length && (
              <p className="caught-up">
                All caught up. Room for your next big idea.
              </p>
            )}
          </div>
          <Link className="panel-bottom" to="/tasks">
            View all tasks <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-head">
          <div>
            <h2>Recent opportunities</h2>
            <p>Your latest conversations, all in one place</p>
          </div>
          <Link className="text-link" to="/leads">
            View pipeline <ArrowRight size={15} />
          </Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>OPPORTUNITY</th>
                <th>CUSTOMER</th>
                <th>VALUE</th>
                <th>STAGE</th>
              </tr>
            </thead>
            <tbody>
              {[...data.leads]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, 4)
                .map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.title}</strong>
                    </td>
                    <td>{customerName(l.customerId)}</td>
                    <td className="value-cell">{money(l.value)}</td>
                    <td>
                      <Badge>{l.stage}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!data.leads.length && <Empty onAdd={() => add("leads")} />}
        </div>
      </section>
    </>
  );
}
// =====================================================================
// CUSTOMERS page: table + search + status filter + sort
// =====================================================================
function Customers({ data, add, edit, remove }) {
  // Yeh filters sirf is page ke hain, isliye state yahin (local state), App mein nahi
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("All"),
    [sort, setSort] = useState("Newest");
  // Dikhne wali rows = data se calculate:
  // 1) filter: status match + naam/email/company mein search text ho (case-insensitive: toLowerCase)
  // 2) sort: A–Z ho to naam se, warna newest pehle
  const rows = data.customers
    .filter(
      (c) =>
        (status === "All" || c.status === status) &&
        [c.name, c.email, c.company].some((v) =>
          v.toLowerCase().includes(search.trim().toLowerCase()),
        ),
    )
    .sort((a, b) =>
      sort === "A–Z"
        ? a.name.localeCompare(b.name)
        : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <>
      <PageHeading
        eyebrow="PEOPLE FIRST"
        title="Your customers."
        description="A little context for every conversation."
      >
        <button className="primary" onClick={() => add("customers")}>
          <Plus size={17} /> Add customer
        </button>
      </PageHeading>
      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <Search size={18} />
            <input
              aria-label="Search customers"
              placeholder="Search name, email or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter customer status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["All", "Active", "Inactive"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Sort customers"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option>Newest</option>
            <option>A–Z</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>COMPANY</th>
                <th>PHONE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id}>
                  <td>
                    <div className="person">
                      <span className={`avatar tone-${i % 4}`}>
                        {initials(c.name)}
                      </span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>{c.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{c.company || "—"}</td>
                  <td>{c.phone || "—"}</td>
                  <td>
                    <Badge>{c.status}</Badge>
                  </td>
                  <td>
                    <Actions
                      name={c.name}
                      edit={() => edit(c)}
                      remove={() => remove("customers", c)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty text="No customers found." onAdd={() => add("customers")} />
        )}
        <div className="table-foot">
          Showing {rows.length} of {data.customers.length} customers
          <span>Built on good relationships.</span>
        </div>
      </section>
    </>
  );
}
// Actions: har row ke Edit (pencil) aur Delete (trash) buttons. aria-label screen reader ke liye.
function Actions({ name, edit, remove }) {
  return (
    <div className="row-actions">
      <button
        className="icon-button"
        aria-label={`Edit ${name}`}
        onClick={edit}
      >
        <Pencil size={16} />
      </button>
      <button
        className="icon-button delete"
        aria-label={`Delete ${name}`}
        onClick={remove}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
// =====================================================================
// LEADS page: Kanban board — har stage ka ek column
// Card ka stage dropdown se badlo → update() → card apne naye column mein chala jaata hai
// =====================================================================
function Leads({ data, add, edit, remove, update, customerName }) {
  // Kaunsa stage tab chuna hai (All = saare columns)
  const [filter, setFilter] = useState("All");
  return (
    <>
      <PageHeading
        eyebrow="TURN CONVERSATIONS INTO OPPORTUNITIES"
        title="Your sales pipeline."
        description="From the first hello to the next big win."
      >
        <button className="primary" onClick={() => add("leads")}>
          <Plus size={17} /> Add lead
        </button>
      </PageHeading>
      <div className="pipeline-toolbar">
        <div className="tabs">
          {["All", ...STAGES].map((s) => (
            <button
              key={s}
              className={filter === s ? "selected" : ""}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <span>{data.leads.length} opportunities</span>
      </div>
      <div className={`kanban ${filter !== "All" ? "filtered" : ""}`}>
        {STAGES.filter((s) => filter === "All" || filter === s).map((stage) => {
          const leads = data.leads.filter((l) => l.stage === stage);
          return (
            <section className="kanban-column" key={stage}>
              <div className="column-head">
                <span className={`legend-dot ${stageClass(stage)}`} />
                <h2>{stage}</h2>
                <span className="count">{leads.length}</span>
              </div>
              <p className="column-total">
                {money(leads.reduce((s, l) => s + l.value, 0))}
              </p>
              {leads.map((l) => (
                <article className="lead-card" key={l.id}>
                  <div className="lead-company">
                    <BriefcaseBusiness size={14} />
                    {customerName(l.customerId)}
                  </div>
                  <h3>{l.title}</h3>
                  <strong className="lead-value">{money(l.value)}</strong>
                  <label className="stage-label">
                    Stage
                    <select
                      aria-label={`Stage for ${l.title}`}
                      value={l.stage}
                      onChange={(e) =>
                        update("leads", l.id, { stage: e.target.value })
                      }
                    >
                      {STAGES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <div className="lead-bottom">
                    <span className="avatar small">
                      {initials(customerName(l.customerId))}
                    </span>
                    <Actions
                      name={l.title}
                      edit={() => edit(l)}
                      remove={() => remove("leads", l)}
                    />
                  </div>
                </article>
              ))}
              {!leads.length && (
                <div className="column-empty">No opportunities here yet</div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
// =====================================================================
// TASKS page: follow-ups ki list, Pending / Completed / All tabs
// Checkbox → update(completed: true/false). Due date aaj se pehle ho aur adhoora ho → "Overdue"
// =====================================================================
function Tasks({ data, add, edit, remove, update, customerName }) {
  const [filter, setFilter] = useState("Pending");
  const rows = data.tasks
    .filter(
      (t) =>
        filter === "All" ||
        (filter === "Completed" ? t.completed : !t.completed),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <>
      <PageHeading
        eyebrow="MAKE THE NEXT MOVE"
        title="Every follow-up matters."
        description="Stay on top of the little things that build lasting relationships."
      >
        <button className="primary" onClick={() => add("tasks")}>
          <Plus size={17} /> Add task
        </button>
      </PageHeading>
      <section className="panel">
        <div className="toolbar">
          <div className="tabs">
            {["Pending", "Completed", "All"].map((s) => (
              <button
                className={s === filter ? "selected" : ""}
                key={s}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="muted">{rows.length} tasks</span>
        </div>
        <div className="task-list">
          {rows.map((t) => (
            <article
              className={`task-row ${t.completed ? "is-complete" : ""}`}
              key={t.id}
            >
              <input
                type="checkbox"
                aria-label={`${t.completed ? "Reopen" : "Complete"} ${t.title}`}
                checked={t.completed}
                onChange={(e) =>
                  update("tasks", t.id, { completed: e.target.checked })
                }
              />
              <div className="task-detail">
                <h3>{t.title}</h3>
                <p>
                  {customerName(t.customerId)} <span>·</span>{" "}
                  <CalendarDays size={13} /> {t.dueDate}
                  {!t.completed && t.dueDate < today() && (
                    <span className="overdue">Overdue</span>
                  )}
                </p>
              </div>
              <Badge>{t.priority}</Badge>
              <Actions
                name={t.title}
                edit={() => edit(t)}
                remove={() => remove("tasks", t)}
              />
            </article>
          ))}
        </div>
        {!rows.length && (
          <Empty
            text="Nothing on this list. All clear!"
            onAdd={() => add("tasks")}
          />
        )}
      </section>
    </>
  );
}
