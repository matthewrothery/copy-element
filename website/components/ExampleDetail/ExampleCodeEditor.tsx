import type { ReactElement } from "react";

type Props = {
  html: string;
  css: string;
  onHtmlChange: (val: string) => void;
  onCssChange: (val: string) => void;
};

export function ExampleCodeEditor({
  html,
  css,
  onHtmlChange,
  onCssChange,
}: Props): ReactElement {
  return (
    <div className="code-editor">
      <div className="code-pane">
        <label className="code-pane-label">HTML</label>
        <textarea
          className="code-textarea"
          value={html}
          onChange={(e) => onHtmlChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="HTML editor"
        />
      </div>
      <div className="code-divider" />
      <div className="code-pane">
        <label className="code-pane-label">CSS</label>
        <textarea
          className="code-textarea"
          value={css}
          onChange={(e) => onCssChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="CSS editor"
        />
      </div>
    </div>
  );
}
