import React, { useState, type ChangeEvent } from 'react';
import './Lab3.css';

type OptimizationType = 'max' | 'min';
type ConstraintType = '<=' | '>=' | '=';

interface Constraint {
  coefficients: number[];
  type: ConstraintType;
  rhs: number;
}

interface Step {
  title: string;
  tableau: number[][];
  basis: number[];
  description?: string;
}

interface Solution {
  variables: number[];
  objectiveValue: number;
  isOptimal: boolean;
  isFeasible: boolean;
}

const Lab3: React.FC = () => {
  const [numVariables, setNumVariables] = useState<number>(2);
  const [numConstraints, setNumConstraints] = useState<number>(2);
  const [optimizationType, setOptimizationType] = useState<OptimizationType>('max');
  const [objectiveCoefficients, setObjectiveCoefficients] = useState<number[]>([3, 5]);
  const [constraints, setConstraints] = useState<Constraint[]>([
    { coefficients: [1, 0], type: '<=', rhs: 4 },
    { coefficients: [0, 2], type: '<=', rhs: 12 },
  ]);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  const examples = [
    {
      name: 'Пример 1 (базовый)',
      numVariables: 2,
      numConstraints: 2,
      optimizationType: 'max' as OptimizationType,
      objectiveCoefficients: [3, 5],
      constraints: [
        { coefficients: [1, 0], type: '<=' as ConstraintType, rhs: 4 },
        { coefficients: [0, 2], type: '<=' as ConstraintType, rhs: 12 },
      ],
      description: 'max z = 3x₁ + 5x₂; x₁ ≤ 4; 2x₂ ≤ 12 (Ответ: x₁=4, x₂=6, z=42)',
    },
    {
      name: 'Пример 2 (из лекции)',
      numVariables: 2,
      numConstraints: 4,
      optimizationType: 'max' as OptimizationType,
      objectiveCoefficients: [3, 8],
      constraints: [
        { coefficients: [1, 7], type: '<=' as ConstraintType, rhs: 32 },
        { coefficients: [2, 5], type: '<=' as ConstraintType, rhs: 42 },
        { coefficients: [3, 4], type: '<=' as ConstraintType, rhs: 62 },
        { coefficients: [2, 1], type: '=' as ConstraintType, rhs: 34 },
      ],
      description: 'max f = 3x₁ + 8x₂; x₁ + 7x₂ ≤ 32; 2x₁ + 5x₂ ≤ 42; 3x₁ + 4x₂ ≤ 62; 2x₁ + x₂ = 34',
    },
    {
      name: 'Пример 3 (с равенством)',
      numVariables: 2,
      numConstraints: 2,
      optimizationType: 'max' as OptimizationType,
      objectiveCoefficients: [3, 2],
      constraints: [
        { coefficients: [1, 1], type: '=' as ConstraintType, rhs: 4 },
        { coefficients: [2, 1], type: '<=' as ConstraintType, rhs: 6 },
      ],
      description: 'max z = 3x₁ + 2x₂; x₁ + x₂ = 4; 2x₁ + x₂ ≤ 6',
    },
    {
      name: 'Пример 4 (с ограничением ≥)',
      numVariables: 2,
      numConstraints: 2,
      optimizationType: 'max' as OptimizationType,
      objectiveCoefficients: [4, 3],
      constraints: [
        { coefficients: [1, 1], type: '>=' as ConstraintType, rhs: 3 },
        { coefficients: [2, 1], type: '<=' as ConstraintType, rhs: 10 },
      ],
      description: 'max z = 4x₁ + 3x₂; x₁ + x₂ ≥ 3; 2x₁ + x₂ ≤ 10',
    },
    {
      name: 'Пример 5 (минимизация)',
      numVariables: 2,
      numConstraints: 2,
      optimizationType: 'min' as OptimizationType,
      objectiveCoefficients: [2, 3],
      constraints: [
        { coefficients: [1, 2], type: '>=' as ConstraintType, rhs: 4 },
        { coefficients: [2, 1], type: '>=' as ConstraintType, rhs: 4 },
      ],
      description: 'min z = 2x₁ + 3x₂; x₁ + 2x₂ ≥ 4; 2x₁ + x₂ ≥ 4',
    },
  ];

  const [currentExampleIndex, setCurrentExampleIndex] = useState<number>(0);

  const resetSolution = (): void => {
    setSolution(null);
    setError(null);
    setSteps([]);
  };

  const handleNumVariablesChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newNum = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
    setNumVariables(newNum);
    setObjectiveCoefficients(Array(newNum).fill(0));
    setConstraints(
      constraints.map(c => ({ ...c, coefficients: Array(newNum).fill(0) }))
    );
    resetSolution();
  };

  const handleNumConstraintsChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newNum = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
    setNumConstraints(newNum);
    const newConstraints = Array(newNum)
      .fill(null)
      .map((_, i) =>
        i < constraints.length
          ? constraints[i]
          : { coefficients: Array(numVariables).fill(0), type: '<=' as ConstraintType, rhs: 0 }
      );
    setConstraints(newConstraints);
    resetSolution();
  };

  const handleObjectiveCoefficientChange = (index: number, value: string): void => {
    const newCoefficients = [...objectiveCoefficients];
    newCoefficients[index] = parseFloat(value) || 0;
    setObjectiveCoefficients(newCoefficients);
  };

  const handleConstraintCoefficientChange = (
    constraintIndex: number,
    varIndex: number,
    value: string
  ): void => {
    const newConstraints = [...constraints];
    newConstraints[constraintIndex].coefficients[varIndex] = parseFloat(value) || 0;
    setConstraints(newConstraints);
  };

  const handleConstraintTypeChange = (
    constraintIndex: number,
    type: ConstraintType
  ): void => {
    const newConstraints = [...constraints];
    newConstraints[constraintIndex].type = type;
    setConstraints(newConstraints);
  };

  const handleConstraintRhsChange = (constraintIndex: number, value: string): void => {
    const newConstraints = [...constraints];
    newConstraints[constraintIndex].rhs = parseFloat(value) || 0;
    setConstraints(newConstraints);
  };


  const loadExample = (index: number): void => {
    const example = examples[index];
    setCurrentExampleIndex(index);
    setNumVariables(example.numVariables);
    setNumConstraints(example.numConstraints);
    setOptimizationType(example.optimizationType);
    setObjectiveCoefficients([...example.objectiveCoefficients]);
    setConstraints(example.constraints.map(c => ({ ...c, coefficients: [...c.coefficients] })));
    resetSolution();
  };

  const nextExample = (): void => {
    const nextIndex = (currentExampleIndex + 1) % examples.length;
    loadExample(nextIndex);
  };

  const formatTableau = (tableau: number[][], basis: number[]): string => {
    const header = ['Базис', 'z', ...Array(numVariables).fill(null).map((_, i) => `x${i + 1}`), 
                    'Доп.перем.', 'RHS'].join('\t');
    const rows = tableau.map((row, i) => {
      const basisVar = i === 0 ? 'z' : `x${basis[i - 1] + 1}`;
      return [basisVar, ...row.map(v => v.toFixed(3))].join('\t');
    });
    return header + '\n' + rows.join('\n');
  };

  const solve = (): void => {
    resetSolution();

    try {
      // Проверка на отрицательные правые части
      const hasNegativeRhs = constraints.some(c => c.rhs < 0);
      if (hasNegativeRhs) {
        setError('Все правые части ограничений должны быть неотрицательными');
        return;
      }

      const newSteps: Step[] = [];
      
      // Отладка: выводим загруженные ограничения
      console.log('=== Загруженные ограничения ===');
      console.log('numVariables:', numVariables);
      console.log('numConstraints:', numConstraints);
      console.log('Ограничения:', constraints);
      constraints.forEach((c, i) => {
        console.log(`  ${i+1}: ${c.coefficients.join(', ')} ${c.type} ${c.rhs}`);
      });
      
      // Определяем количество дополнительных переменных
      let numSlack = 0;
      let numSurplus = 0;
      let numArtificial = 0;
      
      constraints.forEach(c => {
        if (c.type === '<=') numSlack++;
        if (c.type === '>=') {
          numSurplus++;
          numArtificial++;
        }
        if (c.type === '=') numArtificial++;
      });
      
      console.log('После подсчёта:');
      console.log('  numSlack:', numSlack);
      console.log('  numSurplus:', numSurplus);
      console.log('  numArtificial:', numArtificial);

      const totalVars = numVariables + numSlack + numSurplus + numArtificial;
      
      // Создаем начальную симплекс-таблицу
      const numRows = numConstraints + 1; // +1 для строки целевой функции
      const numCols = totalVars + 2; // +2 для z и RHS
      
      let tableau: number[][] = Array(numRows).fill(null).map(() => Array(numCols).fill(0));
      
      // Заполняем строку целевой функции
      const M = 10000; // Большое M (разумное значение для численной стабильности)
      
      // Коэффициенты оригинальной целевой функции
      for (let j = 0; j < numVariables; j++) {
        tableau[0][j + 1] = optimizationType === 'max' 
          ? -objectiveCoefficients[j] 
          : objectiveCoefficients[j];
      }
      tableau[0][0] = 1; // Коэффициент для z

      // Заполняем ограничения и добавляем дополнительные переменные
      let slackIndex = numVariables;
      let surplusIndex = numVariables + numSlack;
      let artificialIndex = numVariables + numSlack + numSurplus;
      const basis: number[] = [];
      const artificialVars: number[] = []; // Отслеживаем искусственные переменные
      
      for (let i = 0; i < numConstraints; i++) {
        // Коэффициенты переменных
        for (let j = 0; j < numVariables; j++) {
          tableau[i + 1][j + 1] = constraints[i].coefficients[j];
        }
        
        // Правая часть
        tableau[i + 1][numCols - 1] = constraints[i].rhs;
        
        // Дополнительные переменные
        if (constraints[i].type === '<=') {
          tableau[i + 1][slackIndex + 1] = 1;
          basis.push(slackIndex);
          slackIndex++;
        } else if (constraints[i].type === '>=') {
          tableau[i + 1][surplusIndex + 1] = -1;
          tableau[i + 1][artificialIndex + 1] = 1;
          basis.push(artificialIndex);
          artificialVars.push(artificialIndex);
          surplusIndex++;
          artificialIndex++;
        } else { // '='
          tableau[i + 1][artificialIndex + 1] = 1;
          basis.push(artificialIndex);
          artificialVars.push(artificialIndex);
          artificialIndex++;
        }
      }

      // Корректировка строки целевой функции для искусственных переменных (M-метод)
      // Цель: обнулить коэффициенты искусственных переменных в строке z (так как они в базисе)
      for (const artVar of artificialVars) {
        // Находим строку, где эта искусственная переменная в базисе
        const rowIndex = basis.findIndex(b => b === artVar) + 1;
        
        // Для максимизации: вычитаем M * (строку ограничения)
        // Для минимизации: добавляем M * (строку ограничения)
        if (optimizationType === 'max') {
          for (let j = 0; j < numCols; j++) {
            tableau[0][j] -= M * tableau[rowIndex][j];
          }
        } else {
          for (let j = 0; j < numCols; j++) {
            tableau[0][j] += M * tableau[rowIndex][j];
          }
        }
      }

      newSteps.push({
        title: 'Начальная симплекс-таблица с искусственными переменными',
        tableau: tableau.map(row => [...row]),
        basis: [...basis],
        description: `Добавлено ${numArtificial} искусственных переменных с коэффициентом M`
      });

      // Симплекс-метод
      let iteration = 0;
      const maxIterations = 100;
      
      while (iteration < maxIterations) {
        iteration++;
        
        // Находим входящую переменную (наиболее отрицательный элемент в строке z)
        let pivotCol = -1;
        let minValue = -0.001; // Порог для определения оптимальности (увеличен для численной стабильности)
        
        for (let j = 1; j < numCols - 1; j++) {
          if (tableau[0][j] < minValue) {
            minValue = tableau[0][j];
            pivotCol = j;
          }
        }
        
        if (pivotCol === -1) {
          // Оптимальное решение найдено
          break;
        }
        
        // Находим исходящую переменную (минимальное отношение)
        let pivotRow = -1;
        let minRatio = Infinity;
        
        for (let i = 1; i < numRows; i++) {
          if (tableau[i][pivotCol] > 0.001) { // увеличенный порог
            const ratio = tableau[i][numCols - 1] / tableau[i][pivotCol];
            if (ratio >= -0.001 && ratio < minRatio) { // допускаем малые отрицательные из-за округления
              minRatio = ratio;
              pivotRow = i;
            }
          }
        }
        
        if (pivotRow === -1) {
          setError('Задача не ограничена');
          return;
        }
        
        const pivotElement = tableau[pivotRow][pivotCol];
        
        // Обновляем базис
        basis[pivotRow - 1] = pivotCol - 1;
        
        newSteps.push({
          title: `Итерация ${iteration}: Ведущий элемент в строке ${pivotRow}, столбце ${pivotCol}`,
          tableau: tableau.map(row => [...row]),
          basis: [...basis],
          description: `Входящая переменная: x${pivotCol}, исходящая: x${basis[pivotRow - 1] + 1}`
        });
        
        // Делаем ведущий элемент равным 1
        for (let j = 0; j < numCols; j++) {
          tableau[pivotRow][j] /= pivotElement;
        }
        
        // Обнуляем остальные элементы столбца
        for (let i = 0; i < numRows; i++) {
          if (i !== pivotRow) {
            const factor = tableau[i][pivotCol];
            for (let j = 0; j < numCols; j++) {
              tableau[i][j] -= factor * tableau[pivotRow][j];
            }
          }
        }
      }
      
      if (iteration >= maxIterations) {
        setError('Превышено максимальное количество итераций');
        return;
      }

      // Проверяем, остались ли искусственные переменные с ненулевым значением в базисе
      console.log('=== Проверка искусственных переменных ===');
      console.log('Базис:', basis);
      console.log('numVariables:', numVariables, 'numSlack:', numSlack, 'numSurplus:', numSurplus);
      console.log('Граница искусственных:', numVariables + numSlack + numSurplus);
      
      for (let i = 0; i < numConstraints; i++) {
        const varIndex = basis[i];
        const value = tableau[i + 1][numCols - 1];
        console.log(`Строка ${i}: переменная ${varIndex}, значение ${value}`);
        
        // Проверяем, является ли переменная искусственной
        if (varIndex >= numVariables + numSlack + numSurplus) {
          console.log(`  -> Искусственная! Проверяем значение: ${Math.abs(value)} > 0.01?`);
          if (Math.abs(value) > 0.01) {
            // Искусственная переменная имеет ненулевое значение
            setError('Задача не имеет допустимого решения (искусственные переменные в базисе)');
            return;
          }
        }
      }
      console.log('=== Искусственные переменные обнулены, решение найдено ===');

      // Извлекаем решение
      const variables = Array(numVariables).fill(0);
      for (let i = 0; i < basis.length; i++) {
        if (basis[i] < numVariables) {
          variables[basis[i]] = tableau[i + 1][numCols - 1];
        }
      }

      const objectiveValue = optimizationType === 'max' 
        ? -tableau[0][numCols - 1] 
        : tableau[0][numCols - 1];

      newSteps.push({
        title: 'Оптимальное решение найдено',
        tableau: tableau.map(row => [...row]),
        basis: [...basis],
        description: 'Все коэффициенты в строке целевой функции неотрицательны'
      });

      setSteps(newSteps);
      setSolution({
        variables,
        objectiveValue,
        isOptimal: true,
        isFeasible: true,
      });
      
    } catch (err) {
      setError(`Ошибка при решении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };

  return (
    <div className="container">
      <h1>Метод искусственного базиса (M-метод)</h1>
      <p className="subtitle">Решение задач линейного программирования</p>

      <div className="settings-grid">
        <div className="setting-group">
          <label>Количество переменных:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={numVariables}
            onChange={handleNumVariablesChange}
          />
        </div>

        <div className="setting-group">
          <label>Количество ограничений:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={numConstraints}
            onChange={handleNumConstraintsChange}
          />
        </div>

        <div className="setting-group">
          <label>Тип оптимизации:</label>
          <select
            value={optimizationType}
            onChange={(e) => setOptimizationType(e.target.value as OptimizationType)}
          >
            <option value="max">Максимизация</option>
            <option value="min">Минимизация</option>
          </select>
        </div>
      </div>

      <div className="objective-section">
        <h3>Целевая функция: {optimizationType === 'max' ? 'max' : 'min'} z =</h3>
        <div className="objective-inputs">
          {objectiveCoefficients.map((coef, i) => (
            <div key={i} className="term">
              <input
                type="number"
                step="0.1"
                value={coef}
                onChange={(e) => handleObjectiveCoefficientChange(i, e.target.value)}
              />
              <span>x<sub>{i + 1}</sub></span>
              {i < objectiveCoefficients.length - 1 && <span className="operator">+</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="constraints-section">
        <h3>Ограничения:</h3>
        {constraints.map((constraint, cIndex) => (
          <div key={cIndex} className="constraint-row">
            <span className="constraint-label">{cIndex + 1}.</span>
            <div className="constraint-inputs">
              {constraint.coefficients.map((coef, vIndex) => (
                <div key={vIndex} className="term">
                  <input
                    type="number"
                    step="0.1"
                    value={coef}
                    onChange={(e) =>
                      handleConstraintCoefficientChange(cIndex, vIndex, e.target.value)
                    }
                  />
                  <span>x<sub>{vIndex + 1}</sub></span>
                  {vIndex < constraint.coefficients.length - 1 && (
                    <span className="operator">+</span>
                  )}
                </div>
              ))}
            </div>
            <select
              value={constraint.type}
              onChange={(e) =>
                handleConstraintTypeChange(cIndex, e.target.value as ConstraintType)
              }
              className="constraint-type"
            >
              <option value="<=">≤</option>
              <option value=">=">≥</option>
              <option value="=">=</option>
            </select>
            <input
              type="number"
              step="0.1"
              value={constraint.rhs}
              onChange={(e) => handleConstraintRhsChange(cIndex, e.target.value)}
              className="rhs-input"
            />
          </div>
        ))}
        <p className="constraint-note">Все переменные x<sub>i</sub> ≥ 0</p>
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

      <div className="buttons">
        <button className="btn-primary" onClick={solve}>
          Решить задачу
        </button>
        <button className="btn-secondary" onClick={nextExample}>
          Следующий пример
        </button>
        <button className="btn-clear" onClick={() => loadExample(0)}>
          Сбросить
        </button>
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      {solution && (
        <div className="solution">
          <h3>✓ Оптимальное решение:</h3>
          <div className="solution-grid">
            {solution.variables.map((val, i) => (
              <div key={i} className="solution-item">
                x<sub>{i + 1}</sub> = {val.toFixed(6)}
              </div>
            ))}
          </div>
          <div className="objective-result">
            Значение целевой функции: <strong>{solution.objectiveValue.toFixed(6)}</strong>
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <div className="steps">
          <h3>Шаги решения:</h3>
          {steps.map((step, i) => (
            <div key={i} className="step">
              <div className="step-title">{step.title}</div>
              {step.description && (
                <div className="step-description">{step.description}</div>
              )}
              <div className="step-tableau">
                {formatTableau(step.tableau, step.basis)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Lab3;