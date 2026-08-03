import React, { useMemo } from 'react';
import { MarkdownOptions } from '../types';

export interface MarkdownRendererProps {
  content: string;
  options?: MarkdownOptions;
  className?: string;
  style?: React.CSSProperties;
}

interface ParsedToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'codeBlock' | 'link' | 'list' | 'newline';
  content: string;
  language?: string;
  href?: string;
  ordered?: boolean;
}

const parseInlineMarkdown = (text: string): ParsedToken[] => {
  const tokens: ParsedToken[] = [];
  let remaining = text;

  const patterns: Array<{
    regex: RegExp;
    type: ParsedToken['type'];
    getContent: (match: RegExpMatchArray) => string;
    getExtra?: (match: RegExpMatchArray) => Partial<ParsedToken>;
  }> = [
    {
      regex: /\*\*([^*]+)\*\*/,
      type: 'bold',
      getContent: (match) => match[1],
    },
    {
      regex: /__([^_]+)__/,
      type: 'bold',
      getContent: (match) => match[1],
    },
    {
      regex: /\*([^*]+)\*/,
      type: 'italic',
      getContent: (match) => match[1],
    },
    {
      regex: /_([^_]+)_/,
      type: 'italic',
      getContent: (match) => match[1],
    },
    {
      regex: /`([^`]+)`/,
      type: 'code',
      getContent: (match) => match[1],
    },
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/,
      type: 'link',
      getContent: (match) => match[1],
      getExtra: (match) => ({ href: match[2] }),
    },
  ];

  while (remaining.length > 0) {
    let earliestMatch: {
      index: number;
      match: RegExpMatchArray;
      pattern: typeof patterns[0];
    } | null = null;

    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index !== undefined) {
        if (!earliestMatch || match.index < earliestMatch.index) {
          earliestMatch = { index: match.index, match, pattern };
        }
      }
    }

    if (earliestMatch) {
      // Add text before the match
      if (earliestMatch.index > 0) {
        const textPart = remaining.substring(0, earliestMatch.index);
        if (textPart.includes('\n')) {
          const parts = textPart.split('\n');
          for (let i = 0; i < parts.length; i++) {
            if (parts[i]) {
              tokens.push({ type: 'text', content: parts[i] });
            }
            if (i < parts.length - 1) {
              tokens.push({ type: 'newline', content: '\n' });
            }
          }
        } else {
          tokens.push({ type: 'text', content: textPart });
        }
      }

      // Add the matched token
      const extra = earliestMatch.pattern.getExtra?.(earliestMatch.match) || {};
      tokens.push({
        type: earliestMatch.pattern.type,
        content: earliestMatch.pattern.getContent(earliestMatch.match),
        ...extra,
      });

      remaining = remaining.substring(earliestMatch.index + earliestMatch.match[0].length);
    } else {
      // No more matches, add remaining text
      if (remaining.includes('\n')) {
        const parts = remaining.split('\n');
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) {
            tokens.push({ type: 'text', content: parts[i] });
          }
          if (i < parts.length - 1) {
            tokens.push({ type: 'newline', content: '\n' });
          }
        }
      } else {
        tokens.push({ type: 'text', content: remaining });
      }
      break;
    }
  }

  return tokens;
};

const parseCodeBlock = (text: string): { tokens: ParsedToken[]; remaining: string } => {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);

  if (match && match.index !== undefined) {
    const tokens: ParsedToken[] = [];

    // Add text before the code block
    if (match.index > 0) {
      const beforeText = text.substring(0, match.index);
      tokens.push(...parseInlineMarkdown(beforeText));
    }

    // Add the code block
    tokens.push({
      type: 'codeBlock',
      content: match[2].trimEnd(),
      language: match[1] || undefined,
    });

    // Return remaining text
    const remaining = text.substring(match.index + match[0].length);
    return { tokens, remaining };
  }

  return { tokens: parseInlineMarkdown(text), remaining: '' };
};

const parseMarkdown = (text: string, options?: MarkdownOptions): ParsedToken[] => {
  const tokens: ParsedToken[] = [];
  let remaining = text;

  // Handle code blocks first
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/;
  let match = remaining.match(codeBlockRegex);

  while (match && match.index !== undefined) {
    // Add text before the code block
    if (match.index > 0) {
      const beforeText = remaining.substring(0, match.index);
      tokens.push(...parseInlineMarkdown(beforeText));
    }

    // Add the code block
    tokens.push({
      type: 'codeBlock',
      content: match[2].trimEnd(),
      language: match[1] || undefined,
    });

    remaining = remaining.substring(match.index + match[0].length);
    match = remaining.match(codeBlockRegex);
  }

  // Parse remaining text
  if (remaining.length > 0) {
    tokens.push(...parseInlineMarkdown(remaining));
  }

  return tokens;
};

const parseList = (text: string): ParsedToken[] => {
  const lines = text.split('\n');
  const tokens: ParsedToken[] = [];
  let inList = false;
  let currentListContent = '';
  let ordered = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unorderedMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
    const orderedMatch = line.match(/^[\s]*\d+\.\s+(.*)/);

    if (unorderedMatch) {
      if (!inList || ordered) {
        if (currentListContent) {
          tokens.push(...parseInlineMarkdown(currentListContent));
          currentListContent = '';
        }
        inList = true;
        ordered = false;
      }
      currentListContent += unorderedMatch[1] + '\n';
    } else if (orderedMatch) {
      if (!inList || !ordered) {
        if (currentListContent) {
          tokens.push(...parseInlineMarkdown(currentListContent));
          currentListContent = '';
        }
        inList = true;
        ordered = true;
      }
      currentListContent += orderedMatch[1] + '\n';
    } else {
      if (inList && currentListContent) {
        tokens.push({
          type: 'list',
          content: currentListContent.trimEnd(),
          ordered,
        });
        currentListContent = '';
        inList = false;
        ordered = false;
      }
      tokens.push(...parseInlineMarkdown(line));
      if (i < lines.length - 1) {
        tokens.push({ type: 'newline', content: '\n' });
      }
    }
  }

  if (currentListContent) {
    if (inList) {
      tokens.push({
        type: 'list',
        content: currentListContent.trimEnd(),
        ordered,
      });
    } else {
      tokens.push(...parseInlineMarkdown(currentListContent));
    }
  }

  return tokens;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  options,
  className,
  style,
}) => {
  const renderedContent = useMemo(() => {
    const tokens = parseList(content);

    const elements: React.ReactNode[] = [];
    let keyIndex = 0;

    for (const token of tokens) {
      switch (token.type) {
        case 'text':
          elements.push(
            <span key={keyIndex++}>{token.content}</span>
          );
          break;
        case 'bold':
          elements.push(
            <strong key={keyIndex++}>{token.content}</strong>
          );
          break;
        case 'italic':
          elements.push(
            <em key={keyIndex++}>{token.content}</em>
          );
          break;
        case 'code':
          elements.push(
            <code 
              key={keyIndex++}
              style={{
                backgroundColor: 'var(--color-surface)',
                padding: '0.125rem 0.25rem',
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '0.875em',
              }}
            >
              {token.content}
            </code>
          );
          break;
        case 'codeBlock':
          elements.push(
            <pre 
              key={keyIndex++}
              style={{
                backgroundColor: 'var(--color-neutral-900)',
                color: 'var(--color-neutral-100)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--border-radius)',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                margin: 'var(--spacing-sm) 0',
              }}
            >
              <code>{token.content}</code>
              {token.language && (
                <span 
                  style={{
                    display: 'block',
                    marginTop: 'var(--spacing-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--color-neutral-400)',
                  }}
                >
                  {token.language}
                </span>
              )}
            </pre>
          );
          break;
        case 'link':
          elements.push(
            <a
              key={keyIndex++}
              href={token.href}
              target={options?.linkTarget || '_blank'}
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'underline',
              }}
            >
              {token.content}
            </a>
          );
          break;
        case 'list':
          const listItems = token.content.split('\n').filter(Boolean);
          const ListTag = token.ordered ? 'ol' : 'ul';
          elements.push(
            <ListTag
              key={keyIndex++}
              style={{
                margin: 'var(--spacing-sm) 0',
                paddingLeft: '1.5rem',
              }}
            >
              {listItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ListTag>
          );
          break;
        case 'newline':
          elements.push(<br key={keyIndex++} />);
          break;
      }
    }

    return elements;
  }, [content, options]);

  const containerStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    lineHeight: '1.6',
    ...style,
  };

  return (
    <div 
      style={containerStyles} 
      className={className}
      role="document"
      aria-label="Markdown content"
    >
      {renderedContent}
    </div>
  );
};

export default MarkdownRenderer;
