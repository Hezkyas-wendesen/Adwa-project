// Battle of Adwa - Game Engine
// Educational Strategy Game

// Game State
const game = {
    currentLevel: 1,
    maxLevel: 3,
    resources: 300,
    score: 0,
    board: [],
    units: [],
    selectedUnit: null,
    gamePhase: 'setup', // setup, combat, ended
    currentTurn: 'ethiopian', // ethiopian, enemy
    boardSize: { rows: 8, cols: 8 },
    deploymentPhase: true,
    deploymentsRemaining: 5,
    validMoves: [],
    validAttacks: []
};

// Unit Types
const UNIT_TYPES = {
    infantry: {
        name: 'Infantry',
        symbol: '👥',
        health: 100,
        maxHealth: 100,
        attack: 20,
        defense: 15,
        movement: 2,
        cost: 50
    },
    cavalry: {
        name: 'Cavalry',
        symbol: '🐎',
        health: 80,
        maxHealth: 80,
        attack: 30,
        defense: 10,
        movement: 3,
        cost: 100
    }
};

// Terrain Types
const TERRAIN_TYPES = {
    plain: {
        name: 'Plain',
        symbol: '🟩',
        defenseBonus: 0,
        movementCost: 1
    },
    hill: {
        name: 'Hill',
        symbol: '🟫',
        defenseBonus: 1,
        movementCost: 1
    },
    mountain: {
        name: 'Mountain',
        symbol: '⛰️',
        defenseBonus: 2,
        movementCost: 2
    }
};

// Historical Facts
const HISTORICAL_FACTS = [
    {
        title: "Emperor Menelik II",
        content: "Emperor Menelik II united Ethiopian forces from various regions, demonstrating exceptional leadership and strategic planning. He modernized the Ethiopian military with imported weapons while maintaining traditional tactics."
    },
    {
        title: "Unity of Ethiopian Forces",
        content: "The Battle of Adwa saw unprecedented unity among Ethiopian forces. Regional leaders and their armies came together under Emperor Menelik II, showcasing the strength of a unified Ethiopia against colonial aggression."
    },
    {
        title: "Strategic Brilliance",
        content: "The Ethiopian forces used their knowledge of the mountainous terrain to their advantage. They positioned themselves on high ground, forcing the Italian forces to fight uphill in unfamiliar territory."
    },
    {
        title: "Historic Victory",
        content: "On March 1, 1896, Ethiopia achieved a decisive victory at Adwa. This victory made Ethiopia the only African nation to successfully resist European colonization during the Scramble for Africa."
    }
];

// Level Configurations
const LEVELS = [
    {
        level: 1,
        name: "The Hills of Adwa",
        description: "Defend the strategic hills",
        enemyUnits: 3,
        startingResources: 300,
        boardSetup: 'hills'
    },
    {
        level: 2,
        name: "Mountain Defense",
        description: "Hold the mountain passes",
        enemyUnits: 5,
        startingResources: 350,
        boardSetup: 'mountains'
    },
    {
        level: 3,
        name: "Final Stand at Adwa",
        description: "The decisive battle",
        enemyUnits: 7,
        startingResources: 400,
        boardSetup: 'mixed'
    }
];

// Initialize Game
function initGame() {
    // Set up event listeners
    document.getElementById('start-game-btn').addEventListener('click', startNewGame);
    document.getElementById('how-to-play-btn').addEventListener('click', showHowToPlay);
    document.getElementById('back-to-menu-btn').addEventListener('click', showMainMenu);
    document.getElementById('continue-btn').addEventListener('click', startLevel);
    document.getElementById('end-turn-btn').addEventListener('click', endTurn);
    document.getElementById('deploy-infantry-btn').addEventListener('click', () => deployUnit('infantry'));
    document.getElementById('deploy-cavalry-btn').addEventListener('click', () => deployUnit('cavalry'));
    document.getElementById('move-btn').addEventListener('click', initiateMove);
    document.getElementById('attack-btn').addEventListener('click', initiateAttack);
    document.getElementById('cancel-btn').addEventListener('click', cancelAction);
    document.getElementById('next-level-btn').addEventListener('click', nextLevel);
    document.getElementById('retry-btn').addEventListener('click', retryLevel);
    document.getElementById('victory-menu-btn').addEventListener('click', showMainMenu);
    document.getElementById('defeat-menu-btn').addEventListener('click', showMainMenu);
    document.getElementById('campaign-menu-btn').addEventListener('click', showMainMenu);

    showMainMenu();
}

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showMainMenu() {
    showScreen('main-menu');
}

