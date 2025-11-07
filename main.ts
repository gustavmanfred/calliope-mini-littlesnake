/**
 * ---------------------------------------------------------
 *  SNAKE GAME – Calliope mini V2 (production-ready)
 *
 *  Controls:
 *    A     -> turn left
 *    B     -> turn right
 *    A+B   -> restart after Game Over
 *
 *  Features:
 *    - Internal direction logic (no sprite direction reads)
 *    - Stable tail movement (position updates in place)
 *    - Random mushroom positions (never on snake)
 *    - Countdown intro with tones
 *    - Eat sound and speed-up tone
 *    - Game-over melody
 *    - Score display and restart prompt
 * ---------------------------------------------------------
 */

// --- Game constants ---
const INITIAL_SPEED = 900   // starting delay (ms) — higher = slower
const SPEED_STEP = 75       // how much faster per eaten mushroom
const MIN_SPEED = 150       // minimum delay (fastest)

// --- Game state ---
let snakeHead: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
let mushroom: game.LedSprite = null
let snakeSpeed = INITIAL_SPEED
let gameScore = 0
let snakeCrash = false
let gameRunning = false
let directionDeg = 90       // 0 = up, 90 = right, 180 = down, 270 = left

// --- Delete all sprites safely ---
function clearAllSprites(): void {
    if (snakeHead) {
        snakeHead.delete()
        snakeHead = null
    }
    for (let s of snakeTail) {
        s.delete()
    }
    snakeTail = []
    if (mushroom) {
        mushroom.delete()
        mushroom = null
    }
}

// --- Place a new mushroom (not on snake) ---
function setMushroom(): void {
    let valid = false
    let x = 0
    let y = 0
    while (!valid) {
        x = randint(0, 4)
        y = randint(0, 4)
        valid = true
        if (snakeHead) {
            if (snakeHead.get(LedSpriteProperty.X) == x && snakeHead.get(LedSpriteProperty.Y) == y) {
                valid = false
            }
        }
        for (let part of snakeTail) {
            if (part.get(LedSpriteProperty.X) == x && part.get(LedSpriteProperty.Y) == y) {
                valid = false
                break
            }
        }
    }
    if (mushroom) mushroom.delete()
    mushroom = game.createSprite(x, y)
    mushroom.set(LedSpriteProperty.Blink, 150)
}

// --- Add one tail segment ---
function growTailByOne(): void {
    let nx = 0
    let ny = 0
    if (snakeTail.length == 0) {
        nx = snakeHead.get(LedSpriteProperty.X)
        ny = snakeHead.get(LedSpriteProperty.Y)
    } else {
        let lastPart = snakeTail[snakeTail.length - 1]
        nx = lastPart.get(LedSpriteProperty.X)
        ny = lastPart.get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(nx, ny))
}

// --- Eat mushroom ---
function eatMushroomAndGrowSnake(): void {
    growTailByOne()
    music.playTone(659, music.beat(BeatFraction.Eighth))
    gameScore += 1
    let oldSpeed = snakeSpeed
    snakeSpeed = Math.max(MIN_SPEED, snakeSpeed - SPEED_STEP)
    if (snakeSpeed < oldSpeed) {
        music.playTone(988, music.beat(BeatFraction.Sixteenth))
    }
    setMushroom()
}

// --- Compute next position (with wrap) ---
function computeNextPosition(x: number, y: number, dirDegLocal: number): number[] {
    let nx = x
    let ny = y
    if (dirDegLocal == 0) ny = y - 1
    else if (dirDegLocal == 90) nx = x + 1
    else if (dirDegLocal == 180) ny = y + 1
    else if (dirDegLocal == 270) nx = x - 1
    if (nx < 0) nx = 4
    if (nx > 4) nx = 0
    if (ny < 0) ny = 4
    if (ny > 4) ny = 0
    return [nx, ny]
}

// --- Move snake one step ---
function moveSnake(): void {
    if (!snakeHead) return

    let prevX = snakeHead.get(LedSpriteProperty.X)
    let prevY = snakeHead.get(LedSpriteProperty.Y)
    let pos = computeNextPosition(prevX, prevY, directionDeg)
    let nx = pos[0]
    let ny = pos[1]

    // update tail
    if (snakeTail.length > 0) {
        for (let i = snakeTail.length - 1; i > 0; i--) {
            let from = snakeTail[i - 1]
            snakeTail[i].set(LedSpriteProperty.X, from.get(LedSpriteProperty.X))
            snakeTail[i].set(LedSpriteProperty.Y, from.get(LedSpriteProperty.Y))
        }
        snakeTail[0].set(LedSpriteProperty.X, prevX)
        snakeTail[0].set(LedSpriteProperty.Y, prevY)
    }

    snakeHead.set(LedSpriteProperty.X, nx)
    snakeHead.set(LedSpriteProperty.Y, ny)

    // check collision with tail
    for (let segment of snakeTail) {
        if (snakeHead.get(LedSpriteProperty.X) == segment.get(LedSpriteProperty.X) &&
            snakeHead.get(LedSpriteProperty.Y) == segment.get(LedSpriteProperty.Y)) {
            snakeCrash = true
            break
        }
    }

    // check mushroom
    if (mushroom) {
        if (snakeHead.get(LedSpriteProperty.X) == mushroom.get(LedSpriteProperty.X) &&
            snakeHead.get(LedSpriteProperty.Y) == mushroom.get(LedSpriteProperty.Y)) {
            mushroom.delete()
            mushroom = null
            eatMushroomAndGrowSnake()
        }
    }

    // game over
    if (snakeCrash) {
        gameRunning = false
        music.startMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once)
        basic.pause(300)
        basic.showString("GAME OVER")
        basic.pause(500)
        basic.showString("SCORE:")
        basic.showNumber(gameScore)
        basic.pause(300)
        basic.showString("A+B = RESTART")
    }
}

// --- Button handlers ---
input.onButtonPressed(Button.A, function () {
    if (!gameRunning) return
    directionDeg = (directionDeg + 270) % 360
})
input.onButtonPressed(Button.B, function () {
    if (!gameRunning) return
    directionDeg = (directionDeg + 90) % 360
})
input.onButtonPressed(Button.AB, function () {
    if (!gameRunning) {
        startGame()
    }
})

// --- Start / Restart game ---
function startGame(): void {
    clearAllSprites()
    snakeSpeed = INITIAL_SPEED
    gameScore = 0
    snakeCrash = false
    gameRunning = true
    directionDeg = 90
    snakeHead = game.createSprite(2, 2)

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
basic.forever(function () {
    if (gameRunning) {
        moveSnake()
        basic.pause(snakeSpeed)
    } else {
        basic.pause(100)
    }
})

// --- Random seed for true randomness ---
let seedVal = input.runningTime() + control.deviceSerialNumber()
Math.random() // warm-up
// Note: MakeCode runtime automatically handles RNG; no need for control.seedRandom()
