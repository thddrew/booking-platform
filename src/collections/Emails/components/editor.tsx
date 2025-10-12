"use client";

import { useState, useEffect, useRef, use } from "react";
import { Editor, type EditorProps } from "@thddrew/maily-core";
import {
  getVariableSuggestions,
  ImageUploadExtension,
  VariableExtension,
} from "@thddrew/maily-core/extensions";
import { slashCommands } from "./editor-blocks";
import type { JSONContent } from "@tiptap/core";
import { createRoot } from "react-dom/client";
import { useField, useTheme } from "@payloadcms/ui";
import { TypedFieldComponent } from "@/types/custom";
import { JSONFieldServerComponent } from "payload";
import { Email } from "@/payload-types";
import { ErrorBoundary } from "react-error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

type EditorType = Parameters<NonNullable<EditorProps["onCreate"]>>[0];

type AppProps = {
  contentJson: JSONContent | undefined;
  updateJson: (json: JSONContent) => void;
  shadowRoot?: ShadowRoot;
  portalContainer?: HTMLElement | null;
};

function EditorContent(props: AppProps) {
  const { contentJson: defaultContentJson } = props;
  const [editor, setEditor] = useState<EditorType>();

  if (!props.portalContainer) {
    return null;
  }

  console.log("portalContainer", props.portalContainer);

  return (
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
        bodyClassName: "mly:min-h-[300px] mly:bg-muted",
        toolbarClassName: "mly:bg-muted",
        contentClassName: `px-10!`,
      }}
      extensions={[
        ImageUploadExtension.configure({
          onImageUpload: async (file) => {
            console.log(file);

            return "";
          },
        }),
      ]}
      variables={[
        {
          name: "customer-name",
          label: "Customer Name",
        },
        {
          name: "booking-name",
          label: "Booking Name",
        },
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
  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  const reactContainerRef = useRef<HTMLDivElement | null>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const field = useField();

  useEffect(() => {
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
    if (rootContainerRef.current) {
      rootContainerRef.current.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <div>
      <p className="mb-1">Body</p>
      <ErrorBoundary
        fallback={
          <Alert className="my-4 twp">
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
        <div ref={containerRef} />
      </ErrorBoundary>
    </div>
  );
};

export default EditorShadowRoot;
