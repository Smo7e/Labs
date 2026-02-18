import React, { useState } from "react";
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

const EXAMPLES: { name: string; supply: number[]; demand: number[]; costs: Matrix, plan?: Matrix }[] = [
  {
    name: "Из задания (4×5)",
    supply: [15, 15, 15, 15],
    demand: [11, 11, 11, 11, 16],
    costs: [
      [17, 20, 29, 26, 25],
      [3,   4,  5, 15, 24],
      [19,  2, 22,  4, 13],
      [20, 27,  1, 17, 19],
    ],
  },
  {
    name: "Пример 2 (4×5)",
    supply: [9, 11, 14, 16],
    demand: [8, 9, 13, 8, 12],
    costs: [
      [5, 15,  3,  6, 10],
      [3,  8, 13, 27, 12],
      [30, 9,  5, 24, 25],
      [8, 26,  7, 28,  9],
    ],
  },
  {
    name: "Пример 3×3",
    supply: [100, 200, 150],
    demand: [120, 180, 150],
    costs: [
      [3, 5, 7],
      [2, 4, 6],
      [5, 3, 8],
    ],
  },
  {
    name: "Пример 3×4",
    supply: [120, 80, 100],
    demand: [60, 70, 90, 80],
    costs: [
      [2, 3, 4, 5],
      [6, 4, 3, 2],
      [1, 5, 2, 3],
    ],
  },
  {
    name: "Пример из лекции 2",
    supply: [85, 112, 72, 120],
    demand: [75, 125, 64, 65, 60],
    costs: [
      [7, 1, 4, 5, 2],
      [13, 4, 7, 6, 3],
      [3, 8, 0, 18, 2],
      [9, 5, 3, 4, 7],
    ],
    plan: [
      [67, 18, 0, 0, 0],
      [0, 107, 0, 0, 5],
      [8, 0, 64, 0, 0],
      [0, 0, 0, 65, 55],
    ],
  },
];

/* ── Утилиты ─────────────────────────────────────────────────────── */

const fmt = (n: number): string => {
  if (Math.abs(n) < 0.0001) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};

const cloneMatrix = (m: Matrix): Matrix => m.map(r => [...r]);

const totalCost = (plan: Matrix, costs: Matrix): number =>
  plan.reduce((s, row, i) => s + row.reduce((ss, x, j) => ss + x * costs[i][j], 0), 0);

/* ── Северо-западный угол ────────────────────────────────────────── */

const northwestCorner = (supply: number[], demand: number[]): Matrix => {

  const m = supply.length, n = demand.length;
  const s = [...supply], d = [...demand];
  const plan: Matrix = Array.from({ length: m }, () => Array(n).fill(0));
  let i = 0, j = 0;
  while (i < m && j < n) {
    const x = Math.min(s[i], d[j]);
    plan[i][j] = x;
    s[i] -= x;
    d[j] -= x;
    if (s[i] < 1e-9 && d[j] < 1e-9) {
      i++; j++;
    } else if (s[i] < 1e-9) {
      i++;
    } else {
      j++;
    }
  }
  console.log(plan);
  
  return plan;
};

/* ── Потенциалы ─────────────────────────────────────────────────── */

const calcPotentials = (costs: Matrix, plan: Matrix): Potentials => {
  const m = costs.length, n = costs[0].length;
  const u: (number | null)[] = Array(m).fill(null);
  const v: (number | null)[] = Array(n).fill(null);
  u[0] = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        if (plan[i][j] > 1e-9) {
          if (u[i] !== null && v[j] === null) { v[j] = costs[i][j] - u[i]!; changed = true; }
          else if (v[j] !== null && u[i] === null) { u[i] = costs[i][j] - v[j]!; changed = true; }
        }
  }
  return { u: u.map(x => x ?? 0), v: v.map(x => x ?? 0) };
};

const calcDeltas = (costs: Matrix, u: number[], v: number[]): Matrix =>
  costs.map((row, i) => row.map((c, j) => u[i] + v[j] - c));

const findEntering = (deltas: Matrix, plan: Matrix): [number, number] | null => {
  let best = 1e-9, cell: [number, number] | null = null;
  for (let i = 0; i < deltas.length; i++)
    for (let j = 0; j < deltas[0].length; j++)
      if (plan[i][j] < 1e-9 && deltas[i][j] > best) {
        best = deltas[i][j];
        cell = [i, j];
      }
  return cell;
};

