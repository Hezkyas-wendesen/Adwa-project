// Game Configuration
const CONFIG = {
    TILE_SIZE: 50,
    MAP_WIDTH: 12,
    MAP_HEIGHT: 10,
    INITIAL_RESOURCES: 100,
    RESOURCE_PER_TURN: 20,
    MIN_COMBAT_DAMAGE: 5,
    MIN_COUNTER_DAMAGE: 3,
    COUNTER_ATTACK_MULTIPLIER: 0.5,
    TROOP_TYPES: {
        INFANTRY: { cost: 10, health: 100, attack: 15, defense: 20, speed: 1, symbol: '⚔️' },
        CAVALRY: { cost: 20, health: 80, attack: 25, defense: 10, speed: 2, symbol: '🐎' }
    },
    TERRAIN_TYPES: {
        PLAIN: { defense: 0, moveCost: 1, color: '#90C695', symbol: '.' },
        HILL: { defense: 5, moveCost: 1.5, color: '#7BA77D', symbol: '^' },
        MOUNTAIN: { defense: 10, moveCost: 2, color: '#5D8264', symbol: '▲' }
    },
    ENEMY_TYPES: {
        INFANTRY: { health: 80, attack: 12, defense: 15, speed: 1, symbol: '⚔️' },
        CAVALRY: { health: 70, attack: 20, defense: 8, speed: 2, symbol: '🐎' }
    }
};

// Historical facts for between levels
const HISTORICAL_FACTS = [
    {
        title: "Emperor Menelik II",
        text: "Emperor Menelik II (1844-1913) modernized Ethiopia, importing weapons from Europe and Russia. He unified various Ethiopian kingdoms to face the Italian threat together."
    },
    {
        title: "Empress Taytu Betul",
        text: "Empress Taytu Betul played a crucial role in the Battle of Adwa. She personally commanded troops, organized supply lines, and her strategic wisdom was instrumental in the Ethiopian victory."
    },
    {
        title: "The Treaty of Wuchale",
        text: "The conflict arose from disputed interpretations of the Treaty of Wuchale (1889). Italy claimed it gave them a protectorate over Ethiopia, but the Amharic version said no such thing."
    },
    {
        title: "Pan-African Symbol",
        text: "The Battle of Adwa became a symbol of African resistance worldwide. The colors of the Ethiopian flag (green, yellow, red) were adopted by many African nations during decolonization."
    },
    {
        title: "Military Strategy",
        text: "Ethiopian forces used knowledge of local terrain, including mountains and highlands, to their advantage. They also cut off Italian supply lines, weakening the enemy."
    }
];

// Game State
class GameState {
    constructor() {
        this.level = 1;
        this.turn = 1;
        this.resources = CONFIG.INITIAL_RESOURCES;
        this.score = 0;
        this.playerTroops = [];
        this.enemyTroops = [];
        this.map = [];
        this.selectedTroop = null;
        this.gamePhase = 'player'; // 'player' or 'enemy'
        this.deploymentMode = null; // null, 'infantry', or 'cavalry'
    }

    reset(level) {
        this.level = level;
        this.turn = 1;
        this.resources = CONFIG.INITIAL_RESOURCES + (level - 1) * 30;
        this.playerTroops = [];
        this.enemyTroops = [];
        this.selectedTroop = null;
        this.gamePhase = 'player';
        this.deploymentMode = null;
        this.generateMap();
        this.initializeTroops();
    }

