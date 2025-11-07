// --- Eat mushroom ---
function eatMushroom () {
    growTail()
    music.playTone(659, music.beat(BeatFraction.Eighth))
    gameScore += 1
    oldSpeed = snakeSpeed
    snakeSpeed = Math.max(MIN_SPEED, snakeSpeed - SPEED_STEP)
    if (snakeSpeed < oldSpeed) {
        music.playTone(988, music.beat(BeatFraction.Sixteenth))
    }
    setMushroom()
}
// --- Start game ---
function startGame () {
    clearAll()
    snakeSpeed = INITIAL_SPEED
    gameScore = 0
    snakeCrash = false
    gameRunning = true
    directionDeg = 90
    snakeHead = game.createSprite(2, 2)
    snakeTail = []
    for (let j = 3; j > 0; j--) {
        basic.showNumber(j)
        music.playTone(523, music.beat(BeatFraction.Quarter))
        basic.pause(400)
    }
music.playTone(784, music.beat(BeatFraction.Quarter))
    basic.showString("GO!")
    setMushroom()
}
// --- Clear all sprites ---
function clearAll () {
    if (snakeHead) {
        snakeHead.delete()
    }
    for (let s of snakeTail) {
        s.delete()
    }
    if (mushroom) {
        mushroom.delete()
    }
    snakeHead = null
snakeTail = []
    mushroom = null
}
// --- Controls ---
input.onButtonPressed(Button.A, function () {
    if (gameRunning) {
        directionDeg = (directionDeg + 270) % 360
    }
})
// --- Grow tail ---
function growTail () {
    if (snakeTail.length == 0) {
        tx = snakeHead.get(LedSpriteProperty.X)
        ty = snakeHead.get(LedSpriteProperty.Y)
    } else {
        last = snakeTail[snakeTail.length - 1]
        tx = last.get(LedSpriteProperty.X)
        ty = last.get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(tx, ty))
}
// --- Game over ---
function gameOver () {
    gameRunning = false
    music.startMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once)
    basic.pause(300)
    basic.showString("GAME OVER")
    basic.pause(400)
    basic.showString("SCORE:")
    basic.showNumber(gameScore)
    control.inBackground(function () {
        while (!input.buttonIsPressed(Button.AB)) {
            basic.pause(100)
        }
        startGame()
    })
}
// --- Move snake ---
function moveSnake () {
    if (!(snakeHead)) {
        return
    }
    px = snakeHead.get(LedSpriteProperty.X)
    py = snakeHead.get(LedSpriteProperty.Y)
    computeNext()
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
    // Collision with tail
    for (let seg of snakeTail) {
        if (snakeHead.get(LedSpriteProperty.X) == seg.get(LedSpriteProperty.X) && snakeHead.get(LedSpriteProperty.Y) == seg.get(LedSpriteProperty.Y)) {
            snakeCrash = true
        }
    }
    // Eat mushroom
    if (mushroom && snakeHead.get(LedSpriteProperty.X) == mushroom.get(LedSpriteProperty.X) && snakeHead.get(LedSpriteProperty.Y) == mushroom.get(LedSpriteProperty.Y)) {
        mushroom.delete()
        mushroom = null
eatMushroom()
    }
    // Game over
    if (snakeCrash) {
        gameOver()
    }
}
input.onButtonPressed(Button.AB, function () {
    if (!(gameRunning)) {
        startGame()
    }
})
input.onButtonPressed(Button.B, function () {
    if (gameRunning) {
        directionDeg = (directionDeg + 90) % 360
    }
})
// --- Compute next head position ---
function computeNext () {
    nx = snakeHead.get(LedSpriteProperty.X)
    ny = snakeHead.get(LedSpriteProperty.Y)
    if (directionDeg == 0) {
        ny += 0 - 1
    }
    if (directionDeg == 90) {
        nx += 1
    }
    if (directionDeg == 180) {
        ny += 1
    }
    if (directionDeg == 270) {
        nx += 0 - 1
    }
    // Wrap around edges
    if (nx < 0) {
        nx = 4
    }
    if (nx > 4) {
        nx = 0
    }
    if (ny < 0) {
        ny = 4
    }
    if (ny > 4) {
        ny = 0
    }
}
// --- Mushroom spawn (random, never on snake) ---
function setMushroom () {
    do {
        x = randint(0, 4)
        y = randint(0, 4)
        valid2 = true

        if (snakeHead.get(LedSpriteProperty.X) == x &&
            snakeHead.get(LedSpriteProperty.Y) == y) valid2 = false

        for (let part of snakeTail) {
            if (part.get(LedSpriteProperty.X) == x &&
                part.get(LedSpriteProperty.Y) == y) valid2 = false
        }
    } while (!valid2)
if (mushroom) {
        mushroom.delete()
    }
    mushroom = game.createSprite(x, y)
    mushroom.set(LedSpriteProperty.Blink, 150)
}
/**
 * Temporary variables
 */
let ny = 0
let nx = 0
let py = 0
let px = 0
let last: game.LedSprite = null
let ty = 0
let tx = 0
let directionDeg = 0
let gameRunning = false
let snakeCrash = false
let snakeSpeed = 0
let oldSpeed = 0
let gameScore = 0
let MIN_SPEED = 0
let SPEED_STEP = 0
let INITIAL_SPEED = 0
let y = 0
let x = 0
let mushroom: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
// ---------------------------------------------------------
// FINAL SNAKE GAME – Calliope mini V2 (Block Editor Friendly)
// ---------------------------------------------------------
// Controls:
// • A  → turn left
// • B  → turn right
// • A+B → restart after Game Over
// ---------------------------------------------------------
// 
// --- Game variables ---
let snakeHead: game.LedSprite = null
let valid2 = false
INITIAL_SPEED = 900
SPEED_STEP = 75
MIN_SPEED = 150
// --- Auto-start ---
startGame()
// --- Main loop ---
basic.forever(function () {
    if (gameRunning) {
        moveSnake()
        basic.pause(snakeSpeed)
    } else {
        basic.pause(100)
    }
})
