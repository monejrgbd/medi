interface NoteCardProps {
  note: {
    id: string;
    content: string;
    is_private: boolean;
    author_name: string;
    is_own: boolean;
    created_at: string;
  };
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">
            {note.is_own ? "You" : note.author_name}
          </span>
          {note.is_private && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private
            </span>
          )}
        </div>
        <time className="text-xs text-ash">
          {new Date(note.created_at).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
      <p className="text-sm text-ink whitespace-pre-wrap">{note.content}</p>
    </div>
  );
}
