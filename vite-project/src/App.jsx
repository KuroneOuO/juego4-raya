import React, { useState, useEffect } from "react";
import "./App.css";
import { db } from "./firebaseConfig";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";

const ROWS = 6;
const COLS = 7;
const EMPTY = null;

const App = () => {
  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)));
  const [player, setPlayer] = useState("🔴");
  const [winner, setWinner] = useState(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadGame(setBoard, setPlayer, setWinner, setMoves, setScore);
  }, []);

  const checkWinner = (board) => {
    // Función para verificar si hay 4 en línea
    const directions = [
      [0, 1],  // Horizontal
      [1, 0],  // Vertical
      [1, 1],  // Diagonal derecha-abajo
      [1, -1], // Diagonal izquierda-abajo
    ];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (board[row][col] !== EMPTY) {
          const current = board[row][col];

          for (let [dx, dy] of directions) {
            let count = 1;

            for (let i = 1; i < 4; i++) {
              const newRow = row + dx * i;
              const newCol = col + dy * i;

              if (
                newRow >= 0 &&
                newRow < ROWS &&
                newCol >= 0 &&
                newCol < COLS &&
                board[newRow][newCol] === current
              ) {
                count++;
              } else {
                break;
              }
            }

            if (count === 4) {
              return current;
            }
          }
        }
      }
    }
    return null;
  };

  const handleClick = (col) => {
    if (winner) return;

    const newBoard = [...board.map(row => [...row])];
    for (let row = ROWS - 1; row >= 0; row--) {
      if (newBoard[row][col] === EMPTY) {
        newBoard[row][col] = player;
        const newWinner = checkWinner(newBoard);
        const newMoves = moves + 1;
        const newScore = newWinner ? (50 - newMoves) : score;  // Puntuación según movimientos

        setBoard(newBoard);
        setPlayer(player === "🔴" ? "🟡" : "🔴");
        setWinner(newWinner);
        setMoves(newMoves);
        setScore(newScore);

        saveGame(newBoard, player === "🔴" ? "🟡" : "🔴", newWinner, newMoves, newScore);
        return;
      }
    }
  };

  const restartGame = () => {
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    setBoard(newBoard);
    setPlayer("🔴");
    setWinner(null);
    setMoves(0);
    setScore(0);
    saveGame(newBoard, "🔴", null, 0, 0);
  };

  return (
    <div className="game-container">
      <h1>4 en Raya</h1>
      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="cell" onClick={() => handleClick(colIndex)}>
              {cell}
            </div>
          ))
        )}
      </div>
      <p>Turno: {player}</p>
      {winner && <p>¡Ganador: {winner}!</p>}
      <button onClick={restartGame}>Reiniciar</button>
    </div>
  );
};

// 🔥 Guardar en Firebase
const saveGame = async (newBoard, nextPlayer, gameWinner, moves, score) => {
  try {
    const gameRef = doc(collection(db, "games"), "partidaActual");

    const boardObject = {};
    newBoard.forEach((row, rowIndex) => {
      boardObject[`row_${rowIndex}`] = row;
    });

    await setDoc(gameRef, {
      board: boardObject,
      player: nextPlayer,
      winner: gameWinner,
      moves: moves,
      score: score,
    }, { merge: true });

    console.log("✅ Juego guardado en Firestore");
  } catch (error) {
    console.error("❌ Error al guardar el juego:", error);
  }
};

// 🔥 Cargar desde Firebase
const loadGame = async (setBoard, setPlayer, setWinner, setMoves, setScore) => {
  try {
    const gameRef = doc(collection(db, "games"), "partidaActual");
    const snapshot = await getDoc(gameRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      const boardArray = Object.keys(data.board || {}).map(key => data.board[key]);

      setBoard(boardArray);
      setPlayer(data.player || "🔴");
      setWinner(data.winner || null);
      setMoves(data.moves || 0);
      setScore(data.score || 0);
    } else {
      console.log("No se encontró partida, creando una nueva...");
      await saveGame(
        Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY)),
        "🔴",
        null,
        0,
        0
      );
    }
  } catch (error) {
    console.error("❌ Error al cargar el juego:", error);
  }
};

export default App;
