import type { ReactElement } from "react";

export function ExamplePreview({ srcDoc }: { srcDoc: string }): ReactElement {
  return (
    <div className="example-preview">
      <iframe
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        title="Live preview"
        className="preview-frame"
      />
    </div>
  );
}