    generateMap() {
        this.map = [];
        for (let y = 0; y < CONFIG.MAP_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
                let terrainType;
                const rand = Math.random();
                
                // Mountains more common in upper half
                if (y < CONFIG.MAP_HEIGHT / 2) {
                    if (rand < 0.3) terrainType = 'MOUNTAIN';
                    else if (rand < 0.6) terrainType = 'HILL';
                    else terrainType = 'PLAIN';
                } else {
                    if (rand < 0.15) terrainType = 'MOUNTAIN';
                    else if (rand < 0.4) terrainType = 'HILL';
                    else terrainType = 'PLAIN';
                }
                
                row.push({ terrain: terrainType, x, y });
            }
            this.map.push(row);
        }
    }

    initializeTroops() {
        // Player starts with some troops in bottom half
        const startingTroops = 2 + Math.floor(this.level / 2);
        for (let i = 0; i < startingTroops; i++) {
            const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
            const y = CONFIG.MAP_HEIGHT - 3 + Math.floor(Math.random() * 2);
            const type = Math.random() < 0.6 ? 'INFANTRY' : 'CAVALRY';
            this.addPlayerTroop(type, x, y, false);
        }

        // Enemies start in top half
        const enemyCount = 3 + this.level;
        for (let i = 0; i < enemyCount; i++) {
            const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
            const y = Math.floor(Math.random() * 3);
            const type = Math.random() < 0.7 ? 'INFANTRY' : 'CAVALRY';
            this.addEnemyTroop(type, x, y);
        }
    }

    addPlayerTroop(type, x, y, cost = true) {
        const troopData = CONFIG.TROOP_TYPES[type];
        if (cost && this.resources < troopData.cost) return false;
        
        // Check if position is occupied
        if (this.getTroopAt(x, y)) return false;
        
        const troop = {
            type,
            x,
            y,
            health: troopData.health,
            maxHealth: troopData.health,
            attack: troopData.attack,
            defense: troopData.defense,
            speed: troopData.speed,
            moved: false,
            player: true
        };
        
        this.playerTroops.push(troop);
        if (cost) {
            this.resources -= troopData.cost;
        }
        return true;
    }

    addEnemyTroop(type, x, y) {
        const troopData = CONFIG.ENEMY_TYPES[type];
        
        // Check if position is occupied
        if (this.getTroopAt(x, y)) return false;
        
        const troop = {
            type,
            x,
            y,
            health: troopData.health,
            maxHealth: troopData.health,
            attack: troopData.attack,
            defense: troopData.defense,
            speed: troopData.speed,
            moved: false,
            player: false
        };
        
        this.enemyTroops.push(troop);
        return true;
    }

    getTroopAt(x, y) {
        for (const troop of this.playerTroops) {
            if (troop.x === x && troop.y === y) return troop;
        }
        for (const troop of this.enemyTroops) {
            if (troop.x === x && troop.y === y) return troop;
        }
        return null;
    }

    getTerrainAt(x, y) {
        if (x < 0 || x >= CONFIG.MAP_WIDTH || y < 0 || y >= CONFIG.MAP_HEIGHT) {
            return null;
        }
        return this.map[y][x];
    }

    moveTroop(troop, targetX, targetY) {
        const distance = Math.abs(troop.x - targetX) + Math.abs(troop.y - targetY);
        const terrain = this.getTerrainAt(targetX, targetY);
        const moveCost = CONFIG.TERRAIN_TYPES[terrain.terrain].moveCost;
        
        if (distance > troop.speed || troop.moved) return false;
        if (this.getTroopAt(targetX, targetY)) return false;
        
        troop.x = targetX;
        troop.y = targetY;
        troop.moved = true;
        
        // Check for adjacent enemy and auto-attack
        this.checkAdjacentCombat(troop);
        
        return true;
    }

    checkAdjacentCombat(troop) {
        const adjacent = [
            { x: troop.x - 1, y: troop.y },
            { x: troop.x + 1, y: troop.y },
            { x: troop.x, y: troop.y - 1 },
            { x: troop.x, y: troop.y + 1 }
        ];

        for (const pos of adjacent) {
            const enemy = this.getTroopAt(pos.x, pos.y);
            if (enemy && enemy.player !== troop.player) {
                this.combat(troop, enemy);
                break;
            }
        }
    }

    combat(attacker, defender) {
        const defenderTerrain = this.getTerrainAt(defender.x, defender.y);
        const terrainBonus = CONFIG.TERRAIN_TYPES[defenderTerrain.terrain].defense;
        
        const damage = Math.max(CONFIG.MIN_COMBAT_DAMAGE, attacker.attack - defender.defense - terrainBonus);
        defender.health -= damage;
        
        // Defender counter-attacks if alive
        if (defender.health > 0) {
            const counterDamage = Math.max(CONFIG.MIN_COUNTER_DAMAGE, 
                Math.floor(defender.attack * CONFIG.COUNTER_ATTACK_MULTIPLIER) - attacker.defense);
            attacker.health -= counterDamage;
        }

        // Remove dead troops
        this.playerTroops = this.playerTroops.filter(t => t.health > 0);
        this.enemyTroops = this.enemyTroops.filter(t => t.health > 0);

        // Award score for defeating enemies
        if (defender.health <= 0 && !defender.player) {
            this.score += defender.type === 'CAVALRY' ? 50 : 30;
        }
    }

    endTurn() {
        this.turn++;
        this.resources += CONFIG.RESOURCE_PER_TURN;
        
        // Reset moved status for player troops
        this.playerTroops.forEach(t => t.moved = false);
        
        // Enemy turn
        this.enemyTurn();
        
        // Reset moved status for enemy troops
        this.enemyTroops.forEach(t => t.moved = false);
        
        // Award turn survival bonus
        this.score += 10;
    }

    enemyTurn() {
        // Simple AI: move towards nearest player troop and attack
        this.enemyTroops.forEach(enemy => {
            if (this.playerTroops.length === 0) return;
            
            // Find nearest player troop
            let nearest = null;
            let minDist = Infinity;
            
            this.playerTroops.forEach(player => {
                const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = player;
                }
            });

            if (!nearest) return;

            // Move towards player
            const dx = Math.sign(nearest.x - enemy.x);
            const dy = Math.sign(nearest.y - enemy.y);
            
            // Try horizontal movement first
            let targetX = enemy.x + dx;
            let targetY = enemy.y;
            
            if (this.getTroopAt(targetX, targetY) || targetX < 0 || targetX >= CONFIG.MAP_WIDTH) {
                // Try vertical movement instead
                targetX = enemy.x;
                targetY = enemy.y + dy;
            }
            
            // Check if adjacent to player - attack instead of move
            if (Math.abs(enemy.x - nearest.x) + Math.abs(enemy.y - nearest.y) === 1) {
                this.combat(enemy, nearest);
            } else if (targetX >= 0 && targetX < CONFIG.MAP_WIDTH && 
                       targetY >= 0 && targetY < CONFIG.MAP_HEIGHT &&
                       !this.getTroopAt(targetX, targetY)) {
                enemy.x = targetX;
                enemy.y = targetY;
                
                // Check for adjacent player after moving
                this.checkAdjacentCombat(enemy);
            }
        });
    }

    checkVictory() {
        if (this.enemyTroops.length === 0) {
            return 'victory';
        }
        if (this.playerTroops.length === 0) {
            return 'defeat';
        }
        return null;
    }
}

