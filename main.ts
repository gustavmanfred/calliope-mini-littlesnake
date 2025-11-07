/**
 * ---------------------------------------------------------
 *  SNAKE GAME – Calliope mini V2 (Final Clean Version)
 * ---------------------------------------------------------
 *  Controls:
 *    A     → Turn left
 *    B     → Turn right
 *    A+B   → Restart game after Game Over
 * ---------------------------------------------------------
 *  Features:
 *    • Stable movement system
 *    • Mushroom never spawns on snake
 *    • Countdown + sounds + score display
 *    • Keeps score visible until restart
 * ---------------------------------------------------------
 */

// --- Constants ---
const INITIAL_SPEED = 900
const SPEED_STEP = 75
const MIN_SPEED = 150

// --- Game state ---
let snakeHead: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
let mushroom: game.LedSprite = null
let snakeSpeed = INITIAL_SPEED
let gameScore = 0
let snakeCrash = false
let gameRunning = false
let directionDeg = 90 // 0=up, 90=right, 180=down, 270=left

// --- Utility functions ---
function clearAllSprites(): void {
    if (snakeHead) snakeHead.delete()
    for (let s of snakeTail) s.delete()
    if (mushroom) mushroom.delete()
    snakeHead = null
    snakeTail = []
    mushroom = null
}

// Place mushroom randomly (not on snake)
function setMushroom(): void {
    let x = 0, y = 0, valid = false
    while (!valid) {
        x = randint(0, 4)
        y = randint(0, 4)
        valid = true
        if (snakeHead && snakeHead.get(LedSpriteProperty.X) == x && snakeHead.get(LedSpriteProperty.Y) == y)
            valid = false
        for (let part of snakeTail)
            if (part.get(LedSpriteProperty.X) == x && part.get(LedSpriteProperty.Y) == y)
                valid = false
    }
    if (mushroom) mushroom.delete()
    mushroom = game.createSprite(x, y)
    mushroom.set(LedSpriteProperty.Blink, 150)
}

// Extend snake by one segment
function growTailByOne(): void {
    let nx = 0, ny = 0
    if (snakeTail.length == 0) {
        nx = snakeHead.get(LedSpriteProperty.X)
        ny = snakeHead.get(LedSpriteProperty.Y)
    } else {
        let last = snakeTail[snakeTail.length - 1]
        nx = last.get(LedSpriteProperty.X)
        ny = last.get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(nx, ny))
}

// When eating a mushroom
function eatMushroomAndGrowSnake(): void {
    growTailByOne()
    music.playTone(659, music.beat(BeatFraction.Eighth))
    gameScore += 1
    let oldSpeed = snakeSpeed
    snakeSpeed = Math.max(MIN_SPEED, snakeSpeed - SPEED_STEP)
    if (snakeSpeed < oldSpeed) music.playTone(988, music.beat(BeatFraction.Sixteenth))
    setMushroom()
}

// Calculate next position (with wrap-around)
function computeNextPosition(x: number, y: number, dir: number): number[] {
    let nx = x, ny = y
    if (dir == 0) ny--
    else if (dir == 90) nx++
    else if (dir == 180) ny++
    else if (dir == 270) nx--
    if (nx < 0) nx = 4
    if (nx > 4) nx = 0
    if (ny < 0) ny = 4
    if (ny > 4) ny = 0
    return [nx, ny]
}

// Move the snake one step
function moveSnake(): void {
    if (!snakeHead) return

    let px = snakeHead.get(LedSpriteProperty.X)
    let py = snakeHead.get(LedSpriteProperty.Y)
    let [nx, ny] = computeNextPosition(px, py, directionDeg)

    // Move tail
    if (snakeTail.length > 0) {
        for (let i = snakeTail.length - 1; i > 0; i--) {
            snakeTail[i].set(LedSpriteProperty.X, snakeTail[i - 1].get(LedSpriteProperty.X))
            snakeTail[i].set(LedSpriteProperty.Y, snakeTail[i - 1].get(LedSpriteProperty.Y))
        }
        snakeTail[0].set(LedSpriteProperty.X, px)
        snakeTail[0].set(LedSpriteProperty.Y, py)
    }

    // Move head
    snakeHead.set(LedSpriteProperty.X, nx)
    snakeHead.set(LedSpriteProperty.Y, ny)

    // Collision with own body
    for (let seg of snakeTail)
        if (snakeHead.get(LedSpriteProperty.X) == seg.get(LedSpriteProperty.X)
            && snakeHead.get(LedSpriteProperty.Y) == seg.get(LedSpriteProperty.Y))
            snakeCrash = true

    // Check if mushroom eaten
    if (mushroom && snakeHead.get(LedSpriteProperty.X) == mushroom.get(LedSpriteProperty.X)
        && snakeHead.get(LedSpriteProperty.Y) == mushroom.get(LedSpriteProperty.Y)) {
        mushroom.delete()
        mushroom = null
        eatMushroomAndGrowSnake()
    }

    // Game over handling
    if (snakeCrash) {
        gameRunning = false
        music.startMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once)
        basic.pause(300)
        basic.showString("GAME OVER")
        basic.pause(400)
        basic.showString("SCORE:")
        basic.showNumber(gameScore)

        // Wait for A+B to restart
        control.inBackground(() => {
            while (!input.buttonIsPressed(Button.AB)) {
                basic.pause(100)
            }
            startGame()
        })
    }
}

// --- Controls ---
input.onButtonPressed(Button.A, () => {
    if (gameRunning) directionDeg = (directionDeg + 270) % 360
})
input.onButtonPressed(Button.B, () => {
    if (gameRunning) directionDeg = (directionDeg + 90) % 360
})
input.onButtonPressed(Button.AB, () => {
    if (!gameRunning) startGame()
})

// --- Start the game ---
function startGame(): void {
    clearAllSprites()
    snakeSpeed = INITIAL_SPEED
    gameScore = 0
    snakeCrash = false
    gameRunning = true
    directionDeg = 90
    snakeHead = game.createSprite(2, 2)

    // Countdown before start
    for (let i = 3; i >= 1; i--) {
        basic.showNumber(i)
        music.playTone(523, music.beat(BeatFraction.Quarter))
        basic.pause(400)
    }
    music.playTone(784, music.beat(BeatFraction.Quarter))
    basic.showString("GO!")
    setMushroom()
}

// --- Main loop ---
basic.forever(() => {
    if (gameRunning) {
        moveSnake()
        basic.pause(snakeSpeed)
    } else {
        basic.pause(100)
    }
})

// --- Initialize randomness ---
let seedVal = input.runningTime() + control.deviceSerialNumber()
Math.random() // warm-up

// --- Auto-start on power up ---
startGame()
