import type React from "react";
import { useState } from "react";
import "./Lab4.css";

type Matrix = number[][];
type Potentials = { u: number[]; v: number[] };
type Step = {
  plan: Matrix;
  potentials: Potentials;
  deltas: Matrix;
  description: string;
  enteringCell?: [number, number];
  cycle?: [number, number][];
  theta?: number;
  totalCost: number;
};

const EXAMPLES: { name: string; supply: number[]; demand: number[]; costs: Matrix }[] = [
  {
    name: "Пример из задания (4x5)",
    supply: [15, 15, 15, 15],
    demand: [11, 11, 11, 11, 16],
    costs: [
      [17, 20, 29, 26, 25],
      [3, 4, 5, 15, 24],
      [19, 2, 22, 4, 13],
      [20, 27, 1, 17, 19],
    ],
  },
  {
    name: "Пример ручного ввода",
    supply: [9, 11, 14, 16],
    demand: [8, 9, 13, 8, 12],
    costs: [
      [5, 15, 3, 6, 10],
      [3, 8, 13, 27, 12],
      [30, 9, 5, 24, 25],
      [8, 26, 7, 28, 9],
    ],
  },
  {
    name: "Пример 3x3",
    supply: [100, 200, 150],
    demand: [120, 180, 150],
    costs: [
      [3, 5, 7],
      [2, 4, 6],
      [5, 3, 8],
    ],
  },
  {
    name: "Пример 3x4",
    supply: [120, 80, 100],
    demand: [60, 70, 90, 80],
    costs: [
      [2, 3, 4, 5],
      [6, 4, 3, 2],
      [1, 5, 2, 3],
    ],
  },
];

