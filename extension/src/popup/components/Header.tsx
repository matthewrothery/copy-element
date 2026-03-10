import React from "react";

interface HeaderProps {
  onCapture: () => void;
}

export function Header({ onCapture }: HeaderProps): JSX.Element {
  return (
    <header className="header">
      <h1 className="title">Element Capture</h1>
      <button className="primary-button" onClick={onCapture} type="button" aria-label="Capture Element">
        Capture Element
      </button>
    </header>
  );
}
