import { useState, useEffect } from "react";
import { login, fetchTools, transferTools, fetchHistory, returnTools, getUserRole, getUserCountry } from "./api";
import translations from "./translations";
import "./App.css";


const COUNTRIES = ["DE", "FR", "IT", "ES", "UK", "PL", "NL", "BE"];

export default function App() {
  const [lang, setLang]         = useState("en");
  const [tools, setTools]       = useState([]);
  const [selected, setSelected] = useState([]);
  const [country, setCountry]   = useState("DE");
  const [message, setMessage]   = useState(null);
  const [msgType, setMsgType]   = useState("success");
  const [loading, setLoading]   = useState(true);
  const [working, setWorking]   = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("demo-client");
  const [password, setPassword] = useState("demo-secret");
  const [loginError, setLoginError] = useState(null);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userRole, setUserRole]       = useState(null);
  const [userCountry, setUserCountry] = useState(null);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  
  const T = translations[lang];
  const filteredTools = tools.filter(tool =>
  tool.name.toLowerCase().includes(search.toLowerCase())
);

useEffect(() => {
  if (loggedIn) {
    async function loadTools() {
      try {
        const data = await fetchTools();
        setTools(data);
        const hist = await fetchHistory();
        setHistory(hist);
      } catch (err) {
        showMessage(T.errorServer, "error");
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }
}, [loggedIn]);

async function handleLogin() {
  try {
    await login(lang, username, password);
    setUserRole(getUserRole());
    setUserCountry(getUserCountry());
    setLoginError(null);
    setLoggedIn(true);
  } catch (err) {
    console.log("Login error:", err);
    const status = err?.response?.status;
    if (status === 401) setLoginError(T.errorLogin);
    else setLoginError(T.errorServer);
  }
}

  function showMessage(text, type = "success") {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(null), 4000);
  }

  function toggleTool(id) {
  const tool = tools.find(t => t.id === id);
  if (!tool) return;

  setSelected(prev => {
    if (prev.includes(id)) {
      return prev.filter(x => x !== id);
    }
    if (prev.length === 0) {
      return [...prev, id];
    }
    const firstSelectedTool = tools.find(t => t.id === prev[0]);
    const firstLocation = firstSelectedTool?.location === "Warehouse" ? "Warehouse" : "demo";
    const newLocation = tool.location === "Warehouse" ? "Warehouse" : "demo";
    if (firstLocation !== newLocation) {
      showMessage(T.errorMixedSelection, "error");
      return prev;
    }
    return [...prev, id];
  });
}

  function toggleAll() {
    const availableIds = tools
      .filter(tool => tool.status === "available")
      .map(tool => tool.id);
    const allSelected = availableIds.every(id => selected.includes(id));
    setSelected(allSelected ? [] : availableIds);
  }

  async function handleTransfer() {
  if (selected.length === 0) {
    showMessage(T.noSelection, "error");
    return;
  }

  if (userRole === "warehouse") {
    const hasDemoTools = selected.some(id => {
      const tool = tools.find(t => t.id === id);
      return tool && tool.location !== "Warehouse";
    });
    if (hasDemoTools) {
      showMessage("Warehouse admin can only transfer Warehouse tools. Use Return to Warehouse for demo tools.", "error");
      return;
    }
  }

  setWorking(true);
  try {
    await transferTools(selected, country, lang);
    const updated = await fetchTools();
    setTools(updated);
    setSelected([]);
    showMessage(T.success, "success");
    const hist = await fetchHistory();
    setHistory(hist);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) showMessage(T.errorExpired, "error");
    else if (status === 403) showMessage(T.errorPermission, "error");
    else showMessage(T.errorServer, "error");
  } finally {
    setWorking(false);
  }
}

async function handleReturn() {
  const demoSelected = selected.filter(id => {
    const tool = tools.find(t => t.id === id);
    return tool && tool.location !== "Warehouse";
  });

  const warehouseSelected = selected.filter(id => {
    const tool = tools.find(t => t.id === id);
    return tool && tool.location === "Warehouse";
  });

  if (selected.length === 0) {
    showMessage(T.noSelection, "error");
    return;
  }

  if (warehouseSelected.length > 0 && demoSelected.length === 0) {
    showMessage(T.errorWarehouseReturn, "error");
    return;
  }

  setWorking(true);
  try {
    await returnTools(demoSelected, lang);
    const updated = await fetchTools();
    setTools(updated);
    setSelected([]);
    showMessage(T.success, "success");
    const hist = await fetchHistory();
    setHistory(hist);
  } catch (err) {
    showMessage(T.errorServer, "error");
  } finally {
    setWorking(false);
  }
}

  if (!loggedIn) {
  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo-bar">
            <div className="logo-dot" />
            <span className="logo-text">MILWAUKEE TOOL</span>
          </div>
          <h1>{T.title}</h1>
          <p className="subtitle">{T.subtitle}</p>
        </div>
        <div className="lang-switcher">
  <span className="lang-label">{T.langLabel}</span>
  <button
    className={lang === "en" ? "lang-btn active" : "lang-btn"}
    onClick={() => setLang("en")}
  >EN</button>
  <button
    className={lang === "de" ? "lang-btn active" : "lang-btn"}
    onClick={() => setLang("de")}
  >DE</button>
</div>
      </header>

      <div className="login-box">
        <h2 className="login-title">{T.loginTitle}</h2>
        <p className="login-sub">{T.loginSub}</p>

        {loginError && (
          <div className="message-bar error">
            <span className="msg-icon">!</span>
            {loginError}
          </div>
        )}

        <div className="login-field">
          <label>{T.loginUser}</label>
          <input
            type="text"s
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div className="login-field">
          <label>{T.loginPass}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button className="btn-primary login-btn" onClick={handleLogin}>
          {T.loginBtn}
        </button>
      </div>
    </div>
  );
}

