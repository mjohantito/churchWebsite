import type { ElementType } from 'react';

interface Props {
  as?: ElementType;
  id?: string;
  before: string;
  script?: string;
  after?: string;
  className?: string;
  /** extra classes for the script word (size / placement) */
  scriptClassName?: string;
  /** put the script word on its own line */
  scriptBlock?: boolean;
  /** script word first, caps stacked beside it on the same line */
  scriptLead?: boolean;
}

function words(text: string | undefined) {
  return (text ?? '').split(/\s+/).filter(Boolean);
}

/**
 * Heavy uppercase heading with one brush-script accent word.
 * The heading keeps one unsplit accessible name (aria-label); the split
 * words are decorative and aria-hidden. Without JS every word is visible.
 */
export function SplitHeading({
  as: Tag = 'h2',
  id,
  before,
  script,
  after,
  className = '',
  scriptClassName = '',
  scriptBlock = false,
  scriptLead = false,
}: Props) {
  const label = [before, script, after].filter(Boolean).join(' ');
  const renderWords = (list: string[], keyPrefix: string) =>
    list.map((w, i) => (
      <span key={`${keyPrefix}-${i}`}>
        <span className="split-word">
          <span className="split-inner" data-word data-intro>
            {w}
          </span>
        </span>{' '}
      </span>
    ));

  if (scriptLead) {
    return (
      <Tag id={id} aria-label={label} data-split className={`display-heading ${className}`}>
        <span aria-hidden="true" className="script-lead">
          {script && (
            <span className={`script-word script-lead__script ${scriptClassName}`} data-script>
              {script}
            </span>
          )}
          <span className="script-lead__caps">{renderWords(words([before, after].filter(Boolean).join(' ')), 'c')}</span>
        </span>
      </Tag>
    );
  }

  return (
    <Tag id={id} aria-label={label} data-split className={`display-heading ${className}`}>
      <span aria-hidden="true">
        {renderWords(words(before), 'b')}
        {script && (
          <span
            className={`script-word ${scriptBlock ? 'block' : ''} ${scriptClassName}`}
            data-script
            data-intro
          >
            {script}
          </span>
        )}
        {after && <> {renderWords(words(after), 'a')}</>}
      </span>
    </Tag>
  );
}
