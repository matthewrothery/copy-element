import React from "react";

interface HeaderProps {
  onCapture: () => void;
  isCapturing: boolean;
}

export function Header({ onCapture, isCapturing }: HeaderProps): JSX.Element {
  return (
    <header className="header">
      <h1 className="title">Element Capture</h1>
      <button className="primary-button" onClick={onCapture} type="button" aria-label="Capture Element">
        {isCapturing ? "Capturing..." : "Capture Element"}
      </button>
    </header>
  );
}
