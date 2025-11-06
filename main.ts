// Snake Game for Calliope mini V2 (enhanced with sound and score display)
// ---------------------------------------------------------
// Controls:
//  - Button A → Turn Left
//  - Button B → Turn Right
//  - Button A+B → Restart after Game Over
//
// Features:
//  - Eat mushrooms to grow and speed up
//  - Sound feedback for eating and game over
//  - Score display after Game Over
//  - Mini countdown with sound at start
// ---------------------------------------------------------

// --- Variables ---
let snakeHead: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
let mushroom: game.LedSprite = null
let snakeSpeed = 500
let gameScore = 0
let snakeCrash = false
let gameRunning = false

// --- Function: place a new mushroom (not on snake) ---
function setMushroom(): void {
    let x = 0
    let y = 0
    let validPosition = false
    while (!validPosition) {
        x = randint(0, 4)
        y = randint(0, 4)
        validPosition = true
        if (snakeHead.get(LedSpriteProperty.X) == x && snakeHead.get(LedSpriteProperty.Y) == y) validPosition = false
        for (let part of snakeTail) {
            if (part.get(LedSpriteProperty.X) == x && part.get(LedSpriteProperty.Y) == y) validPosition = false
        }
    }
    if (mushroom) mushroom.delete()
    mushroom = game.createSprite(x, y)
    mushroom.set(LedSpriteProperty.Blink, 100)
}

// --- Function: grow the snake after eating ---
function eatMushroomAndGrowSnake(): void {
    let x = 0
    let y = 0
    if (snakeTail.length == 0) {
        x = snakeHead.get(LedSpriteProperty.X)
        y = snakeHead.get(LedSpriteProperty.Y)
    } else {
        x = snakeTail[snakeTail.length - 1].get(LedSpriteProperty.X)
        y = snakeTail[snakeTail.length - 1].get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(x, y))
    if (mushroom) {
        mushroom.delete()
        mushroom = null
    }
    // Increment score
    gameScore += 1
    // Speed up if possible
    if (snakeSpeed > 100) {
        snakeSpeed -= 25
        music.playTone(988, music.beat(BeatFraction.Sixteenth)) // short speed-up beep
    }
    // Eating sound
    music.playTone(659, music.beat(BeatFraction.Eighth))
    setMushroom()
}

// --- Function: move snake forward ---
function moveSnake(): void {
    let prevX = snakeHead.get(LedSpriteProperty.X)
    let prevY = snakeHead.get(LedSpriteProperty.Y)

    snakeHead.move(1)

    // edge wrapping
    if (snakeHead.get(LedSpriteProperty.X) < 0) snakeHead.set(LedSpriteProperty.X, 4)
    if (snakeHead.get(LedSpriteProperty.X) > 4) snakeHead.set(LedSpriteProperty.X, 0)
    if (snakeHead.get(LedSpriteProperty.Y) < 0) snakeHead.set(LedSpriteProperty.Y, 4)
    if (snakeHead.get(LedSpriteProperty.Y) > 4) snakeHead.set(LedSpriteProperty.Y, 0)

    // tail update
    if (snakeHead.get(LedSpriteProperty.X) != prevX || snakeHead.get(LedSpriteProperty.Y) != prevY) {
        if (snakeTail.length > 0) {
            snakeTail.unshift(game.createSprite(prevX, prevY))
            let tailEnd = snakeTail.pop()
            if (tailEnd) tailEnd.delete()
        }
        // collision with tail
        for (let segment of snakeTail) {
            if (snakeHead.isTouching(segment)) {
                snakeCrash = true
                break
            }
        }
    } else {
        snakeCrash = true
    }

    // mushroom collision
    if (mushroom && snakeHead.isTouching(mushroom)) {
        eatMushroomAndGrowSnake()
    }

    // crash
    if (snakeCrash) {
        music.startMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once)
        game.setScore(gameScore)
        gameRunning = false
        basic.showString("Score:" + gameScore)
    }
}

// --- Button Controls ---
input.onButtonPressed(Button.A, function () {
    if (gameRunning) snakeHead.turn(Direction.Left, 90)
})
input.onButtonPressed(Button.B, function () {
    if (gameRunning) snakeHead.turn(Direction.Right, 90)
})
// Restart game with A+B after crash
input.onButtonPressed(Button.AB, function () {
    if (!gameRunning) startGame()
})

// --- Game Setup Function ---
function startGame(): void {
    // clear old sprites
    if (snakeHead) snakeHead.delete()
    for (let part of snakeTail) {
        part.delete()
    }
    if (mushroom) mushroom.delete()

    snakeHead = game.createSprite(2, 2)
    snakeHead.turn(Direction.Right, 90)
    snakeTail = []
    snakeSpeed = 500
    gameScore = 0
    snakeCrash = false
    gameRunning = true

    // Start countdown
    for (let i = 3; i > 0; i--) {
        basic.showNumber(i)
        music.playTone(523, music.beat(BeatFraction.Quarter))
        basic.pause(200)
    }
    basic.showString("Go!")
    setMushroom()
}

// --- Main Game Loop ---
basic.forever(function () {
    if (gameRunning) {
        moveSnake()
        basic.pause(snakeSpeed)
    }
})