return (
  <div className="app">

    <header className="header">
      <div className="header-left">
        <div className="logo-bar">
          <div className="logo-dot" />
          <span className="logo-text">MILWAUKEE TOOL</span>
        </div>
        <h1>{T.title}</h1>
        <p className="subtitle">{T.subtitle}</p>
      </div>
      <div className="lang-switcher">
  <span className="lang-label">{T.langLabel}</span>
  <button
    className={lang === "en" ? "lang-btn active" : "lang-btn"}
    onClick={() => setLang("en")}
  >EN</button>
  <button
    className={lang === "de" ? "lang-btn active" : "lang-btn"}
    onClick={() => setLang("de")}
  >DE</button>
  <button
    className="logout-btn"
    onClick={() => {
      setLoggedIn(false);
      setTools([]);
      setSelected([]);
      setMessage(null);
    }}
  >
    {T.logout}
  </button>
</div>
    </header>

    {message && (
      <div className={`message-bar ${msgType}`}>
        <span className="msg-icon">{msgType === "success" ? "✓" : "!"}</span>
        {message}
      </div>
    )}

    <div className="toolbar">
  <input
    type="text"
    className="search-input"
    placeholder={T.searchPlaceholder}
    value={search}
    onChange={e => setSearch(e.target.value)}
  />
  <button className="btn-secondary" onClick={toggleAll}>
    {T.selectAll}
  </button>
  <button className="btn-secondary" onClick={() => {
  const demoIds = tools
    .filter(t => t.location !== "Warehouse")
    .map(t => t.id);
  const allSelected = demoIds.every(id => selected.includes(id));
  setSelected(allSelected ? [] : demoIds);
}}>
  {T.selectAllDemo}
</button>
  <div className="country-selector">
    <label>{T.countryLabel}</label>
    <select value={country} onChange={e => setCountry(e.target.value)}>
      {COUNTRIES.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  </div>
  <button
    className="btn-primary"
    onClick={() => {
      if (selected.length === 0) {
        showMessage(T.noSelection, "error");
        return;
      }
      setShowConfirm(true);
    }}
    disabled={working}
  >
    {working ? "..." : T.transferBtn}
  </button>
</div>

<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
  <button
  className="btn-return"
  onClick={() => {
    if (selected.length === 0) {
      showMessage(T.noSelection, "error");
      return;
    }
    setShowReturnConfirm(true);
  }}
  disabled={working}
>
  {T.returnBtn}
</button>
</div>
        {showReturnConfirm && (
  <div className="confirm-overlay">
    <div className="confirm-box">
      <h3 className="confirm-title">{T.confirmTitle}</h3>
      <p className="confirm-text">
        You are about to return <strong>{selected.length}</strong> tools to the Warehouse.
      </p>
      <div className="confirm-buttons">
        <button
          className="btn-secondary"
          onClick={() => setShowReturnConfirm(false)}
        >
          {T.confirmNo}
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            setShowReturnConfirm(false);
            handleReturn();
          }}
        >
          {T.confirmReturnYes}
        </button>
      </div>
    </div>
  </div>
)}
{showConfirm && (
  <div className="confirm-overlay">
    <div className="confirm-box">
      <h3 className="confirm-title">{T.confirmTitle}</h3>
      <p className="confirm-text">
        {T.confirmText} <strong>{selected.length}</strong> {T.confirmText2} <strong>{country}</strong>.
      </p>
      <div className="confirm-buttons">
        <button
          className="btn-secondary"
          onClick={() => setShowConfirm(false)}
        >
          {T.confirmNo}
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            setShowConfirm(false);
            handleTransfer();
          }}
        >
          {T.confirmYes}
        </button>
      </div>
    </div>
  </div>
)}
    {loading ? (
      <p className="loading-text">{T.loading}</p>
    ) : (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: "48px" }}></th>
              <th>{T.colName}</th>
              <th>{T.colStatus}</th>
              <th>{T.colLocation}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTools.map(tool => (
              <tr
                key={tool.id}
                className={selected.includes(tool.id) ? "row-selected" : ""}
                onClick={() => toggleTool(tool.id)}
                style={{ cursor: tool.status === "available" ? "pointer" : "default" }}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(tool.id)}
                    disabled={tool.location === "Warehouse" && tool.status !== "available"}
                    onChange={() => toggleTool(tool.id)}
                    onClick={e => e.stopPropagation()}
                  />
                </td>
                <td className="tool-name">{tool.name}</td>
                <td>
                  <span className={`badge ${tool.location === "Warehouse" ? "badge-available" : "badge-demo"}`}>
                    {tool.location === "Warehouse" ? T.available : T.inDemo}
                  </span>
                </td>
                <td className="tool-location">{tool.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    <div className="history-section">
      <h3 className="history-title">{T.historyTitle}</h3>
      {history.length === 0 ? (
        <p className="history-empty">{T.historyEmpty}</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>{T.historyTools}</th>
              <th>{T.historyCountry}</th>
              <th>{T.historyTime}</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id}>
                <td>{h.tool_names || h.tool_ids}</td>
                <td>{h.target_country}</td>
                <td>{h.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);
}