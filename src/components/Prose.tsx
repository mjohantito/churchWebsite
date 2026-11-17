import { Markdown } from '../lib/markdown';

/** Staff-written text on the public site (safe light formatting, see lib/markdown). */
export function Prose({ text, className = '' }: { text: string; className?: string }) {
  return <Markdown text={text} className={`text-stone-700 ${className}`} />;
}