function showHowToPlay() {
    showScreen('how-to-play');
}

function startNewGame() {
    game.currentLevel = 1;
    game.score = 0;
    showHistoricalFact(0);
}

function showHistoricalFact(factIndex) {
    const fact = HISTORICAL_FACTS[factIndex];
    const factContent = document.getElementById('fact-content');
    factContent.innerHTML = `
        <h3>${fact.title}</h3>
        <p>${fact.content}</p>
    `;
    showScreen('historical-fact');
}

function startLevel() {
    const levelConfig = LEVELS[game.currentLevel - 1];
    game.resources = levelConfig.startingResources;
    game.units = [];
    game.selectedUnit = null;
    game.gamePhase = 'setup';
    game.currentTurn = 'ethiopian';
    game.deploymentPhase = true;
    game.deploymentsRemaining = 5;

    initializeBoard(levelConfig.boardSetup);
    spawnEnemyUnits(levelConfig.enemyUnits);
    updateDisplay();
    showScreen('game-screen');
    showMessage('Deploy your units in the green zone. Deployments remaining: ' + game.deploymentsRemaining);
}

function initializeBoard(setupType) {
    game.board = [];
    const { rows, cols } = game.boardSize;

    for (let row = 0; row < rows; row++) {
        game.board[row] = [];
        for (let col = 0; col < cols; col++) {
            let terrain = 'plain';

            if (setupType === 'hills') {
                if (row >= 2 && row <= 5) terrain = 'hill';
            } else if (setupType === 'mountains') {
                if (row >= 3 && row <= 6 && col >= 2 && col <= 5) terrain = 'mountain';
                else if (row >= 2 && row <= 6) terrain = 'hill';
            } else if (setupType === 'mixed') {
                const rand = Math.random();
                if (rand < 0.2) terrain = 'mountain';
                else if (rand < 0.5) terrain = 'hill';
            }

            game.board[row][col] = { terrain, unit: null };
        }
    }

    renderBoard();
}

