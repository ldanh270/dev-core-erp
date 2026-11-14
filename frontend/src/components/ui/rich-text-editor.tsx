import { useCallback, useEffect, useRef } from "react"

import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import UnderlineExtension from "@tiptap/extension-underline"
import { type Editor, EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  "use no memo"
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineExtension,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Nhập nội dung...",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[120px] max-h-[400px] overflow-y-auto outline-none p-3",
      },
    },
    onUpdate: ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync value if it changes outside (e.g., initial load or form reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const addImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        editor?.chain().focus().setImage({ src: result }).run()
      }
      reader.readAsDataURL(file)
    }
    // Reset input so the same file can be selected again
    e.target.value = ""
  }

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes("link").href
    const url = window.prompt("URL liên kết", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-background flex flex-col focus-within:ring-1 focus-within:ring-ring">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
      />
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-border/60 bg-muted/20">
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBold().run()
          }}
          className={`p-1 rounded transition-colors ${editor.isActive("bold") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <Bold className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleItalic().run()
          }}
          className={`p-1 rounded transition-colors ${editor.isActive("italic") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <Italic className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleUnderline().run()
          }}
          className={`p-1 rounded transition-colors ${editor.isActive("underline") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <UnderlineIcon className="size-3.5" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBulletList().run()
          }}
          className={`p-1 rounded transition-colors ${editor.isActive("bulletList") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <List className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run()
          }}
          className={`p-1 rounded transition-colors ${editor.isActive("orderedList") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <ListOrdered className="size-3.5" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={`p-1 rounded transition-colors ${editor.isActive("link") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <Link2 className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ImageIcon className="size-3.5" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleCodeBlock().run()
          }}
          className={`p-1 rounded transition-colors ${editor.isActive("codeBlock") ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <Code className="size-3.5" />
        </button>
      </div>
      <div
        className="flex-1 cursor-text"
        onClick={() => {
          editor.commands.focus()
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