// Game Manager
class Game {
    constructor() {
        this.state = new GameState();
        this.canvas = null;
        this.ctx = null;
        this.currentScreen = 'menu';
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.showScreen('menu');
    }

    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('tutorial-btn').addEventListener('click', () => this.showScreen('tutorial'));
        document.getElementById('about-btn').addEventListener('click', () => this.showScreen('about'));
        document.getElementById('tutorial-back-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('about-back-btn').addEventListener('click', () => this.showScreen('menu'));

        // Game controls
        document.getElementById('deploy-infantry-btn').addEventListener('click', () => this.setDeploymentMode('INFANTRY'));
        document.getElementById('deploy-cavalry-btn').addEventListener('click', () => this.setDeploymentMode('CAVALRY'));
        document.getElementById('end-turn-btn').addEventListener('click', () => this.endTurn());

        // Victory/Defeat buttons
        document.getElementById('victory-continue-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('victory-menu-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('defeat-retry-btn').addEventListener('click', () => this.startGame(this.state.level));
        document.getElementById('defeat-menu-btn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('fact-continue-btn').addEventListener('click', () => this.showScreen('game'));

        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Handle canvas clicks
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const clickEvent = {
                offsetX: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
                offsetY: (touch.clientY - rect.top) * (this.canvas.height / rect.height)
            };
            this.handleCanvasClick(clickEvent);
        });

        // Resize canvas
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        if (this.currentScreen === 'game') {
            this.render();
        }
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.currentScreen = screenName;
        
        if (screenName === 'game') {
            this.resizeCanvas();
            this.render();
        }
    }

