const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth - 6;
canvas.height = window.innerHeight - 6;

// Game state
let gameState = {
    score: 0,
    level: 1,
    lives: 3,
    gameOver: false,
    keys: {},
    lastShot: 0
};

// Player object with increased speed
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 30,
    speed: 8, // Increased from 5
    color: '#00ffff'
};

// Arrays for game objects
let bullets = [];
let enemies = [];
let particles = [];
let powerUps = [];

// Create enhanced starfield
function createStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Add variety to stars
        const rand = Math.random();
        if (rand < 0.1) {
            star.className += ' bright';
        } else if (rand < 0.2) {
            star.className += ' colorful';
        }
        
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = Math.random() * 4 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Input handling
document.addEventListener('keydown', (e) => {
    gameState.keys[e.code] = true;
    
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState.gameOver) {
            restartGame();
        } else {
            shoot();
        }
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.code] = false;
});

// Enhanced shooting function
function shoot() {
    const now = Date.now();
    if (now - gameState.lastShot > 120) { // Faster shooting
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y,
            width: 4,
            height: 15, // Longer bullets
            speed: 12, // Faster bullets
            color: '#ffff00'
        });
        gameState.lastShot = now;
    }
}

// Create enemies with faster movement
function spawnEnemies() {
    if (Math.random() < 0.025 + gameState.level * 0.008) { // Slightly more frequent
        enemies.push({
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 35,
            height: 25,
            speed: 2.5 + gameState.level * 0.5, // Much faster enemies
            color: `hsl(${Math.random() * 60 + 300}, 100%, 60%)`,
            health: Math.floor(Math.random() * 2) + 1
        });
    }
}

// Enhanced particle creation
function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12, // Faster particles
            vy: (Math.random() - 0.5) * 12,
            life: 40, // Longer lasting
            maxLife: 40,
            color: color,
            size: Math.random() * 5 + 2 // Bigger particles
        });
    }
}

// Update game objects
function update() {
    if (gameState.gameOver) return;
    
    // Enhanced player movement with acceleration
    const acceleration = 0.8;
    if (gameState.keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed + acceleration;
    }
    if (gameState.keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed + acceleration;
    }
    if (gameState.keys['ArrowUp'] && player.y > canvas.height / 2) {
        player.y -= player.speed + acceleration;
    }
    if (gameState.keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed + acceleration;
    }
    
    // Update bullets
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
    
    // Update enemies
    enemies = enemies.filter(enemy => {
        enemy.y += enemy.speed;
        return enemy.y < canvas.height + enemy.height;
    });
    
    // Update particles
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.96; // Slightly less friction
        particle.vy *= 0.96;
        return particle.life > 0;
    });
    
    // Collision detection
    checkCollisions();
    
    // Spawn enemies
    spawnEnemies();
    
    // Level progression
    if (gameState.score > gameState.level * 500) {
        gameState.level++;
        updateUI();
    }
    
    // Check if enemies reached bottom
    enemies.forEach(enemy => {
        if (enemy.y > canvas.height - 50) {
            gameState.lives--;
            createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff0000', 15);
            enemies.splice(enemies.indexOf(enemy), 1);
            if (gameState.lives <= 0) {
                endGame();
            }
            updateUI();
        }
    });
}

// Collision detection
function checkCollisions() {
    // Bullet-enemy collisions
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                // Remove bullet
                bullets.splice(bulletIndex, 1);
                
                // Damage enemy
                enemy.health--;
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 8);
                
                if (enemy.health <= 0) {
                    // Remove enemy and add score
                    enemies.splice(enemyIndex, 1);
                    gameState.score += 100;
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ffff00', 15);
                    updateUI();
                }
            }
        });
    });
    
    // Player-enemy collisions
    enemies.forEach((enemy, enemyIndex) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            enemies.splice(enemyIndex, 1);
            gameState.lives--;
            createParticles(player.x + player.width/2, player.y + player.height/2, '#ff0000', 20);
            
            if (gameState.lives <= 0) {
                endGame();
            }
            updateUI();
        }
    });
}

// Enhanced render function
function render() {
    // Clear canvas with trail effect
    ctx.fillStyle = 'rgba(0, 0, 17, 0.15)'; // Slightly more opacity for better trails
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player with enhanced glow effect
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 25;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Enhanced player details
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 5, player.y + 5, 30, 5);
    ctx.fillRect(player.x + 15, player.y - 5, 10, 10);
    
    // Draw bullets with enhanced effects
    bullets.forEach(bullet => {
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        
        // Add bullet trail
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.fillRect(bullet.x, bullet.y + bullet.height, bullet.width, bullet.height);
    });
    
    // Draw enemies with enhanced effects
    enemies.forEach(enemy => {
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Enhanced enemy details
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 5, enemy.y + 8, 25, 3);
        ctx.fillRect(enemy.x + 10, enemy.y + 15, 15, 3);
        
        // Add enemy glow underneath
        ctx.shadowBlur = 5;
        ctx.fillStyle = 'rgba(255, 100, 255, 0.2)';
        ctx.fillRect(enemy.x - 2, enemy.y - 2, enemy.width + 4, enemy.height + 4);
    });
    
    // Draw particles with enhanced effects
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        
        // Add particle glow
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(particle.x + 1, particle.y + 1, particle.size - 2, particle.size - 2);
    });
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('lives').textContent = gameState.lives;
}

// End game
function endGame() {
    gameState.gameOver = true;
    document.getElementById('gameOver').style.display = 'block';
}

// Restart game
function restartGame() {
    gameState = {
        score: 0,
        level: 1,
        lives: 3,
        gameOver: false,
        keys: {},
        lastShot: 0
    };
    
    bullets = [];
    enemies = [];
    particles = [];
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 60;
    
    document.getElementById('gameOver').style.display = 'none';
    updateUI();
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Initialize game
createStars();
updateUI();
gameLoop();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth - 6;
    canvas.height = window.innerHeight - 6;
    player.x = Math.min(player.x, canvas.width - player.width);
    player.y = Math.min(player.y, canvas.height - player.height);
});