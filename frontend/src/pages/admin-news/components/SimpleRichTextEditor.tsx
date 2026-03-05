import { useEffect, useRef, type ReactNode } from 'react';
import { Bold, Italic, Link2, List, ListOrdered, Underline } from 'lucide-react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

function runCommand(command: string, value?: string) {
    document.execCommand(command, false, value);
}

export default function SimpleRichTextEditor({
    value,
    onChange,
    placeholder = 'Write article content...',
}: Props) {
    const editorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (el.innerHTML !== value) {
            el.innerHTML = value || '';
        }
    }, [value]);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-300 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-900/90">
                <ToolbarButton label="Bold" onClick={() => runCommand('bold')}>
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Italic" onClick={() => runCommand('italic')}>
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Underline" onClick={() => runCommand('underline')}>
                    <Underline className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Bullet List" onClick={() => runCommand('insertUnorderedList')}>
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Numbered List" onClick={() => runCommand('insertOrderedList')}>
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    label="Insert Link"
                    onClick={() => {
                        const link = window.prompt('Enter URL');
                        if (link) runCommand('createLink', link);
                    }}
                >
                    <Link2 className="h-4 w-4" />
                </ToolbarButton>
                <button
                    type="button"
                    onClick={() => runCommand('removeFormat')}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    Clear
                </button>
            </div>

            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
                className="rich-editor-content min-h-[240px] bg-white p-3 text-sm text-slate-900 outline-none dark:bg-slate-900/60 dark:text-slate-100"
                data-placeholder={placeholder}
                style={{ whiteSpace: 'pre-wrap' }}
            />
        </div>
    );
}

function ToolbarButton({
    children,
    onClick,
    label,
}: {
    children: ReactNode;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="rounded border border-slate-300 p-1.5 text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}
