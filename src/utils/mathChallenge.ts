type Operation = '+' | '-' | '×';

/**
 * Generates a random arithmetic question with 2-digit numbers.
 * Operations: addition, subtraction, multiplication.
 * Results are always positive (> 0).
 */
export function generateQuestion(): { question: string; answer: number } {
  const operations: Operation[] = ['+', '-', '×'];
  const op = operations[Math.floor(Math.random() * operations.length)];

  let a: number;
  let b: number;
  let answer: number;

  if (op === '+') {
    // a: 10-89, b: 10-99-a to keep sum reasonable; ensure answer > 0
    a = randomInt(10, 89);
    b = randomInt(10, 99 - a);
    answer = a + b;
  } else if (op === '-') {
    // Ensure a > b so result is positive
    a = randomInt(20, 99);
    b = randomInt(10, a - 1);
    answer = a - b;
  } else {
    // multiplication: use single or 2-digit, keep result positive and manageable
    a = randomInt(2, 19);
    b = randomInt(2, 9);
    answer = a * b;
  }

  return { question: `${a} ${op} ${b}`, answer };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