    startGame(level = 1) {
        this.state.reset(level);
        this.updateHUD();
        
        if (level > 1) {
            this.showHistoricalFact(level - 1);
        } else {
            this.showScreen('game');
        }
    }

    showHistoricalFact(index) {
        // Show fact based on level completed (level 2 shows fact for level 1, etc.)
        const fact = HISTORICAL_FACTS[(index - 1) % HISTORICAL_FACTS.length];
        const factContent = document.getElementById('fact-content');
        factContent.innerHTML = `
            <h3>${fact.title}</h3>
            <p>${fact.text}</p>
        `;
        this.showScreen('fact');
    }

    setDeploymentMode(type) {
        if (this.state.resources < CONFIG.TROOP_TYPES[type].cost) {
            this.showMessage('Not enough resources!');
            return;
        }
        
        this.state.deploymentMode = type;
        this.state.selectedTroop = null;
        this.showMessage(`Click on the map to deploy ${type.toLowerCase()}`);
        this.render();
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const clickX = e.offsetX || ((e.clientX - rect.left) * scaleX);
        const clickY = e.offsetY || ((e.clientY - rect.top) * scaleY);
        
        const tileX = Math.floor(clickX / CONFIG.TILE_SIZE);
        const tileY = Math.floor(clickY / CONFIG.TILE_SIZE);

        if (tileX < 0 || tileX >= CONFIG.MAP_WIDTH || tileY < 0 || tileY >= CONFIG.MAP_HEIGHT) {
            return;
        }

        // Deployment mode
        if (this.state.deploymentMode) {
            // Can only deploy in bottom 2 rows
            if (tileY >= CONFIG.MAP_HEIGHT - 2) {
                if (this.state.addPlayerTroop(this.state.deploymentMode, tileX, tileY)) {
                    this.state.deploymentMode = null;
                    this.updateHUD();
                    this.showMessage('Troop deployed!');
                } else {
                    this.showMessage('Cannot deploy here!');
                }
            } else {
                this.showMessage('Can only deploy in your territory (bottom rows)');
            }
            this.render();
            return;
        }

        const clickedTroop = this.state.getTroopAt(tileX, tileY);

        // Select player troop
        if (clickedTroop && clickedTroop.player) {
            this.state.selectedTroop = clickedTroop;
            this.showMessage(`${clickedTroop.type} selected - click adjacent tile to move`);
            this.render();
            return;
        }

        // Move selected troop
        if (this.state.selectedTroop && !this.state.selectedTroop.moved) {
            const distance = Math.abs(this.state.selectedTroop.x - tileX) + 
                           Math.abs(this.state.selectedTroop.y - tileY);
            
            if (distance <= this.state.selectedTroop.speed) {
                if (this.state.moveTroop(this.state.selectedTroop, tileX, tileY)) {
                    this.showMessage('Troop moved!');
                    this.state.selectedTroop = null;
                    this.updateHUD();
                    this.render();
                    
                    // Check victory after movement
                    this.checkGameEnd();
                } else {
                    this.showMessage('Cannot move there!');
                }
            } else {
                this.showMessage('Too far to move!');
            }
        }
    }

    endTurn() {
        this.state.endTurn();
        this.state.selectedTroop = null;
        this.state.deploymentMode = null;
        this.updateHUD();
        this.showMessage(`Turn ${this.state.turn} - Enemy forces advance!`);
        this.render();
        
        // Check victory after enemy turn
        setTimeout(() => this.checkGameEnd(), 500);
    }

    checkGameEnd() {
        const result = this.state.checkVictory();
        if (result === 'victory') {
            this.showVictory();
        } else if (result === 'defeat') {
            this.showDefeat();
        }
    }

