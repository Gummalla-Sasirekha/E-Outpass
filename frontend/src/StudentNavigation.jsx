
import React, { useState } from "react";
import "./StudentNavigation.css";

const menuItems = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "outpasses", label: "My Outpasses", icon: "▤" },
  { id: "profile", label: "Profile", icon: "♙" },
];

export default function StudentNavigation({
  activePage = "home",
  onNavigate,
  student = {},
  onLogout,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const studentName =
    student.name ||
    student.fullName ||
    student.studentName ||
    "Student";

  const studentCourse =
    student.course ||
    student.department ||
    "Student Account";

  const navigate = (page) => {
    setDrawerOpen(false);
    if (onNavigate) onNavigate(page);
  };

  const logout = () => {
    setDrawerOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <div className="en-app">
      <header className="en-topbar">
        <button
          type="button"
          className="en-icon-button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <span className="en-menu-icon">☰</span>
        </button>

        <div className="en-brand">
          <span className="en-brand-mark">E</span>
          <span>E-Outpass</span>
        </div>

        <button
          type="button"
          className="en-icon-button en-notification"
          aria-label="Notifications"
          onClick={() => {}}
        >
          ♧
        </button>
      </header>

      {drawerOpen && (
        <div
          className="en-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`en-drawer ${drawerOpen ? "en-drawer-open" : ""}`}
        aria-hidden={!drawerOpen}
      >
        <div className="en-drawer-header">
          <button
            type="button"
            className="en-close-button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>

          <div className="en-avatar">
            {studentName.charAt(0).toUpperCase()}
          </div>

          <h2>{studentName}</h2>
          <p>{studentCourse}</p>
          <span className="en-account-label">STUDENT ACCOUNT</span>
        </div>

        <nav className="en-drawer-links" aria-label="Student menu">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`en-drawer-link ${
                activePage === item.id ? "en-active" : ""
              }`}
              onClick={() => navigate(item.id)}
            >
              <span className="en-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.id && (
                <span className="en-active-dot" />
              )}
            </button>
          ))}
        </nav>

        <div className="en-drawer-footer">
          <div className="en-footer-line" />
          <button
            type="button"
            className="en-logout-button"
            onClick={logout}
          >
            <span className="en-nav-icon">↪</span>
            <span>Logout</span>
          </button>
          <p className="en-version">E-Outpass · Student Portal</p>
        </div>
      </aside>

      <main className="en-main">{children}</main>

      <nav className="en-bottom-nav" aria-label="Bottom navigation">
        {menuItems.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`en-bottom-item ${
              activePage === item.id ? "en-bottom-active" : ""
            }`}
            onClick={() => navigate(item.id)}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            <span className="en-bottom-icon">{item.icon}</span>
            <span className="en-bottom-label">
              {item.id === "outpasses" ? "Outpasses" : item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
