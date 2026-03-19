import { useCallback, useEffect, useRef, useState } from "react";
import { getSnippetById, saveSnippetToBackground } from "../popup/api";
import { getSnippetPromptTokenEstimate } from "../shared/utils/prompt-builder";
import { buildEditorPreviewSrcDoc } from "../shared/utils/preview-srcdoc-builder";
import type { Snippet } from "../shared/types/snippet";
import { PreviewHeader } from "./components/PreviewHeader";
import { ActionBar } from "./components/ActionBar";
import { CodeEditorPane } from "./components/CodeEditorPane";
import { PreviewPane } from "../shared/components/PreviewPane";

type LoadState = "loading" | "loaded" | "error";

export function App() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [cssContent, setCssContent] = useState("");
  const [savedHtml, setSavedHtml] = useState("");
  const [savedCss, setSavedCss] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const [srcDoc, setSrcDoc] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      setLoadState("error");
      return;
    }
    void getSnippetById(id).then((s) => {
      if (!s) {
        setLoadState("error");
        return;
      }
      const initialHtml = s.html;
      const initialCss = s.styleBlock ?? "";
      setSnippet(s);
      setHtmlContent(initialHtml);
      setCssContent(initialCss);
      setSavedHtml(initialHtml);
      setSavedCss(initialCss);
      setTokenCount(getSnippetPromptTokenEstimate(s));
      setSrcDoc(buildEditorPreviewSrcDoc(initialHtml, initialCss, s));
      setLoadState("loaded");
    }).catch(() => setLoadState("error"));
  }, []);

  const schedulePreviewUpdate = useCallback((html: string, css: string, s: Snippet) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      setSrcDoc(buildEditorPreviewSrcDoc(html, css, s));
    }, 150);
  }, []);

  const handleHtmlChange = useCallback((value: string) => {
    setHtmlContent(value);
    if (snippet) schedulePreviewUpdate(value, cssContent, snippet);
  }, [snippet, cssContent, schedulePreviewUpdate]);

  const handleCssChange = useCallback((value: string) => {
    setCssContent(value);
    if (snippet) schedulePreviewUpdate(htmlContent, value, snippet);
  }, [snippet, htmlContent, schedulePreviewUpdate]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const hasUnsavedChanges = htmlContent !== savedHtml || cssContent !== savedCss;

  async function handleSave() {
    if (!snippet || !hasUnsavedChanges || saving) return;
    setSaving(true);
    try {
      const updated: Snippet = { ...snippet, html: htmlContent, styleBlock: cssContent };
      await saveSnippetToBackground(updated);
      setSnippet(updated);
      setSavedHtml(htmlContent);
      setSavedCss(cssContent);
      setTokenCount(getSnippetPromptTokenEstimate(updated));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      showToast("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadState === "loading") {
    return <div className="preview-status-screen">Loading...</div>;
  }

  if (loadState === "error" || !snippet) {
    return <div className="preview-status-screen preview-status-error">Snippet not found.</div>;
  }

  return (
    <div className="preview-page">
      <PreviewHeader
        snippet={snippet}
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        saveSuccess={saveSuccess}
        onSave={() => void handleSave()}
      />
      <ActionBar
        snippet={snippet}
        currentHtml={htmlContent}
        currentCss={cssContent}
        tokenCount={tokenCount}
        onToast={showToast}
      />
      <CodeEditorPane
        html={htmlContent}
        css={cssContent}
        onHtmlChange={handleHtmlChange}
        onCssChange={handleCssChange}
      />
      <PreviewPane srcDoc={srcDoc} />
      {toast && <div className="preview-toast" role="status">{toast}</div>}
    </div>
  );
}
