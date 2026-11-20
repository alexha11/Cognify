export interface GeneratedQuestion {
  content: string;
  hint: string;
  answers: { content: string; isCorrect: boolean }[];
}

export const DEFAULT_HINT = 'Review the course material for this topic.';

/** A section marker such as ---OPTIONS---, tolerating markdown decoration (**, #). */
const marker = (name: string) =>
  new RegExp(`[*#_ \\t]*---${name}---[*_ \\t]*`, 'i');

/** "A. text", "**B)** text", "(C) text" at the start of a line. */
const OPTION_LINE = /^\s*[*_]*\(?([A-D])[.)][*_]*\s*(.*)$/;

/**
 * Parses the delimited format the generation prompt asks for:
 *
 *   ---QUESTION--- text ---OPTIONS--- A. … D. … ---CORRECT--- B ---HINT--- text ---END---
 *
 * Blocks are split on the QUESTION marker, so a model that forgets ---END---
 * still yields every question. Blocks without options, without a single
 * recognisable correct letter, or with fewer than two options are skipped.
 */
export function parseGeneratedQuestions(content: string): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const blocks = content.split(marker('QUESTION')).slice(1);

  for (const rawBlock of blocks) {
    const block = rawBlock.split(marker('END'))[0];

    const [questionText, afterQuestion] = splitOnce(block, marker('OPTIONS'));
    if (afterQuestion === undefined) continue;
    const [optionsText, afterOptions] = splitOnce(
      afterQuestion,
      marker('CORRECT'),
    );
    if (afterOptions === undefined) continue;
    const [correctText, hintText = ''] = splitOnce(
      afterOptions,
      marker('HINT'),
    );

    const options = parseOptions(optionsText);
    const correctLetter = parseCorrectLetter(correctText);
    if (options.length < 2 || !correctLetter) continue;

    const answers = options.map((o) => ({
      content: o.content,
      isCorrect: o.letter === correctLetter,
    }));
    if (answers.filter((a) => a.isCorrect).length !== 1) continue;

    const question = questionText.trim();
    if (!question) continue;

    questions.push({
      content: question,
      hint: hintText.trim() || DEFAULT_HINT,
      answers,
    });
  }

  return questions;
}

function splitOnce(
  text: string,
  separator: RegExp,
): [string, string | undefined] {
  const match = separator.exec(text);
  if (!match) return [text, undefined];
  return [
    text.slice(0, match.index),
    text.slice(match.index + match[0].length),
  ];
}

/** Options may wrap onto following lines; those lines join the option above. */
function parseOptions(text: string): { letter: string; content: string }[] {
  const options: { letter: string; content: string }[] = [];

  for (const line of text.split(/\r?\n/)) {
    const match = OPTION_LINE.exec(line);
    if (match) {
      options.push({
        letter: match[1].toUpperCase(),
        content: match[2].trim(),
      });
    } else if (line.trim() && options.length > 0) {
      const last = options[options.length - 1];
      last.content = `${last.content} ${line.trim()}`.trim();
    }
  }

  return options.filter((o) => o.content.length > 0);
}

/** Prefers a standalone capital letter so "Answer: B" does not read as "A". */
function parseCorrectLetter(text: string): string | undefined {
  const match = /\b([A-D])\b/.exec(text) ?? /\b([a-d])\b/.exec(text);
  return match?.[1].toUpperCase();
}
