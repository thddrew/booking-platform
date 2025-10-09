"use client";

import { useState, useEffect, useRef, use } from "react";
import { Editor, type EditorProps, getDefaultExtensions } from "@maily-to/core";
import { ImageUploadExtension } from "@maily-to/core/extensions";
import { slashCommands } from "./editor-blocks";
import type { JSONContent } from "@tiptap/core";
import { createRoot } from "react-dom/client";
import { useField, useTheme } from "@payloadcms/ui";
import { TypedFieldComponent } from "@/types/custom";
import { JSONFieldServerComponent } from "payload";
import { Email } from "@/payload-types";

type EditorType = Parameters<NonNullable<EditorProps["onCreate"]>>[0];

type AppProps = {
  contentJson: JSONContent | undefined;
  updateJson: (json: JSONContent) => void;
};

function EditorContent(props: AppProps) {
  const { contentJson: defaultContentJson } = props;
  const [editor, setEditor] = useState<EditorType>();

  return (
    <Editor
      blocks={slashCommands}
      contentJson={defaultContentJson}
      onCreate={(editor) => {
        setEditor(editor);
      }}
      onUpdate={(editor) => {
        setEditor(editor);
        props.updateJson(editor.getJSON());
      }}
      config={{
        // Classes must be defined in public/maily-to.css
        bodyClassName: "mly:min-h-[300px]",
      }}
      extensions={[
        ...getDefaultExtensions(slashCommands),
        ImageUploadExtension.configure({
          onImageUpload: async (file) => {
            console.log(file);

            return "";
          },
        }),
      ]}
    />
  );
}

const EditorShadowRoot: TypedFieldComponent<JSONFieldServerComponent, Email> = (
  props
) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const reactContainerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const field = useField();

  useEffect(() => {
    if (!containerRef.current) return;

    // Only create shadow root once
    if (!shadowRootRef.current) {
      const shadowRoot = containerRef.current.attachShadow({ mode: "open" });
      shadowRootRef.current = shadowRoot;

      // Create container for React
      const reactContainer = document.createElement("div");
      reactContainer.setAttribute("data-theme", theme);
      reactContainerRef.current = reactContainer;
      shadowRoot.appendChild(reactContainer);

      // Inject the style.css into shadow DOM
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = "/maily-to.css";
      shadowRoot.appendChild(style);

      // Create root only once
      rootRef.current = createRoot(reactContainer);
    }

    // Update theme attribute
    if (reactContainerRef.current) {
      reactContainerRef.current.setAttribute("data-theme", theme);
    }

    // Render with updated props
    if (rootRef.current) {
      rootRef.current.render(
        <EditorContent
          // @ts-expect-error - TODO: fix this typing
          contentJson={field.value}
          updateJson={field.setValue}
        />
      );
    }

    return () => {
      // Only unmount on final cleanup
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (reactContainerRef.current) {
      reactContainerRef.current.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return <div ref={containerRef} />;
};

export default EditorShadowRoot;
