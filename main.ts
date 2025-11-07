// Calculate next position (with wrap-around)
function computeNextPosition (x: number, y: number, dir: number) {
    nx2 = x
    ny2 = y
    if (dir == 0) {
        ny2 += -1
    } else if (dir == 90) {
        nx2 += 1
    } else if (dir == 180) {
        ny2 += 1
    } else if (dir == 270) {
        nx2 += -1
    }
    if (nx2 < 0) {
        nx2 = 4
    }
    if (nx2 > 4) {
        nx2 = 0
    }
    if (ny2 < 0) {
        ny2 = 4
    }
    if (ny2 > 4) {
        ny2 = 0
    }
    return [nx2, ny2]
}
// When eating a mushroom
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
// --- Start the game ---
function startGame () {
    clearAllSprites()
    snakeSpeed = INITIAL_SPEED
    gameScore = 0
    snakeCrash = false
    gameRunning = true
    directionDeg = 90
    snakeHead = game.createSprite(2, 2)
    for (let j = 3; j >= 1; j--) {
        basic.showNumber(j)
        music.playTone(523, music.beat(BeatFraction.Quarter))
        basic.pause(400)
    }
music.playTone(784, music.beat(BeatFraction.Quarter))
    basic.showString("GO!")
    setMushroom()
}
// --- Controls ---
input.onButtonPressed(Button.A, function () {
    if (gameRunning) {
        directionDeg = (directionDeg + 270) % 360
    }
})
// Move the snake one step
function moveSnake () {
    if (!(snakeHead)) {
        return
    }
    px = snakeHead.get(LedSpriteProperty.X)
    py = snakeHead.get(LedSpriteProperty.Y)
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
    for (let seg of snakeTail) {
        if (snakeHead.get(LedSpriteProperty.X) == seg.get(LedSpriteProperty.X) && snakeHead.get(LedSpriteProperty.Y) == seg.get(LedSpriteProperty.Y)) {
            snakeCrash = true
        }
    }
    // Check if mushroom eaten
    if (mushroom && snakeHead.get(LedSpriteProperty.X) == mushroom.get(LedSpriteProperty.X) && snakeHead.get(LedSpriteProperty.Y) == mushroom.get(LedSpriteProperty.Y)) {
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
        control.inBackground(() => {
            while (!input.buttonIsPressed(Button.AB)) {
                basic.pause(100)
            }
            startGame()
        })
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
// Extend snake by one segment
function growTailByOne () {
    if (snakeTail.length == 0) {
        nx = snakeHead.get(LedSpriteProperty.X)
        ny = snakeHead.get(LedSpriteProperty.Y)
    } else {
        last = snakeTail[snakeTail.length - 1]
        nx = last.get(LedSpriteProperty.X)
        ny = last.get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(nx, ny))
}
// Place mushroom randomly (not on snake)
function setMushroom () {
    while (!(valid)) {
        x = randint(0, 4)
        y = randint(0, 4)
        valid = true
        if (snakeHead && snakeHead.get(LedSpriteProperty.X) == x && snakeHead.get(LedSpriteProperty.Y) == y) {
            valid = false
        }
        for (let part of snakeTail) {
            if (part.get(LedSpriteProperty.X) == x && part.get(LedSpriteProperty.Y) == y) {
                valid = false
            }
        }
    }
    if (mushroom) {
        mushroom.delete()
    }
    mushroom = game.createSprite(x, y)
    mushroom.set(LedSpriteProperty.Blink, 150)
}
// 0=up, 90=right, 180=down, 270=left
// --- Utility functions ---
function clearAllSprites () {
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
let y = 0
let x = 0
let valid = false
let last: game.LedSprite = null
let py = 0
let px = 0
let gameRunning = false
let snakeCrash = false
let oldSpeed = 0
let gameScore = 0
let ny2 = 0
let nx2 = 0
let directionDeg = 0
let snakeSpeed = 0
let MIN_SPEED = 0
let SPEED_STEP = 0
let INITIAL_SPEED = 0
let mushroom: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
// --- Game state ---
let snakeHead: game.LedSprite = null
let ny = 0
let nx = 0
// --- Constants ---
INITIAL_SPEED = 900
SPEED_STEP = 75
MIN_SPEED = 150
snakeSpeed = INITIAL_SPEED
// 0=up, 90=right, 180=down, 270=left
directionDeg = 90
// --- Initialize randomness ---
let seedVal = input.runningTime() + control.deviceSerialNumber()
// warm-up
Math.random()
// --- Auto-start on power up ---
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