const Lab4: React.FC = () => {
  const [supply, setSupply] = useState<number[]>([]);
  const [demand, setDemand] = useState<number[]>([]);
  const [costs, setCosts] = useState<Matrix>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(5);
  const [showInputs, setShowInputs] = useState<boolean>(false);
  const [showPlanInput, setShowPlanInput] = useState<boolean>(false);
  const [inputCosts, setInputCosts] = useState<string[][]>([]);
  const [inputSupply, setInputSupply] = useState<string[]>([]);
  const [inputDemand, setInputDemand] = useState<string[]>([]);
  const [inputPlan, setInputPlan] = useState<string[][]>([]);
  const [isBalanced, setIsBalanced] = useState<boolean>(true);

  const createEmptyInputs = () => {
    const r = Math.max(1, Math.min(10, rows));
    const c = Math.max(1, Math.min(10, cols));
    setRows(r);
    setCols(c);

    setInputCosts(
      Array(r)
        .fill(null)
        .map(() => Array(c).fill("0")),
    );
    setInputSupply(Array(r).fill("0"));
    setInputDemand(Array(c).fill("0"));
    setInputPlan(
      Array(r)
        .fill(null)
        .map(() => Array(c).fill("0")),
    );
    setShowInputs(true);
    setShowPlanInput(false);
    resetSolution();
  };

  const loadExample = (example: (typeof EXAMPLES)[0]) => {
    setRows(example.supply.length);
    setCols(example.demand.length);
    setInputCosts(example.costs.map((row) => row.map((v) => v.toString())));
    setInputSupply(example.supply.map((v) => v.toString()));
    setInputDemand(example.demand.map((v) => v.toString()));
    setInputPlan(
      Array(example.supply.length)
        .fill(null)
        .map(() => Array(example.demand.length).fill("0")),
    );
    setShowInputs(true);
    setShowPlanInput(false);
    resetSolution();
  };

  const updateCostCell = (i: number, j: number, value: string) => {
    const newCosts = inputCosts.map((row, ri) => (ri === i ? row.map((cell, cj) => (cj === j ? value : cell)) : row));
    setInputCosts(newCosts);
  };

  const updateSupply = (i: number, value: string) => {
    const newSupply = [...inputSupply];
    newSupply[i] = value;
    setInputSupply(newSupply);
  };

  const updateDemand = (j: number, value: string) => {
    const newDemand = [...inputDemand];
    newDemand[j] = value;
    setInputDemand(newDemand);
  };

  const updatePlanCell = (i: number, j: number, value: string) => {
    const newPlan = inputPlan.map((row, ri) => (ri === i ? row.map((cell, cj) => (cj === j ? value : cell)) : row));
    setInputPlan(newPlan);
  };

  const parseInputs = () => {
    const s = inputSupply.map((v) => {
      const num = parseFloat(v);
      return isNaN(num) ? 0 : num;
    });
    const d = inputDemand.map((v) => {
      const num = parseFloat(v);
      return isNaN(num) ? 0 : num;
    });
    const c = inputCosts.map((row) =>
      row.map((v) => {
        const num = parseFloat(v);
        return isNaN(num) ? 0 : num;
      }),
    );
    return { supply: s, demand: d, costs: c };
  };

  const parsePlan = (): Matrix => {
    return inputPlan.map((row) =>
      row.map((v) => {
        const num = parseFloat(v);
        return isNaN(num) ? 0 : num;
      }),
    );
  };

  const checkBalance = (s: number[], d: number[]) => {
    const sumS = s.reduce((a, b) => a + b, 0);
    const sumD = d.reduce((a, b) => a + b, 0);
    return Math.abs(sumS - sumD) < 0.001;
  };

  const validatePlan = (p: Matrix, s: number[], d: number[]): string | null => {
    for (let i = 0; i < p.length; i++) {
      const rowSum = p[i].reduce((a, b) => a + b, 0);
      if (Math.abs(rowSum - s[i]) > 0.001) {
        return `Нарушен баланс в строке ${i + 1}: сумма ${rowSum} ≠ запасу ${s[i]}`;
      }
    }

    for (let j = 0; j < p[0].length; j++) {
      let colSum = 0;
      for (let i = 0; i < p.length; i++) {
        colSum += p[i][j];
      }
      if (Math.abs(colSum - d[j]) > 0.001) {
        return `Нарушен баланс в столбце ${j + 1}: сумма ${colSum} ≠ потребности ${d[j]}`;
      }
    }

    return null;
  };

  const loadProblem = () => {
    const { supply: s, demand: d, costs: c } = parseInputs();
    const balanced = checkBalance(s, d);
    setIsBalanced(balanced);
    setSupply(s);
    setDemand(d);
    setCosts(c);
    setShowPlanInput(true);
  };

  const startSolving = () => {
    const p = parsePlan();
    const error = validatePlan(p, supply, demand);

    if (error) {
      alert(error);
      return;
    }

    buildAllSteps(p);
  };

  const calculatePotentials = (c: Matrix, p: Matrix): Potentials => {
    const m = c.length;
    const n = c[0].length;
    const u = Array(m).fill(null);
    const v = Array(n).fill(null);

    u[0] = 0;

    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (p[i][j] > 0) {
            if (u[i] !== null && v[j] === null) {
              v[j] = c[i][j] - u[i];
              changed = true;
            } else if (v[j] !== null && u[i] === null) {
              u[i] = c[i][j] - v[j];
              changed = true;
            }
          }
        }
      }
    }

    for (let i = 0; i < m; i++) if (u[i] === null) u[i] = 0;
    for (let j = 0; j < n; j++) if (v[j] === null) v[j] = 0;

    return { u, v };
  };

  const calculateDeltas = (c: Matrix, u: number[], v: number[]): Matrix => {
    return c.map((row, i) => row.map((cost, j) => u[i] + v[j] - cost));
  };

  const findEnteringCell = (dlt: Matrix): [number, number] | null => {
    let maxDelta = 0;
    let cell: [number, number] | null = null;

    for (let i = 0; i < dlt.length; i++) {
      for (let j = 0; j < dlt[0].length; j++) {
        if (dlt[i][j] > maxDelta) {
          maxDelta = dlt[i][j];
          cell = [i, j];
        }
      }
    }
    return cell;
  };

  const findCycle = (plan: Matrix, startI: number, startJ: number): [number, number][] => {
    const m = plan.length;
    const n = plan[0].length;
    const path: [number, number][] = [[startI, startJ]];

    const dfs = (
      current: [number, number],
      target: [number, number],
      visited: Set<string>,
      direction: "row" | "col",
    ): boolean => {
      const [ci, cj] = current;

      if (ci === target[0] && cj === target[1] && path.length > 1) {
        return true;
      }

      const key = `${ci},${cj},${direction}`;
      if (visited.has(key)) return false;
      visited.add(key);

      if (direction === "row") {
        for (let j = 0; j < n; j++) {
          if (j !== cj && (plan[ci][j] > 0 || (ci === target[0] && j === target[1]))) {
            path.push([ci, j]);
            if (dfs([ci, j], target, visited, "col")) return true;
            path.pop();
          }
        }
      } else {
        for (let i = 0; i < m; i++) {
          if (i !== ci && (plan[i][cj] > 0 || (i === target[0] && cj === target[1]))) {
            path.push([i, cj]);
            if (dfs([i, cj], target, visited, "row")) return true;
            path.pop();
          }
        }
      }

      return false;
    };

    for (let j = 0; j < n; j++) {
      if (plan[startI][j] > 0) {
        path.push([startI, j]);
        if (dfs([startI, j], [startI, startJ], new Set(), "col")) {
          return path;
        }
        path.pop();
      }
    }

    return [];
  };

  const calculateTotalCost = (p: Matrix, c: Matrix): number => {
    let total = 0;
    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < p[0].length; j++) {
        total += p[i][j] * c[i][j];
      }
    }
    return total;
  };

  const buildAllSteps = (initialPlan: Matrix) => {
    const allSteps: Step[] = [];
    let stepNum = 1;
    let currentPlan = initialPlan.map((row) => [...row]);

    const firstStep: Step = {
      plan: currentPlan,
      potentials: calculatePotentials(costs, currentPlan),
      deltas: calculateDeltas(
        costs,
        calculatePotentials(costs, currentPlan).u,
        calculatePotentials(costs, currentPlan).v,
      ),
      description: "Начальный план введён пользователем. Проверяем оптимальность.",
      totalCost: calculateTotalCost(currentPlan, costs),
    };
    allSteps.push(firstStep);

    while (true) {
      const { u, v } = calculatePotentials(costs, currentPlan);
      const dlt = calculateDeltas(costs, u, v);
      const entering = findEnteringCell(dlt);

      if (!entering) break;

      const [ei, ej] = entering;
      const cycle = findCycle(currentPlan, ei, ej);

      if (cycle.length === 0) break;

      let minTheta = Infinity;
      for (let k = 1; k < cycle.length; k += 2) {
        const [i, j] = cycle[k];
        if (currentPlan[i][j] < minTheta) {
          minTheta = currentPlan[i][j];
        }
      }

      const step: Step = {
        plan: currentPlan.map((row) => [...row]),
        potentials: { u, v },
        deltas: dlt,
        enteringCell: entering,
        cycle,
        theta: minTheta,
        description: `Шаг ${stepNum}: Вводим в базис клетку [${ei + 1}, ${ej + 1}] (максимальная оценка Δ = ${formatNumber(dlt[ei][ej])}). θ = ${formatNumber(minTheta)}.`,
        totalCost: calculateTotalCost(currentPlan, costs),
      };
      allSteps.push(step);

      const newPlan = currentPlan.map((row) => [...row]);
      for (let k = 0; k < cycle.length; k++) {
        const [i, j] = cycle[k];
        if (k % 2 === 0) {
          newPlan[i][j] += minTheta;
        } else {
          newPlan[i][j] -= minTheta;
        }
      }

      currentPlan = newPlan;
      stepNum++;

      if (stepNum > 20) break;
    }

    const finalStep: Step = {
      plan: currentPlan,
      potentials: calculatePotentials(costs, currentPlan),
      deltas: calculateDeltas(
        costs,
        calculatePotentials(costs, currentPlan).u,
        calculatePotentials(costs, currentPlan).v,
      ),
      description: `Итоговое решение. Общая стоимость: ${formatNumber(calculateTotalCost(currentPlan, costs))}`,
      totalCost: calculateTotalCost(currentPlan, costs),
    };
    allSteps.push(finalStep);

    setSteps(allSteps);
    setCurrentStep(0);
  };

  const resetSolution = () => {
    setSteps([]);
    setCurrentStep(0);
    setShowPlanInput(false);
  };

  const resetAll = () => {
    resetSolution();
    setShowInputs(false);
    setInputCosts([]);
    setInputSupply([]);
    setInputDemand([]);
    setInputPlan([]);
    setSupply([]);
    setDemand([]);
    setCosts([]);
  };

  const formatNumber = (num: number): string => {
    if (Math.abs(num) < 0.001) return "0";
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderDataInput = () => (
    <div className="input-section">
      <h3>Введите исходные данные задачи</h3>

      <div className="supply-inputs">
        <h4>Запасы поставщиков (A):</h4>
        <div className="vector-inputs">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="vector-cell">
              <label>A{i + 1}:</label>
              <input
                type="number"
                value={inputSupply[i] ?? "0"}
                onChange={(e) => updateSupply(i, e.target.value)}
                min="0"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="costs-inputs">
        <h4>Матрица стоимостей перевозок C[i][j]:</h4>
        <table className="input-table">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: cols }, (_, j) => (
                <th key={j}>B{j + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                <td className="row-label">A{i + 1}</td>
                {Array.from({ length: cols }, (_, j) => (
                  <td key={j}>
                    <input
                      type="number"
                      value={inputCosts[i]?.[j] ?? "0"}
                      onChange={(e) => updateCostCell(i, j, e.target.value)}
                      min="0"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="demand-inputs">
        <h4>Потребности потребителей (B):</h4>
        <div className="vector-inputs">
          {Array.from({ length: cols }, (_, j) => (
            <div key={j} className="vector-cell">
              <label>B{j + 1}:</label>
              <input
                type="number"
                value={inputDemand[j] ?? "0"}
                onChange={(e) => updateDemand(j, e.target.value)}
                min="0"
              />
            </div>
          ))}
        </div>
      </div>

      <button className="primary" onClick={loadProblem}>
        Перейти к вводу плана
      </button>
    </div>
  );

  const renderPlanInput = () => (
    <div className="plan-input-section">
      <h3>Введите начальный опорный план</h3>
      <p className="hint">
        Введите объёмы перевозок X[i][j]. Сумма по строкам должна равняться запасам, сумма по столбцам — потребностям.
      </p>

      <table className="plan-input-table">
        <thead>
          <tr>
            <th></th>
            {demand.map((d, j) => (
              <th key={j}>
                B{j + 1}
                <br />
                <span className="sub">нужно: {formatNumber(d)}</span>
              </th>
            ))}
            <th>Запас</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td className="row-label">
                A{i + 1}
                <br />
                <span className="sub">есть: {formatNumber(supply[i])}</span>
              </td>
              {Array.from({ length: cols }, (_, j) => (
                <td key={j}>
                  <input
                    type="number"
                    value={inputPlan[i]?.[j] ?? "0"}
                    onChange={(e) => updatePlanCell(i, j, e.target.value)}
                    min="0"
                    step="any"
                  />
                </td>
              ))}
              <td className="supply-cell">{formatNumber(supply[i])}</td>
            </tr>
          ))}
          <tr>
            <td className="row-label">Потребность</td>
            {demand.map((d, j) => (
              <td key={j} className="demand-cell">
                {formatNumber(d)}
              </td>
            ))}
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="plan-buttons">
        <button className="secondary" onClick={() => setShowPlanInput(false)}>
          ← Назад к данным
        </button>
        <button className="primary" onClick={startSolving}>
          Начать решение методом потенциалов
        </button>
      </div>
    </div>
  );

  const renderExplanation = () => (
    <div className="explanation">
      <h4>Что такое улучшение плана?</h4>
      <p>
        <strong>Улучшение</strong> — это переход от текущего допустимого плана к новому плану с меньшей общей стоимостью
        перевозок. В методе потенциалов это делается путём ввода в базис (начало перевозок по новому маршруту) клетки с
        положительной оценкой Δ.
      </p>
      <p>
        <strong>Оценка Δ[i][j] = u[i] + v[j] - C[i][j]</strong> показывает, насколько изменится стоимость, если начать
        перевозить груз по этому маршруту. Если Δ {">"} 0, значит маршрут выгоден и его нужно ввести в план.
      </p>
      <p>
        <strong>Нужно ли улучшение?</strong> Да, если существует клетка с Δ {">"} 0. Когда все Δ ≤ 0, план оптимален.
      </p>
    </div>
  );

  const renderCurrentStep = () => {
    if (steps.length === 0) return null;
    const step = steps[currentStep];

    return (
      <div className="solution-section">
        <div className="step-header">
          <h3>Решение транспортной задачи</h3>
          <div className="step-counter">
            Шаг {currentStep + 1} из {steps.length}
          </div>
        </div>

        {!isBalanced && <div className="warning">Внимание: открытая транспортная задача (запасы ≠ потребности)!</div>}

        <div className="description">{step.description}</div>

        <table className="solution-table">
          <thead>
            <tr>
              <th></th>
              {demand.map((d, j) => (
                <th key={j}>
                  B{j + 1}
                  <br />
                  <span className="sub">{formatNumber(d)}</span>
                </th>
              ))}
              <th className="potential-col">u</th>
            </tr>
          </thead>
          <tbody>
            {step.plan.map((row, i) => (
              <tr key={i}>
                <td className="row-header">
                  A{i + 1}
                  <br />
                  <span className="sub">{formatNumber(supply[i])}</span>
                </td>
                {row.map((cell, j) => {
                  const isBasic = cell > 0.001;
                  const delta = step.deltas[i][j];
                  const isEntering = step.enteringCell && step.enteringCell[0] === i && step.enteringCell[1] === j;
                  const isInCycle = step.cycle?.some(([ci, cj]) => ci === i && cj === j);
                  const cycleIndex = step.cycle?.findIndex(([ci, cj]) => ci === i && cj === j) ?? -1;

                  return (
                    <td
                      key={j}
                      className={`plan-cell ${isBasic ? "basic" : ""} ${isEntering ? "entering" : ""} ${isInCycle ? "in-cycle" : ""}`}
                    >
                      <div className="cell-content">
                        <span className="cost">{formatNumber(costs[i][j])}</span>
                        <span className={`value ${isBasic ? "active" : ""}`}>{formatNumber(cell)}</span>
                        <span className={`delta ${delta > 0.001 ? "positive" : ""}`}>Δ={formatNumber(delta)}</span>
                        {isInCycle && cycleIndex !== -1 && <span className="cycle-num">{cycleIndex + 1}</span>}
                      </div>
                    </td>
                  );
                })}
                <td className="potential">{formatNumber(step.potentials.u[i])}</td>
              </tr>
            ))}
            <tr>
              <td className="potential-header">v</td>
              {step.potentials.v.map((v, j) => (
                <td key={j} className="potential">
                  {formatNumber(v)}
                </td>
              ))}
              <td></td>
            </tr>
          </tbody>
        </table>

        {step.cycle && (
          <div className="cycle-info">
            <h4>Цикл пересчёта:</h4>
            <div className="cycle-path">
              {step.cycle.map(([i, j], idx) => (
                <span key={idx} className="cycle-node">
                  [{i + 1},{j + 1}]{step.cycle && idx < step.cycle.length - 1 ? " → " : ""}
                </span>
              ))}
            </div>
            <p>
              По циклу: в клетки с чётными номерами (1, 3, 5...) <strong>добавляем</strong> θ ={" "}
              {formatNumber(step.theta || 0)}, в клетки с нечётными номерами (2, 4, 6...) <strong>вычитаем</strong> θ.
            </p>
          </div>
        )}

        <div className="total-cost">
          Текущая стоимость перевозок: <strong>{formatNumber(step.totalCost)}</strong>
        </div>

        <div className="legend">
          <div className="legend-item">
            <span className="box basic"></span> — базисная клетка (есть перевозка)
          </div>
          <div className="legend-item">
            <span className="box entering"></span> — вводимая в базис (макс. Δ)
          </div>
          <div className="legend-item">
            <span className="box in-cycle"></span> — участвует в цикле пересчёта
          </div>
          <div className="legend-item">
            <span className="delta-positive">Δ &gt; 0</span> — можно улучшить
          </div>
        </div>

        <div className="navigation">
          <button className="nav-btn" onClick={prevStep} disabled={currentStep === 0}>
            ← Предыдущий шаг
          </button>
          <button className="nav-btn" onClick={nextStep} disabled={currentStep === steps.length - 1}>
            Следующий шаг →
          </button>
        </div>

        {currentStep === steps.length - 1 && (
          <div className="final-result">
            <h3>Оптимальное решение найдено!</h3>
            <p>
              Минимальная стоимость перевозок: <strong>{formatNumber(step.totalCost)}</strong>
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lab4">
      <h2>Лабораторная 4: Транспортная задача (метод потенциалов)</h2>

      <div className="setup-panel">
        <div className="size-inputs">
          <label>
            Поставщиков:
            <input
              type="number"
              min={1}
              max={10}
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 4)}
              disabled={steps.length > 0}
            />
          </label>
          <label>
            Потребителей:
            <input
              type="number"
              min={1}
              max={10}
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value) || 5)}
              disabled={steps.length > 0}
            />
          </label>
        </div>

        <div className="main-buttons">
          <button className="primary" onClick={createEmptyInputs}>
            Создать задачу
          </button>
          <button className="secondary" onClick={resetAll}>
            Сбросить
          </button>
        </div>

        <div className="examples">
          <span>Примеры:</span>
          {EXAMPLES.map((ex, idx) => (
            <button key={idx} className="example-btn" onClick={() => loadExample(ex)}>
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {showInputs && !showPlanInput && steps.length === 0 && renderDataInput()}

      {showPlanInput && steps.length === 0 && renderPlanInput()}

      {steps.length > 0 && (
        <>
          {renderCurrentStep()}
          {renderExplanation()}
        </>
      )}
    </div>
  );
};

export default Lab4;
