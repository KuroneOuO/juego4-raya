import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { db } from "./firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

const ROWS = 6;
const COLS = 7;
const EMPTY_BOARD = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const boardToFirestore = (board) => {
  const result = {};
  board.forEach((row, i) => {
    result[`row_${i}`] = row;
  });
  return result;
};

const boardFromFirestore = (data) => {
  const board = [];
  for (let i = 0; i < ROWS; i++) {
    board.push(data[`row_${i}`] || Array(COLS).fill(null));
  }
  return board;
};

export default function App() {
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState("🔴");
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    try {
      const gameRef = doc(db, "juegos", "4enraya");
      const gameSnap = await getDoc(gameRef);

      if (gameSnap.exists()) {
        const gameData = gameSnap.data();
        const loadedBoard = boardFromFirestore(gameData.board || {});
        setBoard(loadedBoard);
        setCurrentPlayer(gameData.currentPlayer || "🔴");
        setGameOver(gameData.gameOver || false);
      } else {
        createNewGame();
      }
    } catch (error) {
      console.error("Error cargando el juego:", error);
      setBoard(EMPTY_BOARD);
    }
  };

  const createNewGame = async () => {
    const empty = EMPTY_BOARD;
    try {
      await setDoc(doc(db, "juegos", "4enraya"), {
        board: boardToFirestore(empty),
        currentPlayer: "🔴",
        gameOver: false,
      });

      setBoard(empty);
      setCurrentPlayer("🔴");
      setGameOver(false);
    } catch (error) {
      console.error("Error al crear el tablero:", error);
    }
  };

  const checkWinner = (board, player) => {
    // Horizontal
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col <= COLS - 4; col++) {
        if (
          board[row][col] === player &&
          board[row][col + 1] === player &&
          board[row][col + 2] === player &&
          board[row][col + 3] === player
        ) return true;
      }
    }

    // Vertical
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row <= ROWS - 4; row++) {
        if (
          board[row][col] === player &&
          board[row + 1][col] === player &&
          board[row + 2][col] === player &&
          board[row + 3][col] === player
        ) return true;
      }
    }

    // Diagonal descendente
    for (let row = 0; row <= ROWS - 4; row++) {
      for (let col = 0; col <= COLS - 4; col++) {
        if (
          board[row][col] === player &&
          board[row + 1][col + 1] === player &&
          board[row + 2][col + 2] === player &&
          board[row + 3][col + 3] === player
        ) return true;
      }
    }

    // Diagonal ascendente
    for (let row = 3; row < ROWS; row++) {
      for (let col = 0; col <= COLS - 4; col++) {
        if (
          board[row][col] === player &&
          board[row - 1][col + 1] === player &&
          board[row - 2][col + 2] === player &&
          board[row - 3][col + 3] === player
        ) return true;
      }
    }

    return false;
  };

  const handleColumnPress = async (colIndex) => {
    if (gameOver) return;

    const newBoard = board.map((row) => [...row]);
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][colIndex]) {
        newBoard[row][colIndex] = currentPlayer;

        const hasWon = checkWinner(newBoard, currentPlayer);
        const nextPlayer = currentPlayer === "🔴" ? "🟡" : "🔴";

        await setDoc(doc(db, "juegos", "4enraya"), {
          board: boardToFirestore(newBoard),
          currentPlayer: hasWon ? currentPlayer : nextPlayer,
          gameOver: hasWon,
        });

        setBoard(newBoard);
        setGameOver(hasWon);

        if (hasWon) {
          Alert.alert("¡Juego terminado!", `Ganó ${currentPlayer}`);
        } else {
          setCurrentPlayer(nextPlayer);
        }
        return;
      }
    }

    Alert.alert("Columna llena", "Intenta con otra columna.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.turnText}>
        {gameOver ? `Ganó: ${currentPlayer}` : `Turno de: ${currentPlayer}`}
      </Text>

      {Array.isArray(board) &&
        board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.cell,
                  {
                    backgroundColor:
                      cell === "🔴"
                        ? "red"
                        : cell === "🟡"
                        ? "yellow"
                        : "white",
                  },
                ]}
                onPress={() => handleColumnPress(colIndex)}
              />
            ))}
          </View>
        ))}

      <TouchableOpacity style={styles.resetButton} onPress={createNewGame}>
        <Text style={styles.resetText}>Reiniciar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: 50,
    height: 50,
    margin: 2,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  turnText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  resetButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "blue",
    borderRadius: 5,
  },
  resetText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