function renderBoard() {
    const boardElement = document.getElementById('game-board');
    boardElement.innerHTML = '';

    const { rows, cols } = game.boardSize;
    
    // Adjust grid for mobile
    if (window.innerWidth <= 768) {
        boardElement.style.gridTemplateColumns = `repeat(6, 1fr)`;
        game.boardSize = { rows: 6, cols: 6 };
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${game.board[row][col].terrain}`;
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Add deployment zone highlighting
            if (game.deploymentPhase && row >= rows - 2) {
                cell.classList.add('deployment-zone');
            }

            const unit = game.board[row][col].unit;
            if (unit) {
                const unitDiv = document.createElement('div');
                unitDiv.className = `unit ${unit.owner}`;
                unitDiv.textContent = unit.symbol;
                cell.appendChild(unitDiv);

                // Health bar
                const healthBar = document.createElement('div');
                healthBar.className = 'health-bar';
                const healthFill = document.createElement('div');
                healthFill.className = 'health-fill';
                healthFill.style.width = `${(unit.health / unit.maxHealth) * 100}%`;
                healthBar.appendChild(healthFill);
                cell.appendChild(healthBar);
            }

            cell.addEventListener('click', () => handleCellClick(row, col));
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(row, col) {
    const cell = game.board[row][col];

    // Deployment phase
    if (game.deploymentPhase && game.currentTurn === 'ethiopian') {
        if (game.selectedUnit && row >= game.boardSize.rows - 2 && !cell.unit) {
            placeUnit(game.selectedUnit, row, col);
            return;
        }
    }

    // Valid move selection
    if (game.validMoves.some(m => m.row === row && m.col === col)) {
        moveUnit(game.selectedUnit, row, col);
        return;
    }

    // Valid attack selection
    if (game.validAttacks.some(a => a.row === row && a.col === col)) {
        attackUnit(game.selectedUnit, row, col);
        return;
    }

    // Unit selection
    if (cell.unit && cell.unit.owner === 'ethiopian' && game.currentTurn === 'ethiopian') {
        selectUnit(row, col);
    } else {
        deselectUnit();
    }
}

function deployUnit(unitType) {
    if (game.resources < UNIT_TYPES[unitType].cost) {
        showMessage('Not enough resources!');
        return;
    }

    const unitData = { ...UNIT_TYPES[unitType] };
    unitData.type = unitType;
    unitData.owner = 'ethiopian';
    unitData.hasMoved = false;

    game.selectedUnit = unitData;
    showMessage(`Click a cell in the green deployment zone to place your ${unitData.name}`);
    highlightDeploymentZone();
}

function highlightDeploymentZone() {
    clearHighlights();
    renderBoard();
}

function placeUnit(unitData, row, col) {
    game.resources -= unitData.cost;
    game.deploymentsRemaining--;

    const unit = {
        ...unitData,
        row,
        col,
        hasMoved: false
    };

    game.board[row][col].unit = unit;
    game.units.push(unit);
    game.selectedUnit = null;

    updateDisplay();
    renderBoard();

    if (game.deploymentsRemaining <= 0) {
        game.deploymentPhase = false;
        game.gamePhase = 'combat';
        showMessage('Deployment complete! Select a unit to move or attack.');
        updateActionButtons();
    } else {
        showMessage(`Deployments remaining: ${game.deploymentsRemaining}`);
    }
}

function spawnEnemyUnits(count) {
    const unitTypes = ['infantry', 'cavalry'];

    for (let i = 0; i < count; i++) {
        const type = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        const unitData = { ...UNIT_TYPES[type] };
        
        // Find empty cell in top rows
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 50) {
            const row = Math.floor(Math.random() * 2);
            const col = Math.floor(Math.random() * game.boardSize.cols);

            if (!game.board[row][col].unit) {
                const unit = {
                    ...unitData,
                    type,
                    owner: 'enemy',
                    row,
                    col,
                    hasMoved: false
                };

                game.board[row][col].unit = unit;
                game.units.push(unit);
                placed = true;
            }
            attempts++;
        }
    }
}

function selectUnit(row, col) {
    const unit = game.board[row][col].unit;
    
    if (unit.hasMoved) {
        showMessage('This unit has already acted this turn.');
        return;
    }

    game.selectedUnit = unit;
    clearHighlights();
    
    const boardElement = document.getElementById('game-board');
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (parseInt(cell.dataset.row) === row && parseInt(cell.dataset.col) === col) {
            cell.classList.add('selected');
        }
    });

    showUnitInfo(unit);
    updateActionButtons();
}

function deselectUnit() {
    game.selectedUnit = null;
    clearHighlights();
    showUnitInfo(null);
    updateActionButtons();
}

function showUnitInfo(unit) {
    const detailsDiv = document.getElementById('unit-details');
    
    if (!unit) {
        detailsDiv.innerHTML = 'Select a unit to view details';
        return;
    }

    const terrain = game.board[unit.row][unit.col].terrain;
    const terrainInfo = TERRAIN_TYPES[terrain];

    detailsDiv.innerHTML = `
        <div><strong>Type:</strong> ${unit.name} ${unit.symbol}</div>
        <div><strong>Owner:</strong> ${unit.owner === 'ethiopian' ? 'Ethiopian Forces' : 'Enemy Forces'}</div>
        <div><strong>Health:</strong> ${unit.health}/${unit.maxHealth}</div>
        <div><strong>Attack:</strong> ${unit.attack}</div>
        <div><strong>Defense:</strong> ${unit.defense}</div>
        <div><strong>Movement:</strong> ${unit.movement}</div>
        <div><strong>Terrain:</strong> ${terrainInfo.name} (Def: +${terrainInfo.defenseBonus})</div>
    `;
}

function initiateMove() {
    if (!game.selectedUnit) return;

    game.validMoves = getValidMoves(game.selectedUnit);
    highlightValidMoves();
    showMessage('Click a highlighted cell to move');
}

function getValidMoves(unit) {
    const moves = [];
    const { row, col, movement } = unit;

    for (let dr = -movement; dr <= movement; dr++) {
        for (let dc = -movement; dc <= movement; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < game.boardSize.rows && 
                newCol >= 0 && newCol < game.boardSize.cols) {
                
                const distance = Math.abs(dr) + Math.abs(dc);
                if (distance <= movement && !game.board[newRow][newCol].unit) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    return moves;
}

function highlightValidMoves() {
    clearHighlights();
    
    const boardElement = document.getElementById('game-board');
    const cells = boardElement.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (game.validMoves.some(m => m.row === row && m.col === col)) {
            cell.classList.add('valid-move');
        }

        if (game.selectedUnit && game.selectedUnit.row === row && game.selectedUnit.col === col) {
            cell.classList.add('selected');
        }
    });
}

function moveUnit(unit, toRow, toCol) {
    game.board[unit.row][unit.col].unit = null;
    unit.row = toRow;
    unit.col = toCol;
    game.board[toRow][toCol].unit = unit;
    unit.hasMoved = true;

    game.validMoves = [];
    deselectUnit();
    renderBoard();
    showMessage('Unit moved successfully');
}

function initiateAttack() {
    if (!game.selectedUnit) return;

    game.validAttacks = getValidAttacks(game.selectedUnit);
    
    if (game.validAttacks.length === 0) {
        showMessage('No enemies in range!');
        return;
    }

    highlightValidAttacks();
    showMessage('Click an enemy to attack');
}

function getValidAttacks(unit) {
    const attacks = [];
    const { row, col } = unit;
    const range = 1; // Adjacent attacks only

    for (let dr = -range; dr <= range; dr++) {
        for (let dc = -range; dc <= range; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < game.boardSize.rows && 
                newCol >= 0 && newCol < game.boardSize.cols) {
                
                const targetUnit = game.board[newRow][newCol].unit;
                if (targetUnit && targetUnit.owner !== unit.owner) {
                    attacks.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    return attacks;
}

function highlightValidAttacks() {
    clearHighlights();
    
    const boardElement = document.getElementById('game-board');
    const cells = boardElement.querySelectorAll('.cell');
    
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (game.validAttacks.some(a => a.row === row && a.col === col)) {
            cell.classList.add('valid-attack');
        }

        if (game.selectedUnit && game.selectedUnit.row === row && game.selectedUnit.col === col) {
            cell.classList.add('selected');
        }
    });
}

function attackUnit(attacker, targetRow, targetCol) {
    const defender = game.board[targetRow][targetCol].unit;
    
    // Calculate damage
    const terrain = game.board[targetRow][targetCol].terrain;
    const defenseBonus = TERRAIN_TYPES[terrain].defenseBonus;
    const totalDefense = defender.defense + defenseBonus;
    
    const damage = Math.max(5, attacker.attack - totalDefense);
    defender.health -= damage;

    showMessage(`${attacker.name} attacks ${defender.name} for ${damage} damage!`);

    // Counter-attack if defender survives
    if (defender.health > 0) {
        const counterDamage = Math.max(3, defender.attack - attacker.defense);
        attacker.health -= counterDamage;
        
        setTimeout(() => {
            showMessage(`${defender.name} counter-attacks for ${counterDamage} damage!`);
        }, 1000);
    }

    // Check if units died
    if (defender.health <= 0) {
        game.board[targetRow][targetCol].unit = null;
        game.units = game.units.filter(u => u !== defender);
        game.score += 100;
        
        setTimeout(() => {
            showMessage(`Enemy ${defender.name} defeated!`);
        }, 1500);
    }

    if (attacker.health <= 0) {
        game.board[attacker.row][attacker.col].unit = null;
        game.units = game.units.filter(u => u !== attacker);
    }

    attacker.hasMoved = true;
    game.validAttacks = [];
    deselectUnit();
    
    setTimeout(() => {
        renderBoard();
        updateDisplay();
        checkWinCondition();
    }, 2000);
}

function cancelAction() {
    game.validMoves = [];
    game.validAttacks = [];
    deselectUnit();
    showMessage('Action cancelled');
}

function clearHighlights() {
    const boardElement = document.getElementById('game-board');
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('selected', 'valid-move', 'valid-attack');
    });
}

function endTurn() {
    if (game.currentTurn === 'ethiopian') {
        // Reset Ethiopian units
        game.units.forEach(unit => {
            if (unit.owner === 'ethiopian') {
                unit.hasMoved = false;
            }
        });

        game.currentTurn = 'enemy';
        deselectUnit();
        updateDisplay();
        showMessage('Enemy turn...');
        
        setTimeout(() => {
            executeEnemyTurn();
        }, 1000);
    }
}

function executeEnemyTurn() {
    const enemyUnits = game.units.filter(u => u.owner === 'enemy' && !u.hasMoved);
    
    if (enemyUnits.length === 0) {
        endEnemyTurn();
        return;
    }

    const unit = enemyUnits[0];
    
    // Simple AI: Try to attack, otherwise move closer
    const validAttacks = getValidAttacks(unit);
    
    if (validAttacks.length > 0) {
        const target = validAttacks[Math.floor(Math.random() * validAttacks.length)];
        attackUnit(unit, target.row, target.col);
        
        setTimeout(() => {
            executeEnemyTurn();
        }, 2000);
    } else {
        // Move towards closest Ethiopian unit
        const ethiopianUnits = game.units.filter(u => u.owner === 'ethiopian');
        if (ethiopianUnits.length > 0) {
            const closest = ethiopianUnits.reduce((prev, curr) => {
                const prevDist = Math.abs(prev.row - unit.row) + Math.abs(prev.col - unit.col);
                const currDist = Math.abs(curr.row - unit.row) + Math.abs(curr.col - unit.col);
                return currDist < prevDist ? curr : prev;
            });

            const validMoves = getValidMoves(unit);
            if (validMoves.length > 0) {
                const bestMove = validMoves.reduce((prev, curr) => {
                    const prevDist = Math.abs(prev.row - closest.row) + Math.abs(prev.col - closest.col);
                    const currDist = Math.abs(curr.row - closest.row) + Math.abs(curr.col - closest.col);
                    return currDist < prevDist ? curr : prev;
                });

                moveUnit(unit, bestMove.row, bestMove.col);
            } else {
                unit.hasMoved = true;
            }
        } else {
            unit.hasMoved = true;
        }

        setTimeout(() => {
            executeEnemyTurn();
        }, 1000);
    }
}

function endEnemyTurn() {
    game.currentTurn = 'ethiopian';
    
    // Reset enemy units
    game.units.forEach(unit => {
        if (unit.owner === 'enemy') {
            unit.hasMoved = false;
        }
    });

    updateDisplay();
    showMessage('Your turn');
    checkWinCondition();
}

function checkWinCondition() {
    const ethiopianUnits = game.units.filter(u => u.owner === 'ethiopian');
    const enemyUnits = game.units.filter(u => u.owner === 'enemy');

    if (enemyUnits.length === 0) {
        victory();
    } else if (ethiopianUnits.length === 0) {
        defeat();
    }
}

function victory() {
    // Calculate score bonuses
    const ethiopianUnits = game.units.filter(u => u.owner === 'ethiopian');
    const unitsBonus = ethiopianUnits.length * 50;
    const resourceBonus = game.resources;
    const levelBonus = game.currentLevel * 100;
    const totalBonus = unitsBonus + resourceBonus + levelBonus;
    
    game.score += totalBonus;

    const statsDiv = document.getElementById('victory-stats');
    statsDiv.innerHTML = `
        <div><strong>Level:</strong> ${game.currentLevel}</div>
        <div><strong>Units Survived:</strong> ${ethiopianUnits.length} (+${unitsBonus} points)</div>
        <div><strong>Resources Remaining:</strong> ${game.resources} (+${resourceBonus} points)</div>
        <div><strong>Level Bonus:</strong> +${levelBonus} points</div>
        <div style="margin-top: 15px; font-size: 1.3em; color: var(--ethiopian-green);"><strong>Total Score:</strong> ${game.score}</div>
    `;

    showScreen('victory-screen');
}

function defeat() {
    showScreen('defeat-screen');
}

function nextLevel() {
    game.currentLevel++;
    
    if (game.currentLevel > game.maxLevel) {
        campaignComplete();
    } else {
        showHistoricalFact(game.currentLevel - 1);
    }
}

function retryLevel() {
    startLevel();
}

function campaignComplete() {
    const statsDiv = document.getElementById('final-stats');
    statsDiv.innerHTML = `
        <div style="font-size: 1.3em; color: var(--ethiopian-green); margin: 20px 0;">
            <strong>Final Score: ${game.score}</strong>
        </div>
        <div><strong>Levels Completed:</strong> ${game.maxLevel}</div>
        <div><strong>Rank:</strong> ${getRank(game.score)}</div>
    `;

    showScreen('campaign-complete');
}

function getRank(score) {
    if (score >= 2000) return 'Emperor Menelik II - Legendary Strategist';
    if (score >= 1500) return 'General - Master Commander';
    if (score >= 1000) return 'Commander - Skilled Tactician';
    if (score >= 500) return 'Captain - Brave Leader';
    return 'Soldier - Defender of Ethiopia';
}

function updateDisplay() {
    document.getElementById('level-display').textContent = game.currentLevel;
    document.getElementById('resources-display').textContent = game.resources;
    document.getElementById('score-display').textContent = game.score;
    document.getElementById('turn-display').textContent = 
        game.currentTurn === 'ethiopian' ? 'Ethiopian Forces' : 'Enemy Forces';

    updateActionButtons();
}

function updateActionButtons() {
    const deployInfantry = document.getElementById('deploy-infantry-btn');
    const deployCavalry = document.getElementById('deploy-cavalry-btn');
    const moveBtn = document.getElementById('move-btn');
    const attackBtn = document.getElementById('attack-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const endTurnBtn = document.getElementById('end-turn-btn');

    // Deployment buttons
    if (game.deploymentPhase && game.currentTurn === 'ethiopian') {
        deployInfantry.disabled = game.resources < UNIT_TYPES.infantry.cost;
        deployCavalry.disabled = game.resources < UNIT_TYPES.cavalry.cost;
        moveBtn.disabled = true;
        attackBtn.disabled = true;
        cancelBtn.disabled = false;
        endTurnBtn.disabled = true;
    } else {
        deployInfantry.disabled = true;
        deployCavalry.disabled = true;

        if (game.selectedUnit && game.currentTurn === 'ethiopian' && !game.selectedUnit.hasMoved) {
            moveBtn.disabled = false;
            attackBtn.disabled = false;
            cancelBtn.disabled = false;
        } else {
            moveBtn.disabled = true;
            attackBtn.disabled = true;
            cancelBtn.disabled = game.selectedUnit === null;
        }

        endTurnBtn.disabled = game.currentTurn !== 'ethiopian';
    }
}

function showMessage(message) {
    const messageDisplay = document.getElementById('message-display');
    messageDisplay.textContent = message;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);
