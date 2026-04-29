import { generateQuestion } from '../../src/utils/mathChallenge';

describe('generateQuestion', () => {
  it('returns an object with question (string) and answer (number)', () => {
    const result = generateQuestion();
    expect(typeof result.question).toBe('string');
    expect(typeof result.answer).toBe('number');
  });

  it('answer is always a positive number (> 0)', () => {
    // Run many times to cover random cases
    for (let i = 0; i < 200; i++) {
      const { answer } = generateQuestion();
      expect(answer).toBeGreaterThan(0);
    }
  });

  it('answer matches the question (evaluate and compare)', () => {
    for (let i = 0; i < 200; i++) {
      const { question, answer } = generateQuestion();
      // Replace × with * for evaluation
      const evalStr = question.replace(/×/g, '*');
      // eslint-disable-next-line no-eval
      const computed = eval(evalStr) as number;
      expect(computed).toBe(answer);
    }
  });
});
