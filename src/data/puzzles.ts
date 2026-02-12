// Chess Puzzles Database
export interface ChessPuzzle {
  id: string;
  type: 'mate_in_1' | 'mate_in_2' | 'mate_in_3' | 'mate_in_4' | 'tactics' | 'endgame';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  fen: string; // Starting position in FEN notation
  solution: string[]; // Array of moves in algebraic notation
  title: string;
  description: string;
  rating: number;
  requiredLevel: number;
}

// Mate in 1 Puzzles (Beginner - Level 1+)
export const mateIn1Puzzles: ChessPuzzle[] = [
  {
    id: 'm1_001',
    type: 'mate_in_1',
    difficulty: 'beginner',
    fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    solution: ['Re8#'],
    title: 'Back Rank Mate',
    description: 'Find the checkmate in one move using the back rank weakness.',
    rating: 400,
    requiredLevel: 1
  },
  {
    id: 'm1_002',
    type: 'mate_in_1',
    difficulty: 'beginner',
    fen: '5rk1/5ppp/8/8/8/8/5PPP/R3R1K1 w - - 0 1',
    solution: ['Re8#'],
    title: 'Rook Delivery',
    description: 'Deliver checkmate with your rook.',
    rating: 450,
    requiredLevel: 1
  },
  {
    id: 'm1_003',
    type: 'mate_in_1',
    difficulty: 'beginner',
    fen: '6k1/4Qppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    solution: ['Qe8#'],
    title: 'Queen Mate',
    description: 'Use your queen to deliver checkmate.',
    rating: 500,
    requiredLevel: 2
  },
  {
    id: 'm1_004',
    type: 'mate_in_1',
    difficulty: 'beginner',
    fen: '5k2/5P1p/5K2/8/8/8/8/8 w - - 0 1',
    solution: ['f8=Q#'],
    title: 'Pawn Promotion Mate',
    description: 'Promote your pawn to deliver checkmate.',
    rating: 550,
    requiredLevel: 3
  },
  {
    id: 'm1_005',
    type: 'mate_in_1',
    difficulty: 'beginner',
    fen: '3qk3/3ppp2/8/8/8/8/3PPP2/3QK2R w - - 0 1',
    solution: ['Qh5#'],
    title: 'Queen Diagonal',
    description: 'Find the diagonal checkmate.',
    rating: 600,
    requiredLevel: 4
  },
  {
    id: 'm1_006',
    type: 'mate_in_1',
    difficulty: 'intermediate',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    solution: ['Qxf7#'],
    title: "Scholar's Mate",
    description: 'Complete the famous Scholar\'s Mate pattern.',
    rating: 650,
    requiredLevel: 5
  },
  {
    id: 'm1_007',
    type: 'mate_in_1',
    difficulty: 'intermediate',
    fen: '5rk1/1b3ppp/8/8/1B6/8/5PPP/4R1K1 w - - 0 1',
    solution: ['Re8#'],
    title: 'Bishop Support',
    description: 'Use bishop support for back rank mate.',
    rating: 700,
    requiredLevel: 6
  },
  {
    id: 'm1_008',
    type: 'mate_in_1',
    difficulty: 'intermediate',
    fen: '6k1/5ppp/4p3/8/8/2B5/5PPP/2R3K1 w - - 0 1',
    solution: ['Rc8#'],
    title: 'Rook and Bishop',
    description: 'Coordinate rook and bishop for mate.',
    rating: 750,
    requiredLevel: 7
  },
  {
    id: 'm1_009',
    type: 'mate_in_1',
    difficulty: 'intermediate',
    fen: 'r4rk1/ppp2ppp/8/4N3/8/8/PPP2PPP/R4RK1 w - - 0 1',
    solution: ['Nf7#'],
    title: 'Smothered Knight',
    description: 'Find the smothered mate with your knight.',
    rating: 800,
    requiredLevel: 8
  },
  {
    id: 'm1_010',
    type: 'mate_in_1',
    difficulty: 'advanced',
    fen: '6k1/pp3pp1/2p4p/8/8/7Q/PPP2PPP/6K1 w - - 0 1',
    solution: ['Qc8#'],
    title: 'Long Range Queen',
    description: 'Find the long-range queen checkmate.',
    rating: 850,
    requiredLevel: 10
  }
];

