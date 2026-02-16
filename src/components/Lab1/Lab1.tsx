import type React from "react";
import { useState } from "react";
import "./Lab1.css";

type Matrix = number[][];
const EXAMPLES: { name: string; matrix: Matrix }[] = [
  {
    name: "Пример 2x3",
    matrix: [
      [3, -3, 3],
      [1, 2, -2],
    ],
  },
  {
    name: "Пример 3x3",
    matrix: [
      [2, -1, 3],
      [1, 4, -2],
      [3, 2, 1],
    ],
  },
  {
    name: "Пример 3x4",
    matrix: [
      [1, 2, -1, 2],
      [2, -1, 3, 1],
      [3, 1, 2, -1],
    ],
  },
];

const Lab1: React.FC = () => {
  const [matrix, setMatrix] = useState<Matrix>([]);
  const [variables, setVariables] = useState<string[]>([]);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [rows, setRows] = useState<number>(2);
  const [cols, setCols] = useState<number>(3);
  const [showInputs, setShowInputs] = useState<boolean>(false);
  const [inputValues, setInputValues] = useState<string[][]>([]);

  const createEmptyInputs = () => {
    const newInputs = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill("0"));
    setInputValues(newInputs);
    setShowInputs(true);
    setMatrix([]);
    setVariables([]);
    setOutputs([]);
    setHistory([]);
  };

  const loadExample = (exampleMatrix: Matrix) => {
    const m = exampleMatrix.length;
    const n = exampleMatrix[0].length;
    setRows(m);
    setCols(n);
    const newInputs = exampleMatrix.map((row) => row.map((val) => val.toString()));
    setInputValues(newInputs);
    setShowInputs(true);
    setMatrix([]);
    setVariables([]);
    setOutputs([]);
    setHistory([]);
  };

  const updateInputCell = (i: number, j: number, value: string) => {
    const newInputs = inputValues.map((row, ri) => (ri === i ? row.map((cell, cj) => (cj === j ? value : cell)) : row));
    setInputValues(newInputs);
  };

  const loadMatrix = () => {
    const newMatrix = inputValues.map((row) =>
      row.map((cell) => {
        const val = parseFloat(cell);
        return isNaN(val) ? 0 : val;
      }),
    );

    setMatrix(newMatrix);
    setVariables(Array.from({ length: cols }, (_, i) => `-X${i + 1}`));
    setOutputs(Array.from({ length: rows }, (_, i) => `Y${i + 1}`));
    setHistory(["Исходная таблица создана."]);
  };

  const reset = () => {
    setMatrix([]);
    setVariables([]);
    setOutputs([]);
    setHistory([]);
    setShowInputs(false);
    setInputValues([]);
  };

  const formatNumber = (num: number) => {
    if (Math.abs(num) < 1e-12) return "0";
    const rounded = Math.round(num * 1000) / 1000;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(3);
  };

  const performJordanStep = (r: number, s: number) => {
    const pivot = matrix[r][s];
    if (Math.abs(pivot) < 1e-10) {
      alert("Разрешающий элемент не может быть нулём!");
      return;
    }

    const rowsCount = matrix.length;
    const colsCount = matrix[0].length;
    const newMatrix: Matrix = Array.from({ length: rowsCount }, () => Array(colsCount).fill(0));

    for (let j = 0; j < colsCount; j++) {
      newMatrix[r][j] = matrix[r][j] / pivot;
    }

    for (let i = 0; i < rowsCount; i++) {
      if (i !== r) {
        newMatrix[i][s] = -matrix[i][s] / pivot;
      }
    }

    for (let i = 0; i < rowsCount; i++) {
      for (let j = 0; j < colsCount; j++) {
        if (i !== r && j !== s) {
          newMatrix[i][j] = matrix[i][j] - (matrix[i][s] * matrix[r][j]) / pivot;
        }
      }
    }

    newMatrix[r][s] = 1 / pivot;

    const newVars = [...variables];
    const newOuts = [...outputs];
    const oldVar = newVars[s];
    const oldOut = newOuts[r];

    newVars[s] = `-${oldOut}`;
    newOuts[r] = `-${oldVar}`;

    setMatrix(newMatrix);
    setVariables(newVars);
    setOutputs(newOuts);
    setHistory([
      ...history,
      `Шаг: a[${r + 1},${s + 1}] = ${formatNumber(pivot)}`,
      `Переменная ${oldVar} заменена на ${newOuts[r]}`,
    ]);
  };

  const handleCellClick = (row: number, col: number) => {
    performJordanStep(row, col);
  };

  const formatVarName = (name: string) => name.replace(/^-/, "");

  const renderInputTable = () => (
    <div className="matrix-input">
      <h3>Заполните матрицу коэффициентов</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th></th>
            {Array.from({ length: cols }, (_, j) => (
              <th key={j}>-X{j + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td className="row-label">Y{i + 1}</td>
              {Array.from({ length: cols }, (_, j) => (
                <td key={j}>
                  <input
                    type="number"
                    step="any"
                    value={inputValues[i]?.[j] ?? "0"}
                    onChange={(e) => updateInputCell(i, j, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button className="primary" onClick={loadMatrix}>
        Начать решение
      </button>
    </div>
  );

  const renderJordanTable = () => (
    <div className="jordan-table">
      <h3>Жорданова таблица</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th></th>
            {variables.map((v, idx) => (
              <th key={idx}>{formatVarName(v)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="row-label">{outputs[i]}</td>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="clickable-cell"
                  onClick={() => handleCellClick(i, j)}
                  title="Нажмите для выполнения шага"
                >
                  {formatNumber(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">Нажмите на любую ячейку для выполнения шага Жордана</p>
    </div>
  );

  return (
    <div className="lab1">
      <h2>Лабораторная 1: Метод модифицированных жордановых исключений</h2>

      <div className="setup-panel">
        <div className="size-inputs">
          <label>
            Строк:
            <input
              type="number"
              min={1}
              max={10}
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 2)}
              disabled={matrix.length > 0}
            />
          </label>
          <label>
            Столбцов:
            <input
              type="number"
              min={1}
              max={10}
              value={cols}
              onChange={(e) => setCols(parseInt(e.target.value) || 3)}
              disabled={matrix.length > 0}
            />
          </label>
        </div>

        <div className="main-buttons">
          <button className="primary" onClick={createEmptyInputs}>
            Создать матрицу
          </button>
          <button className="secondary" onClick={reset}>
            Сбросить
          </button>
        </div>

        <div className="examples">
          <span>Примеры:</span>
          {EXAMPLES.map((ex, idx) => (
            <button key={idx} className="example-btn" onClick={() => loadExample(ex.matrix)}>
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {showInputs && matrix.length === 0 && renderInputTable()}

      {matrix.length > 0 && <>{renderJordanTable()}</>}
    </div>
  );
};

export default Lab1;
