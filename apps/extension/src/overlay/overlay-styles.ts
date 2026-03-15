export const overlayStyles = `
  :host {
    all: initial;
  }
  .truststream-root {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 2147483647;
    width: 360px;
    font-family: "Segoe UI", Arial, sans-serif;
    color: #0f172a;
    pointer-events: auto;
  }
  .panel {
    background: #ffffff;
    border: 1px solid #dbe4ee;
    border-radius: 14px;
    box-shadow: 0 14px 35px rgba(15, 23, 42, 0.2);
    overflow: hidden;
  }
  .header {
    cursor: move;
    background: linear-gradient(120deg, #102a43, #1f7a4c);
    color: white;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .title {
    font-size: 13px;
    font-weight: 700;
  }
  .small {
    font-size: 11px;
    opacity: 0.85;
  }
  .content {
    padding: 10px;
    display: grid;
    gap: 8px;
    max-height: 72vh;
    overflow: auto;
  }
  .card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px;
    background: #f8fafc;
  }
  .score {
    font-size: 26px;
    font-weight: 700;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  }
  .badge {
    border-radius: 999px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 700;
  }
  .trusted { background: #dcfce7; color: #166534; }
  .caution { background: #fef3c7; color: #92400e; }
  .high_risk { background: #fee2e2; color: #991b1b; }
  .list {
    display: grid;
    gap: 6px;
  }
  .item {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 6px;
    background: white;
    font-size: 12px;
  }
  ul {
    margin: 6px 0 0 14px;
    padding: 0;
  }
  li {
    margin: 0 0 4px 0;
    font-size: 12px;
  }
  .textArea {
    width: 100%;
    min-height: 66px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px;
    font-size: 12px;
  }
  .btn {
    border: none;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .btnPrimary {
    background: #0f766e;
    color: white;
  }
  .btnGhost {
    background: #e2e8f0;
    color: #0f172a;
  }
`;