// Mate in 2 Puzzles (Intermediate - Level 10+)
export const mateIn2Puzzles: ChessPuzzle[] = [
  {
    id: 'm2_001',
    type: 'mate_in_2',
    difficulty: 'intermediate',
    fen: '6k1/5ppp/8/8/8/8/2Q2PPP/6K1 w - - 0 1',
    solution: ['Qc8+', 'Qxf8#'],
    title: 'Queen Staircase',
    description: 'Use your queen to force mate in 2.',
    rating: 900,
    requiredLevel: 10
  },
  {
    id: 'm2_002',
    type: 'mate_in_2',
    difficulty: 'intermediate',
    fen: '2r3k1/5ppp/8/8/8/8/5PPP/R1R3K1 w - - 0 1',
    solution: ['Ra8', 'Rxc8#'],
    title: 'Rook Ladder',
    description: 'Coordinate your rooks for mate in 2.',
    rating: 950,
    requiredLevel: 12
  },
  {
    id: 'm2_003',
    type: 'mate_in_2',
    difficulty: 'intermediate',
    fen: '5rk1/5ppp/8/8/1B6/8/5PPP/R5K1 w - - 0 1',
    solution: ['Ra8', 'Rxf8#'],
    title: 'Bishop Guards',
    description: 'Use your bishop to support the rook mate.',
    rating: 1000,
    requiredLevel: 15
  },
  {
    id: 'm2_004',
    type: 'mate_in_2',
    difficulty: 'advanced',
    fen: 'r1b2rk1/ppppqppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K2R w KQ - 0 1',
    solution: ['Qxf6', 'Qxg7#'],
    title: 'Queen Sacrifice Lead',
    description: 'Sacrifice material to force mate.',
    rating: 1100,
    requiredLevel: 18
  },
  {
    id: 'm2_005',
    type: 'mate_in_2',
    difficulty: 'advanced',
    fen: '6k1/5p1p/6p1/8/8/6Q1/5PPP/6K1 w - - 0 1',
    solution: ['Qc7', 'Qf7#'],
    title: 'Queen Infiltration',
    description: 'Infiltrate with your queen for forced mate.',
    rating: 1150,
    requiredLevel: 20
  }
];

// Mate in 3 Puzzles (Advanced - Level 20+)
export const mateIn3Puzzles: ChessPuzzle[] = [
  {
    id: 'm3_001',
    type: 'mate_in_3',
    difficulty: 'advanced',
    fen: '6k1/5ppp/8/6N1/8/8/5PPP/4R1K1 w - - 0 1',
    solution: ['Re8+', 'Kh7', 'Nf7', 'Kg6', 'Re6#'],
    title: 'Knight Dance',
    description: 'Coordinate knight and rook for mate in 3.',
    rating: 1200,
    requiredLevel: 20
  },
  {
    id: 'm3_002',
    type: 'mate_in_3',
    difficulty: 'advanced',
    fen: '3r2k1/5ppp/8/4R3/8/8/5PPP/6K1 w - - 0 1',
    solution: ['Re8+', 'Rxe8', 'Kf2', 'Re1', 'Kxe1#'],
    title: 'Rook Exchange',
    description: 'Force a winning rook exchange.',
    rating: 1250,
    requiredLevel: 25
  },
  {
    id: 'm3_003',
    type: 'mate_in_3',
    difficulty: 'expert',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    solution: ['Qxf7+', 'Ke7', 'Qxe8+', 'Kxe8', 'Bg5#'],
    title: 'Opening Attack',
    description: 'Launch a devastating opening attack.',
    rating: 1300,
    requiredLevel: 30
  }
];

// Mate in 4 Puzzles (Expert - Level 40+)
export const mateIn4Puzzles: ChessPuzzle[] = [
  {
    id: 'm4_001',
    type: 'mate_in_4',
    difficulty: 'expert',
    fen: '6k1/5ppp/8/8/8/5N2/5PPP/R5K1 w - - 0 1',
    solution: ['Ra8+', 'Kh7', 'Ng5+', 'Kg6', 'Ra6+', 'Kh5', 'Ra5#'],
    title: 'Knight and Rook Dance',
    description: 'Coordinate knight and rook for forced mate.',
    rating: 1400,
    requiredLevel: 40
  },
  {
    id: 'm4_002',
    type: 'mate_in_4',
    difficulty: 'expert',
    fen: '2r3k1/5ppp/8/8/8/8/2Q2PPP/R5K1 w - - 0 1',
    solution: ['Qa4', 'Rc7', 'Qa8+', 'Rc8', 'Qxc8+', 'Kh7', 'Ra7', 'Qxf7#'],
    title: 'Queen and Rook Coordination',
    description: 'Masterful queen and rook play.',
    rating: 1500,
    requiredLevel: 50
  }
];

// Tactics Puzzles
export const tacticsPuzzles: ChessPuzzle[] = [
  {
    id: 't_001',
    type: 'tactics',
    difficulty: 'beginner',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
    solution: ['Nxe5'],
    title: 'Free Pawn',
    description: 'Capture the undefended pawn.',
    rating: 400,
    requiredLevel: 1
  },
  {
    id: 't_002',
    type: 'tactics',
    difficulty: 'beginner',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 1',
    solution: ['Nxe5'],
    title: 'Recapture',
    description: 'Recapture the piece.',
    rating: 450,
    requiredLevel: 2
  },
  {
    id: 't_003',
    type: 'tactics',
    difficulty: 'intermediate',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1',
    solution: ['Bxf7+', 'Kxf7', 'Ng5+'],
    title: 'Bishop Sacrifice',
    description: 'Sacrifice your bishop to win material.',
    rating: 900,
    requiredLevel: 10
  }
];

