// Snake Game for Calliope mini V2 (robust version: internal direction, no property read)
// -----------------------------------------------------------------------------
// Controls:
//  - Button A → Turn Left
//  - Button B → Turn Right
//  - Button A+B → Restart after Game Over
//
// Notes:
//  - We keep an internal `directionDeg` (0 = up, 90 = right, 180 = down, 270 = left)
//    and update it whenever the head turns. This avoids reading sprite Direction
//    properties that can cause runtime errors on some runtimes (error 104).
//  - Movement is computed from `directionDeg` and set via set(LedSpriteProperty.X/Y).
// -----------------------------------------------------------------------------

// --- Configuration ---
const INITIAL_SPEED = 900      // starting delay (ms) — higher = slower
const SPEED_STEP = 75          // decrease delay by this much per eaten mushroom
const MIN_SPEED = 150          // smallest allowed delay (fastest)

// --- State variables ---
let snakeHead: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
let mushroom: game.LedSprite = null

let snakeSpeed = INITIAL_SPEED
let gameScore = 0
let snakeCrash = false
let gameRunning = false

// internal direction (degrees): 0 = up, 90 = right, 180 = down, 270 = left
let directionDeg = 90

// --- Utility: clear all sprites ---
function clearAllSprites(): void {
    if (snakeHead) {
        snakeHead.delete()
        snakeHead = null
    }
    for (let p of snakeTail) {
        p.delete()
    }
    snakeTail = []
    if (mushroom) {
        mushroom.delete()
        mushroom = null
    }
}

// --- Place a new mushroom (not on snake) ---
function setMushroom(): void {
    let x = 0
    let y = 0
    let valid = false
    while (!valid) {
        x = randint(0, 4)
        y = randint(0, 4)
        valid = true
        // avoid head
        if (snakeHead && snakeHead.get(LedSpriteProperty.X) == x && snakeHead.get(LedSpriteProperty.Y) == y) valid = false
        // avoid tail
        for (let part of snakeTail) {
            if (part.get(LedSpriteProperty.X) == x && part.get(LedSpriteProperty.Y) == y) {
                valid = false
                break
            }
        }
    }
    if (mushroom) mushroom.delete()
    mushroom = game.createSprite(x, y)
    mushroom.set(LedSpriteProperty.Blink, 120)
}

// --- Grow snake after eating ---
function eatMushroomAndGrowSnake(): void {
    let newX = 0
    let newY = 0
    if (snakeTail.length == 0) {
        newX = snakeHead.get(LedSpriteProperty.X)
        newY = snakeHead.get(LedSpriteProperty.Y)
    } else {
        newX = snakeTail[snakeTail.length - 1].get(LedSpriteProperty.X)
        newY = snakeTail[snakeTail.length - 1].get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(newX, newY))

    // eat sound
    music.playTone(659, music.beat(BeatFraction.Eighth))

    // increment score and speed up
    gameScore += 1
    let oldSpeed = snakeSpeed
    snakeSpeed = Math.max(MIN_SPEED, snakeSpeed - SPEED_STEP)
    if (snakeSpeed < oldSpeed) {
        // short speed-up beep
        music.playTone(988, music.beat(BeatFraction.Sixteenth))
    }

    // spawn next mushroom
    setMushroom()
}

// --- Compute next position from internal direction and wrap edges ---
function computeNextPositionFromDirection(x: number, y: number, dirDeg: number): number[] {
    let nx = x
    let ny = y
    if (dirDeg == 0) {
        ny = y - 1
    } else if (dirDeg == 90) {
        nx = x + 1
    } else if (dirDeg == 180) {
        ny = y + 1
    } else if (dirDeg == 270) {
        nx = x - 1
    }
    // wrap
    if (nx < 0) nx = 4
    if (nx > 4) nx = 0
    if (ny < 0) ny = 4
    if (ny > 4) ny = 0
    return [nx, ny]
}

// --- Move snake using computed next position ---
function moveSnake(): void {
    if (!snakeHead) return

    let prevX = snakeHead.get(LedSpriteProperty.X)
    let prevY = snakeHead.get(LedSpriteProperty.Y)

    // get next pos from our internal direction
    let nxt = computeNextPositionFromDirection(prevX, prevY, directionDeg)
    let nx = nxt[0]
    let ny = nxt[1]

    // set head to new pos
    snakeHead.set(LedSpriteProperty.X, nx)
    snakeHead.set(LedSpriteProperty.Y, ny)

    // update tail
    if (snakeTail.length > 0) {
        snakeTail.unshift(game.createSprite(prevX, prevY))
        let tailEnd = snakeTail.pop()
        if (tailEnd) tailEnd.delete()
    }

    // check collision with tail
    for (let segment of snakeTail) {
        if (snakeHead.isTouching(segment)) {
            snakeCrash = true
            break
        }
    }

    // check mushroom collision
    if (mushroom && snakeHead.isTouching(mushroom)) {
        eatMushroomAndGrowSnake()
    }

    // handle crash
    if (snakeCrash) {
        gameRunning = false
        // game over melody
        music.startMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once)
        basic.pause(100)
        basic.showString("Game Over")
        basic.pause(150)
        basic.showString("Score")
        basic.pause(100)
        basic.showNumber(gameScore)
    }
}

// --- Controls: update internal direction on turns ---
input.onButtonPressed(Button.A, function () {
    if (gameRunning) {
        // turn left: -90 degrees -> add 270 mod 360
        directionDeg = (directionDeg + 270) % 360
        // visually rotate the sprite as well for compatibility
        snakeHead.turn(Direction.Left, 90)
    }
})
input.onButtonPressed(Button.B, function () {
    if (gameRunning) {
        // turn right: +90 degrees
        directionDeg = (directionDeg + 90) % 360
        snakeHead.turn(Direction.Right, 90)
    }
})
// Restart with A+B after game over
input.onButtonPressed(Button.AB, function () {
    if (!gameRunning) startGame()
})

// --- Start / Restart game ---
function startGame(): void {
    clearAllSprites()
    snakeSpeed = INITIAL_SPEED
    gameScore = 0
    snakeCrash = false
    gameRunning = true
    directionDeg = 90 // start facing right

    // spawn head
    snakeHead = game.createSprite(2, 2)
    // rotate sprite visually to match direction (right)
    // ensure predictable orientation: call turn right once
    snakeHead.turn(Direction.Right, 90)

    // countdown with tones
    for (let i = 3; i >= 1; i--) {
        basic.showNumber(i)
        music.playTone(523, music.beat(BeatFraction.Quarter))
        basic.pause(200)
    }
    basic.showString("Go!")
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

// start automatically
startGame()
