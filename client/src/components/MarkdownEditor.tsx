import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  showPreview?: boolean;
  toolbarButtons?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Enter markdown content...",
  height = "400px",
  showPreview = true,
  toolbarButtons = true,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newValue =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newValue);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Content Editor</span>
          {toolbarButtons && (
            <div className="flex gap-1 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertMarkdown("**", "**")}
                title="Bold"
              >
                <strong>B</strong>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertMarkdown("*", "*")}
                title="Italic"
              >
                <em>I</em>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertMarkdown("# ")}
                title="Heading 1"
              >
                H1
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertMarkdown("## ")}
                title="Heading 2"
              >
                H2
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertMarkdown("- ")}
                title="Bullet List"
              >
                • List
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertMarkdown("[", "](url)")}
                title="Link"
              >
                🔗 Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => insertMarkdown("```\n", "\n```")}
                title="Code Block"
              >
                &lt;/&gt; Code
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showPreview ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-2">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ height }}
                className="w-full p-3 border rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Supports Markdown formatting. Use toolbar buttons or type directly.
              </p>
            </TabsContent>

            <TabsContent value="preview" className="space-y-2">
              <div
                style={{ height }}
                className="w-full p-4 border rounded bg-background overflow-auto prose prose-sm dark:prose-invert max-w-none"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[[rehypeHighlight, { detect: true }]]}
                >
                  {value || "*No content to preview*"}
                </ReactMarkdown>
              </div>
              <p className="text-xs text-muted-foreground">
                This is how your content will appear to readers.
              </p>
            </TabsContent>
          </Tabs>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ height }}
            className="w-full p-3 border rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
      </CardContent>
    </Card>
  );
}