    showVictory() {
        const stats = document.getElementById('victory-stats');
        stats.innerHTML = `
            <p><strong>Level ${this.state.level} Complete!</strong></p>
            <p>Turns: ${this.state.turn}</p>
            <p>Remaining Troops: ${this.state.playerTroops.length}</p>
            <p>Level Score: ${this.state.score}</p>
        `;
        this.showScreen('victory');
    }

    showDefeat() {
        const stats = document.getElementById('defeat-stats');
        stats.innerHTML = `
            <p>Level: ${this.state.level}</p>
            <p>Turns Survived: ${this.state.turn}</p>
            <p>Score: ${this.state.score}</p>
        `;
        this.showScreen('defeat');
    }

    nextLevel() {
        this.startGame(this.state.level + 1);
    }

    updateHUD() {
        document.getElementById('level-display').textContent = this.state.level;
        document.getElementById('turn-display').textContent = this.state.turn;
        document.getElementById('resources-display').textContent = this.state.resources;
        document.getElementById('score-display').textContent = this.state.score;

        // Update deployment buttons
        const infantryBtn = document.getElementById('deploy-infantry-btn');
        const cavalryBtn = document.getElementById('deploy-cavalry-btn');
        
        infantryBtn.disabled = this.state.resources < CONFIG.TROOP_TYPES.INFANTRY.cost;
        cavalryBtn.disabled = this.state.resources < CONFIG.TROOP_TYPES.CAVALRY.cost;
    }

    showMessage(message) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = message;
    }

    render() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw map
        for (let y = 0; y < CONFIG.MAP_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
                const tile = this.state.map[y][x];
                const terrain = CONFIG.TERRAIN_TYPES[tile.terrain];
                
                this.ctx.fillStyle = terrain.color;
                this.ctx.fillRect(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, 
                                CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                
                this.ctx.strokeStyle = '#2d5a3d';
                this.ctx.strokeRect(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, 
                                  CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                
                // Draw terrain symbol
                this.ctx.fillStyle = '#1a472a';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(terrain.symbol, 
                                x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                                y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2);
            }
        }

        // Highlight selected troop's range
        if (this.state.selectedTroop && !this.state.selectedTroop.moved) {
            const troop = this.state.selectedTroop;
            for (let dy = -troop.speed; dy <= troop.speed; dy++) {
                for (let dx = -troop.speed; dx <= troop.speed; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= troop.speed) {
                        const x = troop.x + dx;
                        const y = troop.y + dy;
                        if (x >= 0 && x < CONFIG.MAP_WIDTH && y >= 0 && y < CONFIG.MAP_HEIGHT) {
                            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                            this.ctx.fillRect(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE,
                                            CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                        }
                    }
                }
            }
        }

        // Draw troops
        [...this.state.enemyTroops, ...this.state.playerTroops].forEach(troop => {
            const x = troop.x * CONFIG.TILE_SIZE;
            const y = troop.y * CONFIG.TILE_SIZE;
            
            // Draw background circle
            this.ctx.fillStyle = troop.player ? '#009639' : '#CE1126';
            this.ctx.beginPath();
            this.ctx.arc(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2, 
                        CONFIG.TILE_SIZE / 2 - 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw border for selected troop
            if (troop === this.state.selectedTroop) {
                this.ctx.strokeStyle = '#FFDE00';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
            
            // Draw troop symbol
            const symbol = troop.player ? 
                CONFIG.TROOP_TYPES[troop.type].symbol : 
                CONFIG.ENEMY_TYPES[troop.type].symbol;
            
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(symbol, x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2);
            
            // Draw health bar
            const healthPercent = troop.health / troop.maxHealth;
            const barWidth = CONFIG.TILE_SIZE - 10;
            const barHeight = 5;
            
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(x + 5, y + CONFIG.TILE_SIZE - 10, barWidth, barHeight);
            
            this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : 
                                healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            this.ctx.fillRect(x + 5, y + CONFIG.TILE_SIZE - 10, 
                            barWidth * healthPercent, barHeight);
        });
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});