// Endgame Puzzles
export const endgamePuzzles: ChessPuzzle[] = [
  {
    id: 'e_001',
    type: 'endgame',
    difficulty: 'beginner',
    fen: '8/8/8/8/8/4K3/4P3/4k3 w - - 0 1',
    solution: ['Kd3', 'Kd1', 'e4', 'Ke1', 'e5'],
    title: 'King and Pawn',
    description: 'Learn the basic king and pawn endgame.',
    rating: 500,
    requiredLevel: 5
  },
  {
    id: 'e_002',
    type: 'endgame',
    difficulty: 'intermediate',
    fen: '8/8/8/8/4R3/4K3/8/4k3 w - - 0 1',
    solution: ['Kd3', 'Kf1', 'Re1#'],
    title: 'Rook Endgame',
    description: 'Win with king and rook vs king.',
    rating: 700,
    requiredLevel: 8
  }
];

// Daily Puzzles (rotates based on date)
export const getDailyPuzzle = (): ChessPuzzle => {
  const allPuzzles = [...mateIn1Puzzles, ...mateIn2Puzzles, ...tacticsPuzzles];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return allPuzzles[dayOfYear % allPuzzles.length];
};

// Get puzzles by type and level
export const getPuzzlesByType = (type: ChessPuzzle['type'], userLevel: number): { available: ChessPuzzle[], locked: ChessPuzzle[] } => {
  let puzzles: ChessPuzzle[] = [];
  
  switch (type) {
    case 'mate_in_1':
      puzzles = mateIn1Puzzles;
      break;
    case 'mate_in_2':
      puzzles = mateIn2Puzzles;
      break;
    case 'mate_in_3':
      puzzles = mateIn3Puzzles;
      break;
    case 'mate_in_4':
      puzzles = mateIn4Puzzles;
      break;
    case 'tactics':
      puzzles = tacticsPuzzles;
      break;
    case 'endgame':
      puzzles = endgamePuzzles;
      break;
  }
  
  const available = puzzles.filter(p => p.requiredLevel <= userLevel);
  const locked = puzzles.filter(p => p.requiredLevel > userLevel);
  
  return { available, locked };
};

// Get all puzzles for Puzzle Rush (random mix)
export const getPuzzleRushPuzzles = (difficulty: 'easy' | 'medium' | 'hard', count: number = 20): ChessPuzzle[] => {
  let pool: ChessPuzzle[] = [];
  
  switch (difficulty) {
    case 'easy':
      pool = [...mateIn1Puzzles.filter(p => p.difficulty === 'beginner'), ...tacticsPuzzles.filter(p => p.difficulty === 'beginner')];
      break;
    case 'medium':
      pool = [...mateIn1Puzzles, ...mateIn2Puzzles.filter(p => p.difficulty === 'intermediate'), ...tacticsPuzzles];
      break;
    case 'hard':
      pool = [...mateIn2Puzzles, ...mateIn3Puzzles, ...mateIn4Puzzles, ...endgamePuzzles];
      break;
  }
  
  // Shuffle and return
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Puzzle Sets (themed collections)
export const puzzleSets = [
  {
    id: 'set_back_rank',
    name: 'Back Rank Tactics',
    description: 'Master the deadly back rank threats',
    puzzles: ['m1_001', 'm1_002', 'm1_007', 'm2_002'],
    reward: 100,
    requiredLevel: 1
  },
  {
    id: 'set_queen_power',
    name: 'Queen Power',
    description: 'Learn to use your queen effectively',
    puzzles: ['m1_003', 'm1_005', 'm1_010', 'm2_001', 'm2_005'],
    reward: 150,
    requiredLevel: 5
  },
  {
    id: 'set_knight_tricks',
    name: 'Knight Tricks',
    description: 'Discover the power of the knight',
    puzzles: ['m1_009', 'm3_001', 'm4_001'],
    reward: 200,
    requiredLevel: 15
  },
  {
    id: 'set_endgame_basics',
    name: 'Endgame Essentials',
    description: 'Master basic endgame techniques',
    puzzles: ['e_001', 'e_002'],
    reward: 250,
    requiredLevel: 10
  }
];

export const getAllPuzzles = (): ChessPuzzle[] => {
  return [
    ...mateIn1Puzzles,
    ...mateIn2Puzzles,
    ...mateIn3Puzzles,
    ...mateIn4Puzzles,
    ...tacticsPuzzles,
    ...endgamePuzzles
  ];
};
