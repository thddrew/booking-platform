"use client";

import { useState, useEffect, useRef, useLayoutEffect, Ref } from "react";
import { Editor, type EditorProps } from "@thddrew/maily-core";
import { ImageUploadExtension } from "@thddrew/maily-core/extensions";
import { slashCommands } from "./editor-blocks";
import type { JSONContent } from "@tiptap/core";
import { createRoot } from "react-dom/client";
import { FieldDescription, useField, useTheme } from "@payloadcms/ui";
import { JSONFieldClientComponent } from "payload";
import { ErrorBoundary } from "react-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { getVariables } from "./variables";

type EditorType = Parameters<NonNullable<EditorProps["onCreate"]>>[0];

type AppProps = {
  contentJson: JSONContent | undefined;
  updateJson: (json: JSONContent) => void;
  onMount: Ref<HTMLDivElement>;
  portalContainer?: HTMLElement | null;
};

function EditorContent(props: AppProps) {
  const { contentJson: defaultContentJson } = props;
  const [editor, setEditor] = useState<EditorType>();

  if (!props.portalContainer) {
    return null;
  }

  return (
    <div ref={props.onMount}>
      <Editor
        blocks={slashCommands}
        contentJson={defaultContentJson}
        portalContainer={props.portalContainer}
        onCreate={(editor) => {
          setEditor(editor);
        }}
        onUpdate={(editor) => {
          setEditor(editor);
          props.updateJson(editor.getJSON());
        }}
        config={{
          hasMenuBar: false,
          // Classes must be defined in public/maily-to.css
          bodyClassName:
            "mly:min-h-[300px] mly:mt-0 mly:bg-transparent mly:border-0 mly:p-0",
          toolbarClassName: "mly:bg-muted",
          contentClassName: `mly:px-10! mly:mx-auto`,
        }}
        extensions={[
          ImageUploadExtension.configure({
            onImageUpload: async (file) => {
              console.log(file);

              return "";
            },
          }),
        ]}
        variables={getVariables()}
      />
    </div>
  );
}

const EditorShadowRoot: JSONFieldClientComponent = (props) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  const reactContainerRef = useRef<HTMLDivElement | null>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const field = useField();

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Only create shadow root once and when theme is ready
    if (!shadowRootRef.current) {
      const shadowRoot = containerRef.current.attachShadow({ mode: "open" });
      shadowRootRef.current = shadowRoot;

      // Inject the style.css into shadow DOM
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = "/maily-to.css";
      shadowRoot.appendChild(style);

      // Root container for data-theme
      const rootContainer = document.createElement("div");
      rootContainer.setAttribute("data-theme", theme);
      rootContainerRef.current = rootContainer;
      shadowRoot.appendChild(rootContainer);

      // Create container for React content
      const reactContainer = document.createElement("div");
      reactContainerRef.current = reactContainer;
      rootContainer.appendChild(reactContainer);

      // Create portal container (direct child of root container)
      const portalContainer = document.createElement("div");
      portalContainer.id = "portal-container";
      portalContainer.style.position = "relative";
      portalContainer.style.zIndex = "9999";
      portalContainerRef.current = portalContainer;
      rootContainer.appendChild(portalContainer);

      // Create root only once
      rootRef.current = createRoot(reactContainer);
    }

    // Render with updated props
    if (rootRef.current) {
      rootRef.current.render(
        <EditorContent
          // @ts-expect-error - TODO: fix this typing
          contentJson={field.value}
          updateJson={field.setValue}
          portalContainer={portalContainerRef.current}
          onMount={editorRef}
        />
      );
    }
  }, [field.value]);

  useEffect(() => {
    if (rootContainerRef.current) {
      rootContainerRef.current.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        queueMicrotask(() => {
          rootRef.current?.unmount();
        });
      }
    };
  }, []);

  return (
    <div className="twp">
      <p className="mb-1">Body</p>
      <ErrorBoundary
        fallback={
          <Alert className="my-4">
            <AlertTitle className="flex items-center gap-2">
              <AlertCircleIcon className="size-4" />
              Something went wrong.
            </AlertTitle>
            <AlertDescription>
              There was a problem loading the email editor. Please try
              refreshing or contact support.
            </AlertDescription>
          </Alert>
        }
      >
        <div
          className="bg-(--theme-input-bg) rounded border border-(--theme-elevation-150)"
          ref={containerRef}
        />
      </ErrorBoundary>
      <FieldDescription
        className="mt-2"
        description={props.field.admin?.description}
        path={props.path}
      />
    </div>
  );
};

export default EditorShadowRoot;
