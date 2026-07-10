import { useState, useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { Renderer } from '@openuidev/react-lang';
import { openuiChatLibrary } from '@openuidev/react-ui';

interface UIRender {
  id: number;
  content: string;
}

export default function AgentUI() {
  const room = useRoomContext();
  const [renders, setRenders] = useState<UIRender[]>([]);
  const [minimized, setMinimized] = useState<Record<number, boolean>>({});
  const idRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    room.registerTextStreamHandler('ui.render', async (reader) => {
      const text = await reader.readAll();
      const id = idRef.current++;
      setRenders((prev) => [...prev, { id, content: text }]);
    });
  }, [room]);

  useEffect(() => {
    if (renders.length > prevLen.current) {
      prevLen.current = renders.length;
      requestAnimationFrame(() => {
        listRef.current?.lastElementChild?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }, [renders.length]);

  const toggle = (id: number) =>
    setMinimized((prev) => ({ ...prev, [id]: !prev[id] }));

  const dismiss = (id: number) =>
    setRenders((prev) => prev.filter((r) => r.id !== id));

  if (renders.length === 0) return null;

  return (
    <div className="vw-openui-list" ref={listRef}>
      {renders.map((r) => (
        <div key={r.id} className="vw-openui-card">
          <div className="vw-openui-header">
            <button
              className="vw-openui-toggle"
              onClick={() => toggle(r.id)}
              aria-label={minimized[r.id] ? 'Expand' : 'Minimize'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                {minimized[r.id] ? (
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>
            <span className="vw-openui-label">Agent Response</span>
            <button
              className="vw-openui-close"
              onClick={() => dismiss(r.id)}
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {!minimized[r.id] && (
            <div className="vw-openui-body">
              <Renderer
                response={r.content}
                library={openuiChatLibrary}
                onError={(errors) => console.error('OpenUI render error:', errors)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