/* ── Поиск цикла (исправленный) ──────────────────────────────────
 *
 * Критическое исправление оригинальной версии:
 * Стартовая клетка НЕ добавляется повторно в конец пути.
 * Цикл возвращает ровно N клеток без дублирования.
 *
 * Алгоритм:
 *  - начинаем с entering-клетки [eR, eC] (она не в базисе)
 *  - чередуем ходы: по строке → по столбцу → по строке → ...
 *  - промежуточные клетки берём только из базиса (plan > 0)
 *  - цикл закрывается, когда можем вернуться к [eR, eC]
 * ───────────────────────────────────────────────────────────────── */

const findCycle = (plan: Matrix, eR: number, eC: number): [number, number][] => {
  const m = plan.length, n = plan[0].length;
  const path: [number, number][] = [[eR, eC]];
  const used = new Set<string>([`${eR},${eC}`]);

  // byRow=true → следующий ход меняет столбец (движение по строке)
  // byRow=false → следующий ход меняет строку (движение по столбцу)
  const dfs = (byRow: boolean): boolean => {
    const [r, c] = path[path.length - 1];

    if (byRow) {
      // Ищем клетку в той же строке r
      for (let j = 0; j < n; j++) {
        if (j === c) continue;
        // Можно ли замкнуть цикл? Вернуться к eR,eC по той же строке r
        if (r === eR && j === eC && path.length >= 4) return true;
        const key = `${r},${j}`;
        if (used.has(key)) continue;
        if (plan[r][j] < 1e-9) continue; // только базисные клетки
        used.add(key);
        path.push([r, j]);
        if (dfs(false)) return true;
        path.pop();
        used.delete(key);
      }
    } else {
      // Ищем клетку в том же столбце c
      for (let i = 0; i < m; i++) {
        if (i === r) continue;
        // Можно ли замкнуть цикл? Вернуться к eR,eC по тому же столбцу c
        if (i === eR && c === eC && path.length >= 4) return true;
        const key = `${i},${c}`;
        if (used.has(key)) continue;
        if (plan[i][c] < 1e-9) continue; // только базисные клетки
        used.add(key);
        path.push([i, c]);
        if (dfs(true)) return true;
        path.pop();
        used.delete(key);
      }
    }
    return false;
  };

  // Пробуем оба начальных направления
  if (dfs(false)) return path; // первый ход — по столбцу
  if (dfs(true))  return path; // первый ход — по строке
  return [];
};

/* ── Построение всех шагов ──────────────────────────────────────── */

const buildAllSteps = (initialPlan: Matrix, costs: Matrix): Step[] => {
  const steps: Step[] = [];
  let plan = cloneMatrix(initialPlan);

  const makeStep = (desc: string, extra?: Partial<Step>): Step => {
    const { u, v } = calcPotentials(costs, plan);
    return {
      plan: cloneMatrix(plan),
      potentials: { u, v },
      deltas: calcDeltas(costs, u, v),
      totalCost: totalCost(plan, costs),
      description: desc,
      ...extra,
    };
  };

  steps.push(makeStep("Начальный опорный план (метод северо-западного угла). Проверяем оптимальность."));

  for (let iter = 1; iter <= 50; iter++) {
    const { u, v } = calcPotentials(costs, plan);
    const deltas = calcDeltas(costs, u, v);
    const entering = findEntering(deltas, plan);
    if (!entering) break;

    const [eR, eC] = entering;
    const cycle = findCycle(plan, eR, eC);
    if (cycle.length < 4) {
      steps.push(makeStep(`Шаг ${iter}: не удалось найти цикл — задача вырождена.`));
      break;
    }

    // theta = минимум среди клеток с нечётными индексами (они уменьшаются)
    let theta = Infinity;
    for (let k = 1; k < cycle.length; k += 2) {
      const [i, j] = cycle[k];
      if (plan[i][j] < theta) theta = plan[i][j];
    }

    steps.push(makeStep(
      `Шаг ${iter}: вводим клетку [${eR+1},${eC+1}] (Δ = ${fmt(deltas[eR][eC])}), θ = ${fmt(theta)}.`,
      { enteringCell: entering, cycle, theta, deltas, potentials: { u, v } },
    ));

    // Применяем цикл: чётные индексы +theta, нечётные -theta
    const newPlan = cloneMatrix(plan);
    for (let k = 0; k < cycle.length; k++) {
      const [i, j] = cycle[k];
      newPlan[i][j] += (k % 2 === 0) ? theta : -theta;
      if (newPlan[i][j] < 1e-9) newPlan[i][j] = 0;
    }
    plan = newPlan;
  }

  steps.push(makeStep(`Оптимальное решение. Стоимость: ${fmt(totalCost(plan, costs))}`));
  return steps;
};

/* ── Компонент ──────────────────────────────────────────────────── */

