import React, { useState, type ChangeEvent } from 'react';
import './Lab2.css';

interface Step {
  title: string;
  matrix: number[][];
}

const Lab2: React.FC = () => {
  const [size, setSize] = useState<number>(3);
  const [matrix, setMatrix] = useState<number[][]>(
    Array(3).fill(null).map(() => Array(4).fill(0))
  );
  const [solution, setSolution] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  const handleSizeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newSize = parseInt(e.target.value) || 2;
    const clampedSize = Math.max(2, Math.min(10, newSize));
    setSize(clampedSize);
    setMatrix(Array(clampedSize).fill(null).map(() => Array(clampedSize + 1).fill(0)));
    setSolution(null);
    setError(null);
    setSteps([]);
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

    const workMatrix = matrix.map(row => [...row]);
    const newSteps: Step[] = [];
    const n = size;

    newSteps.push({
      title: 'Исходная расширенная матрица',
      matrix: workMatrix.map(row => [...row]),
    });

    // Прямой ход метода Гаусса-Жордана
    for (let i = 0; i < n; i++) {
      // Поиск максимального элемента в столбце (частичный выбор ведущего элемента)
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(workMatrix[k][i]) > Math.abs(workMatrix[maxRow][i])) {
          maxRow = k;
        }
      }

      // Перестановка строк
      if (maxRow !== i) {
        [workMatrix[i], workMatrix[maxRow]] = [workMatrix[maxRow], workMatrix[i]];
        newSteps.push({
          title: `Перестановка строк ${i + 1} и ${maxRow + 1}`,
          matrix: workMatrix.map(row => [...row]),
        });
      }

      // Проверка на нулевой ведущий элемент
      if (Math.abs(workMatrix[i][i]) < 1e-10) {
        setError('Система не имеет единственного решения (определитель = 0)');
        return;
      }

      // Нормализация текущей строки
      const pivot = workMatrix[i][i];
      for (let j = 0; j <= n; j++) {
        workMatrix[i][j] /= pivot;
      }
      newSteps.push({
        title: `Нормализация строки ${i + 1} (деление на ${pivot.toFixed(4)})`,
        matrix: workMatrix.map(row => [...row]),
      });

      // Обнуление элементов столбца
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = workMatrix[k][i];
          if (Math.abs(factor) > 1e-10) {
            for (let j = 0; j <= n; j++) {
              workMatrix[k][j] -= factor * workMatrix[i][j];
            }
          }
        }
      }
      newSteps.push({
        title: `Обнуление элементов столбца ${i + 1}`,
        matrix: workMatrix.map(row => [...row]),
      });
    }

    // Извлечение решения
    const result = workMatrix.map(row => row[n]);

    setSteps(newSteps);
    setSolution(result);
  };

  const fillExample = (): void => {
    // Пример: 2x + y - z = 8, -3x - y + 2z = -11, -2x + y + 2z = -3
    if (size === 3) {
      setMatrix([
        [2, 1, -1, 8],
        [-3, -1, 2, -11],
        [-2, 1, 2, -3],
      ]);
    } else {
      // Простой пример для других размерностей
      const newMatrix = Array(size)
        .fill(null)
        .map((_, i) =>
          Array(size + 1)
            .fill(null)
            .map((_, j) => (j === size ? i + 1 : i === j ? 2 : 1))
        );
      setMatrix(newMatrix);
    }
    setSolution(null);
    setError(null);
    setSteps([]);
  };

  const clearMatrix = (): void => {
    setMatrix(Array(size).fill(null).map(() => Array(size + 1).fill(0)));
    setSolution(null);
    setError(null);
    setSteps([]);
  };

  return (
    <div className="container">
      <h1>Решение СЛАУ методом Гаусса-Жордана</h1>
      <p className="subtitle">Система линейных алгебраических уравнений</p>

      <div className="size-selector">
        <label>Размерность системы (количество уравнений):</label>
        <input
          type="number"
          min="2"
          max="10"
          value={size}
          onChange={handleSizeChange}
        />
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
        <button className="btn-secondary" onClick={fillExample}>
          Пример
        </button>
        <button className="btn-clear" onClick={clearMatrix}>
          Очистить
        </button>
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      {solution && (
        <div className="solution">
          <h3>✓ Решение системы:</h3>
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

