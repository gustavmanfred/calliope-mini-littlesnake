// ================================================================
// 🐍 SNAKE GAME – Calliope mini V2
// ================================================================
// Controls:
//   A   → Turn left
//   B   → Turn right
//   A+B → Restart after Game Over
//
// Features:
//   - Smooth movement using internal direction logic (no error 104)
//   - Start countdown with tones
//   - Eat and Game Over sound effects
//   - Gradual speed increase as score rises
//   - Score display at Game Over + restart option
// ================================================================

// --- GAME CONSTANTS ---
const INITIAL_SPEED = 900   // Start delay (ms) — higher = slower
const SPEED_STEP = 75       // Speed-up per mushroom
const MIN_SPEED = 150       // Fastest possible delay (lower limit)

// --- GAME STATE VARIABLES ---
let snakeHead: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
let mushroom: game.LedSprite = null
let snakeSpeed = INITIAL_SPEED
let gameScore = 0
let snakeCrash = false
let gameRunning = false
let directionDeg = 90  // 0 = up, 90 = right, 180 = down, 270 = left

// --- HELPER: clear all sprites safely ---
function clearAllSprites(): void {
    if (snakeHead) { snakeHead.delete(); snakeHead = null }
    for (let part of snakeTail) part.delete()
    snakeTail = []
    if (mushroom) { mushroom.delete(); mushroom = null }
}

// --- PLACE A NEW MUSHROOM ---
function setMushroom(): void {
    let x = 0, y = 0, valid = false
    while (!valid) {
        x = randint(0, 4)
        y = randint(0, 4)
        valid = true
        // avoid head or tail positions
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

// --- HANDLE EATING A MUSHROOM ---
function eatMushroomAndGrowSnake(): void {
    let newX = 0, newY = 0
    // grow tail from last segment
    if (snakeTail.length == 0) {
        newX = snakeHead.get(LedSpriteProperty.X)
        newY = snakeHead.get(LedSpriteProperty.Y)
    } else {
        newX = snakeTail[snakeTail.length - 1].get(LedSpriteProperty.X)
        newY = snakeTail[snakeTail.length - 1].get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(newX, newY))

    // sound feedback (eat tone)
    music.playTone(659, music.beat(BeatFraction.Eighth))

    // update score & increase speed
    gameScore += 1
    let oldSpeed = snakeSpeed
    snakeSpeed = Math.max(MIN_SPEED, snakeSpeed - SPEED_STEP)
    if (snakeSpeed < oldSpeed) {
        // quick speed-up tone
        music.playTone(988, music.beat(BeatFraction.Sixteenth))
    }

    // place new mushroom
    setMushroom()
}

// --- COMPUTE NEXT HEAD POSITION ---
function computeNextPosition(x: number, y: number, dirDeg: number): number[] {
    let nx = x, ny = y
    if (dirDeg == 0) ny--
    else if (dirDeg == 90) nx++
    else if (dirDeg == 180) ny++
    else if (dirDeg == 270) nx--

    // screen wrapping
    if (nx < 0) nx = 4
    if (nx > 4) nx = 0
    if (ny < 0) ny = 4
    if (ny > 4) ny = 0
    return [nx, ny]
}

// --- MOVE SNAKE ONE STEP ---
function moveSnake(): void {
    if (!snakeHead) return

    let prevX = snakeHead.get(LedSpriteProperty.X)
    let prevY = snakeHead.get(LedSpriteProperty.Y)

    // compute next position from internal direction
    let [nx, ny] = computeNextPosition(prevX, prevY, directionDeg)
    snakeHead.set(LedSpriteProperty.X, nx)
    snakeHead.set(LedSpriteProperty.Y, ny)

    // update tail
    if (snakeTail.length > 0) {
        snakeTail.unshift(game.createSprite(prevX, prevY))
        let tailEnd = snakeTail.pop()
        if (tailEnd) tailEnd.delete()
    }

    // collision with own tail
    for (let segment of snakeTail)
        if (snakeHead.isTouching(segment))
            snakeCrash = true

    // eat mushroom
    if (mushroom && snakeHead.isTouching(mushroom))
        eatMushroomAndGrowSnake()

    // handle crash
    if (snakeCrash) {
        gameRunning = false
        music.startMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once)
        basic.pause(300)
        basic.showString("GAME OVER")
        basic.pause(500)
        basic.showString("SCORE:")
        basic.showNumber(gameScore)
        basic.pause(500)
        basic.showString("A+B = RESTART")
    }
}

// --- BUTTON CONTROLS ---
input.onButtonPressed(Button.A, function () {
    if (gameRunning) {
        directionDeg = (directionDeg + 270) % 360  // turn left
        snakeHead.turn(Direction.Left, 90)
    }
})
input.onButtonPressed(Button.B, function () {
    if (gameRunning) {
        directionDeg = (directionDeg + 90) % 360   // turn right
        snakeHead.turn(Direction.Right, 90)
    }
})
input.onButtonPressed(Button.AB, function () {
    if (!gameRunning) startGame()
})

// --- START / RESTART GAME ---
function startGame(): void {
    clearAllSprites()
    snakeSpeed = INITIAL_SPEED
    gameScore = 0
    snakeCrash = false
    gameRunning = true
    directionDeg = 90

    // create snake head
    snakeHead = game.createSprite(2, 2)
    snakeHead.turn(Direction.Right, 90)

    // countdown intro
    for (let i = 3; i >= 1; i--) {
        basic.showNumber(i)
        music.playTone(523, music.beat(BeatFraction.Quarter))
        basic.pause(200)
    }
    music.playTone(784, music.beat(BeatFraction.Quarter))
    basic.showString("GO!")
    setMushroom()
}

// --- MAIN LOOP ---
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