const Lab4: React.FC = () => {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(5);

  const [inputCosts,  setInputCosts]  = useState<string[][]>([]);
  const [inputSupply, setInputSupply] = useState<string[]>([]);
  const [inputDemand, setInputDemand] = useState<string[]>([]);
  const [selectedPlan, setPlan] = useState<Matrix | null>(null);

  const [supply, setSupply] = useState<number[]>([]);
  const [demand, setDemand] = useState<number[]>([]);
  const [costs,  setCosts]  = useState<Matrix>([]);

  const [showInputs, setShowInputs] = useState(false);
  const [steps,       setSteps]      = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isBalanced,  setIsBalanced]  = useState(true);

  /* helpers */
  const parseNum = (s: string) => { const n = parseFloat(s); return isNaN(n) ? 0 : n; };

  const createEmptyInputs = () => {
    const r = Math.max(2, Math.min(10, rows));
    const c = Math.max(2, Math.min(10, cols));
    setRows(r); setCols(c);
    setInputCosts(Array.from({length: r}, () => Array(c).fill("0")));
    setInputSupply(Array(r).fill("0"));
    setInputDemand(Array(c).fill("0"));
    setShowInputs(true);
    setSteps([]); setCurrentStep(0);
  };

  const loadExample = (ex: typeof EXAMPLES[0]) => {
    setRows(ex.supply.length); setCols(ex.demand.length);
    setInputCosts(ex.costs.map(r => r.map(String)));
    setInputSupply(ex.supply.map(String));
    setInputDemand(ex.demand.map(String));
    setPlan(ex.plan ? ex.plan : null);
    setShowInputs(true);
    setSteps([]); setCurrentStep(0);
  };

  const solve = () => {
    const s = inputSupply.map(parseNum);
    const d = inputDemand.map(parseNum);
    const c = inputCosts.map(r => r.map(parseNum));
    const sumS = s.reduce((a,b)=>a+b,0);
    const sumD = d.reduce((a,b)=>a+b,0);
    setIsBalanced(Math.abs(sumS - sumD) < 0.001);
    setSupply(s); setDemand(d); setCosts(c);
    // const initPlan = northwestCorner(s, d);
    const initPlan = selectedPlan ? selectedPlan : northwestCorner(s, d);
    const allSteps = buildAllSteps(initPlan, c);
    setSteps(allSteps);
    setCurrentStep(0);
  };

  const resetAll = () => {
    setSteps([]); setCurrentStep(0);
    setShowInputs(false);
    setInputCosts([]); setInputSupply([]); setInputDemand([]);
    setSupply([]); setDemand([]); setCosts([]);
  };

  /* ── Рендер ─────────────────────────────────────────────────── */

  const renderInput = () => (
    <div className="input-section">
      <h3>Исходные данные</h3>

      <div className="input-block">
        <h4>Запасы поставщиков:</h4>
        <div className="vector-inputs">
          {Array.from({length: rows}, (_, i) => (
            <div key={i} className="vector-cell">
              <label>A{i+1}</label>
              <input type="number" min="0"
                value={inputSupply[i] ?? "0"}
                onChange={e => { const a=[...inputSupply]; a[i]=e.target.value; setInputSupply(a); }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="input-block">
        <h4>Матрица стоимостей:</h4>
        <div className="table-wrap">
          <table className="input-table">
            <thead>
              <tr>
                <th/>
                {Array.from({length: cols}, (_, j) => <th key={j}>B{j+1}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({length: rows}, (_, i) => (
                <tr key={i}>
                  <td className="row-label">A{i+1}</td>
                  {Array.from({length: cols}, (_, j) => (
                    <td key={j}>
                      <input type="number" min="0"
                        value={inputCosts[i]?.[j] ?? "0"}
                        onChange={e => {
                          const nc = inputCosts.map((r,ri) => ri===i ? r.map((x,ci)=>ci===j?e.target.value:x) : r);
                          setInputCosts(nc);
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="input-block">
        <h4>Потребности потребителей:</h4>
        <div className="vector-inputs">
          {Array.from({length: cols}, (_, j) => (
            <div key={j} className="vector-cell">
              <label>B{j+1}</label>
              <input type="number" min="0"
                value={inputDemand[j] ?? "0"}
                onChange={e => { const a=[...inputDemand]; a[j]=e.target.value; setInputDemand(a); }}
              />
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={solve}>
        Решить (СЗУ + метод потенциалов)
      </button>
    </div>
  );

  const renderStep = () => {
    if (!steps.length) return null;
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
      <div className="solution-section">
        <div className="step-header">
          <h3>Метод потенциалов</h3>
          <div className="step-counter">Шаг {currentStep + 1} / {steps.length}</div>
        </div>

        {!isBalanced && (
          <div className="warning">⚠ Открытая задача (запасы ≠ потребности)</div>
        )}

        <div className="description">{step.description}</div>

        <div className="table-wrap">
          <table className="solution-table">
            <thead>
              <tr>
                <th/>
                {demand.map((d, j) => (
                  <th key={j}>B{j+1}<br/><span className="sub">{fmt(d)}</span></th>
                ))}
                <th className="potential-col">u</th>
              </tr>
            </thead>
            <tbody>
              {step.plan.map((row, i) => (
                <tr key={i}>
                  <td className="row-header">
                    A{i+1}<br/><span className="sub">{fmt(supply[i])}</span>
                  </td>
                  {row.map((cell, j) => {
                    const isBasic   = cell > 1e-4;
                    const delta     = step.deltas[i][j];
                    const entering  = step.enteringCell?.[0]===i && step.enteringCell?.[1]===j;
                    const cycleIdx  = step.cycle?.findIndex(([r,c])=>r===i&&c===j) ?? -1;
                    const inCycle   = cycleIdx >= 0;
                    const sign      = inCycle ? (cycleIdx%2===0 ? "+" : "−") : "";
                    return (
                      <td key={j} className={
                        `plan-cell${isBasic?" basic":""}${entering?" entering":""}${inCycle?" in-cycle":""}`
                      }>
                        <div className="cell-content">
                          <span className="cost">{fmt(costs[i][j])}</span>
                          <span className={`value${isBasic?" active":""}`}>{fmt(cell)}</span>
                          <span className={`delta${delta>1e-4?" positive":""}`}>Δ={fmt(delta)}</span>
                          {inCycle && <span className="cycle-sign">{sign}</span>}
                        </div>
                      </td>
                    );
                  })}
                  <td className="potential">{fmt(step.potentials.u[i])}</td>
                </tr>
              ))}
              <tr>
                <td className="potential-header">v</td>
                {step.potentials.v.map((v, j) => (
                  <td key={j} className="potential">{fmt(v)}</td>
                ))}
                <td/>
              </tr>
            </tbody>
          </table>
        </div>

        {step.cycle && step.cycle.length > 0 && (
          <div className="cycle-info">
            <strong>Цикл пересчёта:</strong>{" "}
            {step.cycle.map(([i,j], k) => (
              <span key={k} className={`cycle-node ${k%2===0?"plus":"minus"}`}>
                {k>0 && " → "}[{i+1},{j+1}]{k%2===0?" (+)":" (−)"}
              </span>
            ))}
            <span> → замкнуть</span>
            <br/>
            <span>θ = {fmt(step.theta ?? 0)}</span>
          </div>
        )}

        <div className="total-cost">
          Стоимость: <strong>{fmt(step.totalCost)}</strong>
        </div>

        <div className="navigation">
          <button className="nav-btn" onClick={() => setCurrentStep(s=>s-1)} disabled={currentStep===0}>
            ← Назад
          </button>
          <button className="nav-btn" onClick={() => setCurrentStep(s=>s+1)} disabled={isLast}>
            Далее →
          </button>
        </div>

        {isLast && (
          <div className="final-result">
            <h3>✓ Оптимальное решение найдено!</h3>
            <p>Минимальная стоимость: <strong>{fmt(step.totalCost)}</strong></p>
          </div>
        )}

        <div className="legend">
          <span><span className="box basic"/> базисная</span>
          <span><span className="box entering"/> вводимая</span>
          <span><span className="box in-cycle"/> в цикле</span>
          <span className="delta-positive">Δ&gt;0 — улучшить</span>
        </div>
      </div>
    );
  };

  return (
    <div className="lab4">
      <h2>Транспортная задача — метод потенциалов</h2>

      <div className="setup-panel">
        <div className="size-inputs">
          <label>
            Поставщиков:
            <input type="number" min={2} max={10} value={rows}
              disabled={steps.length > 0}
              onChange={e => setRows(parseInt(e.target.value)||4)}
            />
          </label>
          <label>
            Потребителей:
            <input type="number" min={2} max={10} value={cols}
              disabled={steps.length > 0}
              onChange={e => setCols(parseInt(e.target.value)||5)}
            />
          </label>
          <button className="btn-secondary" onClick={createEmptyInputs}>
            Создать задачу
          </button>
          <button className="btn-danger" onClick={resetAll}>
            Сбросить
          </button>
        </div>

        <div className="examples">
          <span className="examples-label">Примеры:</span>
          {EXAMPLES.map((ex, idx) => (
            <button key={idx} className="example-btn" onClick={() => loadExample(ex)}>
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {showInputs && !steps.length && renderInput()}
      {steps.length > 0 && renderStep()}
    </div>
  );
};

export default Lab4;