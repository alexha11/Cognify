import { DEFAULT_HINT, parseGeneratedQuestions } from './question-parser';

const block = (n: number, { end = true, correct = 'B' } = {}) =>
  [
    '---QUESTION---',
    `Question ${n}?`,
    '',
    '---OPTIONS---',
    `A. a${n}`,
    `B. b${n}`,
    `C. c${n}`,
    `D. d${n}`,
    '',
    '---CORRECT---',
    correct,
    '',
    '---HINT---',
    `Hint ${n}`,
    end ? '---END---' : '',
    '',
  ].join('\n');

describe('parseGeneratedQuestions', () => {
  it('parses well-formed blocks', () => {
    const questions = parseGeneratedQuestions(block(1) + block(2) + block(3));

    expect(questions).toHaveLength(3);
    expect(questions[0]).toEqual({
      content: 'Question 1?',
      hint: 'Hint 1',
      answers: [
        { content: 'a1', isCorrect: false },
        { content: 'b1', isCorrect: true },
        { content: 'c1', isCorrect: false },
        { content: 'd1', isCorrect: false },
      ],
    });
  });

  it('keeps every question when the model leaves out ---END---', () => {
    const questions = parseGeneratedQuestions(
      block(1, { end: false }) +
        block(2, { end: false }) +
        block(3, { end: false }),
    );

    expect(questions.map((q) => q.content)).toEqual([
      'Question 1?',
      'Question 2?',
      'Question 3?',
    ]);
    expect(questions[0].hint).toBe('Hint 1');
  });

  it('tolerates markdown decoration around markers and option letters', () => {
    const text = block(1)
      .replace(/---(\w+)---/g, '**---$1---**')
      .replace('B. b1', '**B)** b1');

    const [question] = parseGeneratedQuestions(text);

    expect(question.answers[1]).toEqual({ content: 'b1', isCorrect: true });
  });

  it('reads "Answer: C" as C, not the A in "Answer"', () => {
    const [question] = parseGeneratedQuestions(
      block(1, { correct: 'Answer: C' }),
    );
    expect(question.answers.find((a) => a.isCorrect)?.content).toBe('c1');
  });

  it('joins options that wrap onto the next line', () => {
    const text = block(1).replace('A. a1', 'A. first line\ncontinued here');
    const [question] = parseGeneratedQuestions(text);
    expect(question.answers[0].content).toBe('first line continued here');
  });

  it('falls back to a default hint and skips unusable blocks', () => {
    const noHint = block(1).replace('Hint 1', '');
    const noCorrect = block(2, { correct: 'none of them' });
    const noOptions = '---QUESTION---\nLonely?\n---END---\n';

    const questions = parseGeneratedQuestions(noHint + noCorrect + noOptions);

    expect(questions).toHaveLength(1);
    expect(questions[0].hint).toBe(DEFAULT_HINT);
  });

  it('returns nothing for text without markers', () => {
    expect(parseGeneratedQuestions('Sorry, I cannot help with that.')).toEqual(
      [],
    );
  });
});
