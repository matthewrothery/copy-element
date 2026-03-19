import Editor from "@monaco-editor/react";

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  lineNumbers: "on" as const,
  scrollBeyondLastLine: false,
  fontSize: 13,
  tabSize: 2,
  wordWrap: "on" as const,
  folding: false,
  renderLineHighlight: "none" as const,
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: "auto" as const,
    horizontal: "auto" as const
  }
} as const;

interface CodeEditorPaneProps {
  html: string;
  css: string;
  onHtmlChange: (value: string) => void;
  onCssChange: (value: string) => void;
}

export function CodeEditorPane({ html, css, onHtmlChange, onCssChange }: CodeEditorPaneProps) {
  return (
    <div className="code-editor-pane">
      <div className="code-editor-col">
        <div className="code-editor-col-header">
          <span className="code-editor-label">HTML</span>
        </div>
        <div className="code-editor-body">
          <Editor
            height="100%"
            language="html"
            value={html}
            onChange={(value) => onHtmlChange(value ?? "")}
            options={EDITOR_OPTIONS}
            theme="vs"
          />
        </div>
      </div>
      <div className="code-editor-divider" aria-hidden />
      <div className="code-editor-col">
        <div className="code-editor-col-header">
          <span className="code-editor-label">CSS</span>
        </div>
        <div className="code-editor-body">
          <Editor
            height="100%"
            language="css"
            value={css}
            onChange={(value) => onCssChange(value ?? "")}
            options={EDITOR_OPTIONS}
            theme="vs"
          />
        </div>
      </div>
    </div>
  );
}
