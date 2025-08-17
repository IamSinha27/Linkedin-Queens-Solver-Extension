document.getElementById("autoSolveBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        console.log("[AutoSolver] Running extract and solve...");

        const cellEls = document.querySelectorAll(".queens-cell-with-border");
        const boardSize = Math.sqrt(cellEls.length);
        if (!Number.isInteger(boardSize)) {
          console.error("[AutoSolver] Board size not valid.");
          return;
        }

        console.log(`[AutoSolver] Board size: ${boardSize}x${boardSize}`);
        const board = Array.from({ length: boardSize }, () => []);

        cellEls.forEach(cell => {
          const idx = parseInt(cell.dataset.cellIdx);
          const colorClass = [...cell.classList].find(cls => cls.startsWith("cell-color-"));
          const colorId = parseInt(colorClass.split("-").pop());
          const row = Math.floor(idx / boardSize);
          board[row].push(colorId);
        });

        console.log("[AutoSolver] Extracted board colors:");
        console.table(board);

        const result = [];
        const temp = Array.from({ length: boardSize }, () => Array(boardSize).fill("."));

        function isSafe(boardColors, boardState, row, col, usedColors) {
          if (usedColors.has(boardColors[row][col])) return false;

          for (let i = 0; i < boardSize; i++) if (boardState[row][i] === "Q") return false;
          for (let i = 0; i < row; i++) if (boardState[i][col] === "Q") return false;

          if (row > 0 && col > 0 && boardState[row - 1][col - 1] === "Q") return false;
          if (row > 0 && col < boardSize - 1 && boardState[row - 1][col + 1] === "Q") return false;

          return true;
        }

        function solve(row, usedColors) {
          if (row === boardSize) {
            result.push(temp.map(r => [...r]));
            return;
          }

          for (let col = 0; col < boardSize; col++) {
            if (isSafe(board, temp, row, col, usedColors)) {
              temp[row][col] = "Q";
              usedColors.add(board[row][col]);

              solve(row + 1, usedColors);

              usedColors.delete(board[row][col]);
              temp[row][col] = ".";
            }
          }
        }

        solve(0, new Set());

        if (result.length === 0) {
          console.warn("[AutoSolver] No solution found.");
          return;
        }

        const solution = result[0];
        console.log("[AutoSolver] Solution board:");
        console.table(solution);

        function simulateDoubleClick(el) {
          const eventProps = {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1
          };

          el.dispatchEvent(new MouseEvent("mousedown", eventProps));
          el.dispatchEvent(new MouseEvent("mouseup", eventProps));
          el.dispatchEvent(new MouseEvent("click", eventProps));

          setTimeout(() => {
            el.dispatchEvent(new MouseEvent("mousedown", eventProps));
            el.dispatchEvent(new MouseEvent("mouseup", eventProps));
            el.dispatchEvent(new MouseEvent("click", eventProps));
            console.log(`[AutoSolver] Simulated real double-click on element`);
          }, 100);
        }

        let delay = 0;
        solution.forEach((rowArr, r) => {
          rowArr.forEach((val, c) => {
            if (val === "Q") {
              const cellIdx = r * boardSize + c;
              const cell = cellEls[cellIdx];
              if (cell) {
                console.log(`[AutoSolver] Placing queen at row ${r}, col ${c} (idx ${cellIdx})`);
                setTimeout(() => {
                  simulateDoubleClick(cell);
                }, delay);
                delay += 250;
              } else {
                console.warn(`[AutoSolver] Cell not found at index ${cellIdx}`);
              }
            }
          });
        });

        console.log("[AutoSolver] Auto placement complete.");
      }
    });
  });
});