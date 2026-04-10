import { useState, useEffect } from "react";
import { login, fetchTools, transferTools } from "./api";
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
  const T = translations[lang];

useEffect(() => {
  if (loggedIn) {
    async function loadTools() {
      try {
        const data = await fetchTools();
        setTools(data);
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
    setLoggedIn(true);
    setLoginError(null);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) {
      setLoginError(T.errorLogin);
    } else {
      setLoginError(T.errorServer);
    }
  }
}

  function showMessage(text, type = "success") {
    setMessage(text);
    setMsgType(type);
    setTimeout(() => setMessage(null), 4000);
  }

  function toggleTool(id) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
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
    setWorking(true);
    try {
      await transferTools(selected, country, lang);
      const updated = await fetchTools();
      setTools(updated);
      setSelected([]);
      showMessage(T.success, "success");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) showMessage(T.errorExpired, "error");
      else if (status === 403) showMessage(T.errorPermission, "error");
      else showMessage(T.errorServer, "error");
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
      <button className="btn-secondary" onClick={toggleAll}>
        {T.selectAll}
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
        onClick={handleTransfer}
        disabled={working}
      >
        {working ? "..." : T.transferBtn}
      </button>
    </div>

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
            {tools.map(tool => (
              <tr
                key={tool.id}
                className={selected.includes(tool.id) ? "row-selected" : ""}
                onClick={() => tool.status === "available" && toggleTool(tool.id)}
                style={{ cursor: tool.status === "available" ? "pointer" : "default" }}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(tool.id)}
                    disabled={tool.status !== "available"}
                    onChange={() => toggleTool(tool.id)}
                    onClick={e => e.stopPropagation()}
                  />
                </td>
                <td className="tool-name">{tool.name}</td>
                <td>
                  <span className={`badge ${tool.status === "available" ? "badge-available" : "badge-demo"}`}>
                    {tool.status === "available" ? T.available : T.inDemo}
                  </span>
                </td>
                <td className="tool-location">{tool.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

  </div>
);
}