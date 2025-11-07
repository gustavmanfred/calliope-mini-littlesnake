// --- Compute next head position ---
function computeNextPosition (x: number, y: number, dir: number) {
    nx = x
    ny = y
    if (dir == 0) {
        ny = y - 1
    } else if (dir == 90) {
        nx = x + 1
    } else if (dir == 180) {
        ny = y + 1
    } else if (dir == 270) {
        nx = x - 1
    }
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
    return [nx, ny]
}
// --- Eat mushroom and grow ---
function eatMushroomAndGrowSnake () {
    growTailByOne()
    music.playTone(659, music.beat(BeatFraction.Eighth))
    gameScore += 1
    oldSpeed = snakeSpeed
    snakeSpeed = Math.max(MIN_SPEED, snakeSpeed - SPEED_STEP)
    if (snakeSpeed < oldSpeed) {
        music.playTone(988, music.beat(BeatFraction.Sixteenth))
    }
    setMushroom()
}
// --- Start / Restart ---
function startGame () {
    clearAllSprites()
    snakeSpeed = INITIAL_SPEED
    gameScore = 0
    snakeCrash = false
    gameRunning = true
    directionDeg = 90
    snakeHead = game.createSprite(2, 2)
    snakeHead.turn(Direction.Right, 90)
    for (let j = 3; j >= 1; j--) { basic.showNumber(j); music.playTone(523, music.beat(BeatFraction.Quarter)); basic.pause(400) }
music.playTone(784, music.beat(BeatFraction.Quarter))
    basic.showString("GO!")
    setMushroom()
}
// --- Input ---
input.onButtonPressed(Button.A, function () {
    if (!(gameRunning)) {
        return
    }
    directionDeg = (directionDeg + 270) % 360
    snakeHead.turn(Direction.Left, 90)
})
// --- Move snake one step ---
function moveSnake () {
    if (!(snakeHead)) {
        return
    }
    prevX = snakeHead.get(LedSpriteProperty.X)
    prevY = snakeHead.get(LedSpriteProperty.Y)
    pos = computeNextPosition(prevX, prevY, directionDeg)
    nx = pos[0]
    ny = pos[1]
    if (snakeTail.length > 0) {
        for (let i = snakeTail.length - 1; i > 0; i--) {
            snakeTail[i].set(LedSpriteProperty.X, snakeTail[i - 1].get(LedSpriteProperty.X))
            snakeTail[i].set(LedSpriteProperty.Y, snakeTail[i - 1].get(LedSpriteProperty.Y))
        }
snakeTail[0].set(LedSpriteProperty.X, prevX)
        snakeTail[0].set(LedSpriteProperty.Y, prevY)
    }
    snakeHead.set(LedSpriteProperty.X, nx)
    snakeHead.set(LedSpriteProperty.Y, ny)
    for (let segment of snakeTail) {
        if (snakeHead.get(LedSpriteProperty.X) == segment.get(LedSpriteProperty.X) && snakeHead.get(LedSpriteProperty.Y) == segment.get(LedSpriteProperty.Y)) {
            snakeCrash = true
            break;
        }
    }
    if (mushroom) {
        if (snakeHead.get(LedSpriteProperty.X) == mushroom.get(LedSpriteProperty.X) && snakeHead.get(LedSpriteProperty.Y) == mushroom.get(LedSpriteProperty.Y)) {
            mushroom.delete()
            mushroom = null
eatMushroomAndGrowSnake()
        }
    }
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
input.onButtonPressed(Button.AB, function () {
    if (!(gameRunning)) {
        startGame()
    }
})
input.onButtonPressed(Button.B, function () {
    if (!(gameRunning)) {
        return
    }
    directionDeg = (directionDeg + 90) % 360
    snakeHead.turn(Direction.Right, 90)
})
// --- Add one tail segment ---
function growTailByOne () {
    if (snakeTail.length == 0) {
        nx = snakeHead.get(LedSpriteProperty.X)
        ny = snakeHead.get(LedSpriteProperty.Y)
    } else {
        nx = snakeTail[snakeTail.length - 1].get(LedSpriteProperty.X)
        ny = snakeTail[snakeTail.length - 1].get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(nx, ny))
}
// --- Place a new mushroom (not on snake) ---
function setMushroom () {
    valid = false
    while (!(valid)) {
        nx = randint(0, 4)
        ny = randint(0, 4)
        valid = true
        if (snakeHead && snakeHead.get(LedSpriteProperty.X) == nx && snakeHead.get(LedSpriteProperty.Y) == ny) {
            valid = false
        }
        for (let part of snakeTail) {
            if (part.get(LedSpriteProperty.X) == nx && part.get(LedSpriteProperty.Y) == ny) {
                valid = false
                break;
            }
        }
    }
    if (mushroom) {
        mushroom.delete()
    }
    mushroom = game.createSprite(nx, ny)
    mushroom.set(LedSpriteProperty.Blink, 150)
}
// --- Helper: delete all sprites safely ---
function clearAllSprites () {
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
/**
 * ---------------------------------------------------------
 * 
 * SNAKE GAME – Calliope mini V2 (blockeditor-ready)
 * 
 * ---------------------------------------------------------
 */
/**
 * temporäre Variablen (für Blockeditor sauber)
 */
let valid = false
let pos: number[] = []
let prevY = 0
let prevX = 0
let gameRunning = false
let snakeCrash = false
let oldSpeed = 0
let gameScore = 0
let ny = 0
let nx = 0
let directionDeg = 0
let snakeSpeed = 0
let MIN_SPEED = 0
let SPEED_STEP = 0
let INITIAL_SPEED = 0
let mushroom: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
// --- Game state (globale Variablen) ---
let snakeHead: game.LedSprite = null
// --- Game constants ---
INITIAL_SPEED = 900
SPEED_STEP = 75
MIN_SPEED = 150
snakeSpeed = INITIAL_SPEED
directionDeg = 90
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
