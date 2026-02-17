import React, { useState, type ChangeEvent } from 'react';
import './Lab2.css';

interface Step {
  title: string;
  matrix: number[][];
}

const Lab2: React.FC = () => {
  const [numRows, setNumRows] = useState<number>(3);
  const [numCols, setNumCols] = useState<number>(3);
  const [matrix, setMatrix] = useState<number[][]>(
    Array(3).fill(null).map(() => Array(4).fill(0))
  );
  const [solution, setSolution] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [parametricSolution, setParametricSolution] = useState<string[]>([]);

  const resetSolution = (): void => {
    setSolution(null);
    setError(null);
    setSteps([]);
    setParametricSolution([]);
  };

  const handleNumRowsChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newRows = parseInt(e.target.value) || 1;
    const clampedRows = Math.max(1, Math.min(10, newRows));
    setNumRows(clampedRows);
    setMatrix(Array(clampedRows).fill(null).map(() => Array(numCols + 1).fill(0)));
    resetSolution();
  };

  const handleNumColsChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newCols = parseInt(e.target.value) || 1;
    const clampedCols = Math.max(1, Math.min(10, newCols));
    setNumCols(clampedCols);
    setMatrix(Array(numRows).fill(null).map(() => Array(clampedCols + 1).fill(0)));
    resetSolution();
  };

  const handleMatrixChange = (row: number, col: number, value: string): void => {
    const newMatrix = matrix.map(r => [...r]);
    newMatrix[row][col] = parseFloat(value) || 0;
    setMatrix(newMatrix);
  };

  const formatMatrix = (mat: number[][]): string => {
    return mat
      .map(row => row.map(val => val.toFixed(4).padStart(10)).join(' '))
      .join('\n');
  };

  const solveSystem = (): void => {
    setError(null);
    setSolution(null);
    setSteps([]);
    setParametricSolution([]);

    const workMatrix = matrix.map(row => [...row]);
    const newSteps: Step[] = [];
    const m = numRows;
    const n = numCols;

    newSteps.push({
      title: 'Исходная расширенная матрица',
      matrix: workMatrix.map(row => [...row]),
    });

    // Метод Гаусса-Жордана для прямоугольных матриц
    let currentRow = 0;
    const pivotCols: number[] = [];

    for (let col = 0; col < n && currentRow < m; col++) {
      // Поиск максимального элемента в столбце
      let maxRow = currentRow;
      for (let row = currentRow + 1; row < m; row++) {
        if (Math.abs(workMatrix[row][col]) > Math.abs(workMatrix[maxRow][col])) {
          maxRow = row;
        }
      }

      // Если весь столбец нулевой, пропускаем
      if (Math.abs(workMatrix[maxRow][col]) < 1e-10) {
        continue;
      }

      // Перестановка строк
      if (maxRow !== currentRow) {
        [workMatrix[currentRow], workMatrix[maxRow]] = [workMatrix[maxRow], workMatrix[currentRow]];
        newSteps.push({
          title: `Перестановка строк ${currentRow + 1} и ${maxRow + 1}`,
          matrix: workMatrix.map(row => [...row]),
        });
      }

      pivotCols.push(col);

      // Нормализация текущей строки
      const pivot = workMatrix[currentRow][col];
      for (let j = 0; j <= n; j++) {
        workMatrix[currentRow][j] /= pivot;
      }
      newSteps.push({
        title: `Нормализация строки ${currentRow + 1} (деление на ${pivot.toFixed(4)})`,
        matrix: workMatrix.map(row => [...row]),
      });

      // Обнуление элементов столбца
      for (let row = 0; row < m; row++) {
        if (row !== currentRow) {
          const factor = workMatrix[row][col];
          if (Math.abs(factor) > 1e-10) {
            for (let j = 0; j <= n; j++) {
              workMatrix[row][j] -= factor * workMatrix[currentRow][j];
            }
          }
        }
      }
      newSteps.push({
        title: `Обнуление элементов столбца ${col + 1}`,
        matrix: workMatrix.map(row => [...row]),
      });

      currentRow++;
    }

    // Проверка на несовместность
    for (let i = currentRow; i < m; i++) {
      let allZero = true;
      for (let j = 0; j < n; j++) {
        if (Math.abs(workMatrix[i][j]) > 1e-10) {
          allZero = false;
          break;
        }
      }
      if (allZero && Math.abs(workMatrix[i][n]) > 1e-10) {
        setError('Система несовместна (противоречие в уравнениях)');
        setSteps(newSteps);
        return;
      }
    }

    // Определение свободных переменных
    const freeVars: number[] = [];
    for (let col = 0; col < n; col++) {
      if (!pivotCols.includes(col)) {
        freeVars.push(col);
      }
    }

    if (freeVars.length > 0) {
      // Бесконечно много решений
      const params = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'];
      const equations: string[] = [];

      // Параметры для свободных переменных
      freeVars.forEach((col, idx) => {
        const param = idx < params.length ? params[idx] : `t${idx}`;
        equations.push(`x${col + 1} = ${param}`);
      });

      // Выражения для базисных переменных
      pivotCols.forEach((col, idx) => {
        let expr = workMatrix[idx][n].toFixed(4);
        freeVars.forEach((freeCol, paramIdx) => {
          const coef = -workMatrix[idx][freeCol];
          if (Math.abs(coef) > 1e-10) {
            const param = paramIdx < params.length ? params[paramIdx] : `t${paramIdx}`;
            const sign = coef > 0 ? '+' : '';
            expr += ` ${sign}${coef.toFixed(4)}${param}`;
          }
        });
        equations.push(`x${col + 1} = ${expr}`);
      });

      setParametricSolution(equations);
      setSteps(newSteps);
    } else {
      // Единственное решение
      const result = Array(n).fill(0);
      pivotCols.forEach((col, idx) => {
        result[col] = workMatrix[idx][n];
      });
      setSolution(result);
      setSteps(newSteps);
    }
  };

  const examples = [
    {
      name: 'Пример 1 (3×3)',
      rows: 3,
      cols: 3,
      matrix: [
        [2, 1, -1, 8],
        [-3, -1, 2, -11],
        [-2, 1, 2, -3],
      ],
      description: '2x₁ + x₂ - x₃ = 8; -3x₁ - x₂ + 2x₃ = -11; -2x₁ + x₂ + 2x₃ = -3',
    },
    {
      name: 'Пример 2 (3×3)',
      rows: 3,
      cols: 3,
      matrix: [
        [1, 3, 0, 14],
        [2, 0, -3, 7],
        [0, 2, 1, 7],
      ],
      description: 'x₁ + 3x₂ = 14; 2x₁ - 3x₃ = 7; 2x₂ + x₃ = 7',
    },
    {
      name: 'Пример 3 (3×3)',
      rows: 3,
      cols: 3,
      matrix: [
        [1, 3, -4, 5],
        [-1, 1, 1, 0],
        [2, 1, 1, 9],
      ],
      description: 'x₁ + 3x₂ - 4x₃ = 5; -x₁ + x₂ + x₃ = 0; 2x₁ + x₂ + x₃ = 9 (x₁=3, x₂=2, x₃=1)',
    },
    {
      name: 'Пример 4 (3×4)',
      rows: 3,
      cols: 4,
      matrix: [
        [1, 2, 1, 0, 4],
        [1, 1, 0, 1, 6],
        [1, -1, -1, 3, 10],
      ],
      description: '3 уравнения, 4 переменных (бесконечно много решений)',
    },
    {
      name: 'Пример 5 (2×4)',
      rows: 2,
      cols: 4,
      matrix: [
        [1, 1, 1, 4, 1],
        [-1, 0, 1, 2, 1],
      ],
      description: '2 уравнения, 4 переменных (параметрическое решение)',
    },
  ];

  const [currentExampleIndex, setCurrentExampleIndex] = useState<number>(0);

  const loadExample = (index: number): void => {
    const example = examples[index];
    setCurrentExampleIndex(index);
    setNumRows(example.rows);
    setNumCols(example.cols);
    setMatrix(example.matrix.map(row => [...row]));
    resetSolution();
  };

  const nextExample = (): void => {
    const nextIndex = (currentExampleIndex + 1) % examples.length;
    loadExample(nextIndex);
  };

  const clearMatrix = (): void => {
    setMatrix(Array(numRows).fill(null).map(() => Array(numCols + 1).fill(0)));
    resetSolution();
  };

  return (
    <div className="container">
      <h1>Решение СЛАУ методом Гаусса-Жордана</h1>
      <p className="subtitle">Система линейных алгебраических уравнений</p>

      <div className="size-selector">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div>
            <label>Количество строк (m):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={numRows}
              onChange={handleNumRowsChange}
            />
          </div>
          <div>
            <label>Количество столбцов (n):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={numCols}
              onChange={handleNumColsChange}
            />
          </div>
        </div>
      </div>

      <div className="examples-section">
        <h3>Примеры из лекций:</h3>
        <div className="example-selector">
          {examples.map((example, index) => (
            <button
              key={index}
              className={`example-btn ${currentExampleIndex === index ? 'active' : ''}`}
              onClick={() => loadExample(index)}
            >
              {example.name}
            </button>
          ))}
        </div>
        <div className="example-description">
          {examples[currentExampleIndex].description}
        </div>
      </div>

      <div className="matrix-container">
        <div className="matrix-label">Введите коэффициенты системы:</div>
        <div className="matrix">
          {matrix.map((row, i) => (
            <div key={i} className="matrix-row">
              {row.slice(0, -1).map((val, j) => (
                <div key={j} className="matrix-cell">
                  <input
                    type="number"
                    step="0.1"
                    value={val}
                    onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                  />
                </div>
              ))}
              <span className="equals">=</span>
              <div className="matrix-cell">
                <input
                  type="number"
                  step="0.1"
                  value={row[row.length - 1]}
                  onChange={(e) =>
                    handleMatrixChange(i, row.length - 1, e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="buttons">
        <button className="btn-primary" onClick={solveSystem}>
          Решить систему
        </button>
        <button className="btn-secondary" onClick={nextExample}>
          Следующий пример
        </button>
        <button className="btn-clear" onClick={clearMatrix}>
          Очистить
        </button>
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      {parametricSolution.length > 0 && (
        <div className="solution">
          <h3>✓ Бесконечно много решений (параметрическое):</h3>
          {parametricSolution.map((eq, i) => (
            <div key={i} className="solution-item">
              {eq}
            </div>
          ))}
        </div>
      )}

      {solution && (
        <div className="solution">
          <h3>✓ Единственное решение:</h3>
          {solution.map((val, i) => (
            <div key={i} className="solution-item">
              x<sub>{i + 1}</sub> = {val.toFixed(6)}
            </div>
          ))}
        </div>
      )}

      {steps.length > 0 && (
        <div className="steps">
          <h3>Шаги решения:</h3>
          {steps.map((step, i) => (
            <div key={i} className="step">
              <div className="step-title">{step.title}</div>
              <div className="step-matrix">{formatMatrix(step.matrix)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Lab2;