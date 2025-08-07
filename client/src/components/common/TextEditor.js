import React, { useCallback, useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import tesseract from "tesseract.js";

const editorTheme = {
  paragraph: "editor-paragraph",
};

function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const applyFormat = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <button onClick={() => applyFormat("bold")}>Bold</button>
      <button onClick={() => applyFormat("italic")}>Italic</button>
      <button onClick={() => applyFormat("underline")}>Underline</button>
    </div>
  );
}

function OCRUpload({ onTextExtracted }) {
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const { data: { text } } = await tesseract.recognize(reader.result, "eng");
      onTextExtracted(text);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}

function InsertTextPlugin({ text }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!text) return;
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(text);
      }
    });
  }, [text, editor]);

  return null;
}

export default function TextEditor() {
  const [ocrText, setOcrText] = useState("");

  const initialConfig = {
    namespace: "OCRRichTextEditor",
    theme: editorTheme,
    onError: (err) => console.error(err),
    editorState: null,
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px", width: "100%", maxWidth: "700px" }}>
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <OCRUpload onTextExtracted={setOcrText} />
        <RichTextPlugin
          contentEditable={
            <ContentEditable style={{
              border: "1px solid #ddd",
              minHeight: "200px",
              padding: "10px",
              fontSize: "16px",
              outline: "none"
            }} />
          }
          placeholder={<div style={{ color: "#aaa" }}>Start typing here…</div>}
        />
        <HistoryPlugin />
        <InsertTextPlugin text={ocrText} />
      </LexicalComposer>
    </div>
  );
}
