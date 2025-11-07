// ================================================================
// 🐍 SNAKE GAME – Calliope mini V2 (final, bug-fixed)
// ================================================================
// Controls:
//   A   → Turn left
//   B   → Turn right
//   A+B → Restart after Game Over
//
// Features:
//   - Internal direction logic (avoids runtime property reads and Error 104)
//   - Countdown intro with tones
//   - Eat sound and game-over melody
//   - Gradual speed increase as score rises
//   - Final score display and restart prompt
//   - Stable tail movement (no flicker / false collisions)
// ================================================================

// --- GAME CONSTANTS ---
const INITIAL_SPEED = 900   // starting delay (ms) — higher = slower
const SPEED_STEP = 75       // ms faster per eaten mushroom
const MIN_SPEED = 150       // fastest allowed delay

// --- GAME STATE ---
let snakeHead: game.LedSprite = null
let snakeTail: game.LedSprite[] = []    // tail segments, each is a sprite we update in-place
let mushroom: game.LedSprite = null
let snakeSpeed = INITIAL_SPEED
let gameScore = 0
let snakeCrash = false
let gameRunning = false
let directionDeg = 90  // 0=up, 90=right, 180=down, 270=left

// --- HELPER: delete all sprites safely ---
function clearAllSprites(): void {
    if (snakeHead) { snakeHead.delete(); snakeHead = null }
    for (let s of snakeTail) s.delete()
    snakeTail = []
    if (mushroom) { mushroom.delete(); mushroom = null }
}

// --- PLACE A NEW MUSHROOM (not on snake) ---
function setMushroom(): void {
    let x = 0, y = 0, valid = false
    while (!valid) {
        x = randint(0, 4)
        y = randint(0, 4)
        valid = true
        // avoid head
        if (snakeHead && snakeHead.get(LedSpriteProperty.X) == x && snakeHead.get(LedSpriteProperty.Y) == y)
            valid = false
        // avoid any tail segment
        for (let part of snakeTail)
            if (part.get(LedSpriteProperty.X) == x && part.get(LedSpriteProperty.Y) == y)
                valid = false
    }
    if (mushroom) mushroom.delete()
    mushroom = game.createSprite(x, y)
    mushroom.set(LedSpriteProperty.Blink, 150)
}

// --- GROW SNAKE: add one tail segment at tail end position ---
function growTailByOne(): void {
    let nx = 0, ny = 0
    if (snakeTail.length == 0) {
        // if no tail, place new segment at the current head position
        nx = snakeHead.get(LedSpriteProperty.X)
        ny = snakeHead.get(LedSpriteProperty.Y)
    } else {
        // otherwise place at the last tail segment position
        let last = snakeTail[snakeTail.length - 1]
        nx = last.get(LedSpriteProperty.X)
        ny = last.get(LedSpriteProperty.Y)
    }
    snakeTail.push(game.createSprite(nx, ny))
}

// --- HANDLE EATING A MUSHROOM ---
function eatMushroomAndGrowSnake(): void {
    // grow tail by creating one new segment at tail end
    growTailByOne()

    // play eat sound
    music.playTone(659, music.beat(BeatFraction.Eighth))

    // update score and speed
    gameScore += 1
    let oldSpeed = snakeSpeed
    snakeSpeed = Math.max(MIN_SPEED, snakeSpeed - SPEED_STEP)
    if (snakeSpeed < oldSpeed) {
        // short beep on speed-up
        music.playTone(988, music.beat(BeatFraction.Sixteenth))
    }

    // spawn next mushroom (safe placement)
    setMushroom()
}

// --- COMPUTE NEXT HEAD POSITION (with wrapping) ---
function computeNextPosition(x: number, y: number, dirDeg: number): number[] {
    let nx = x, ny = y
    if (dirDeg == 0) ny = y - 1
    else if (dirDeg == 90) nx = x + 1
    else if (dirDeg == 180) ny = y + 1
    else if (dirDeg == 270) nx = x - 1

    // wrap edges
    if (nx < 0) nx = 4
    if (nx > 4) nx = 0
    if (ny < 0) ny = 4
    if (ny > 4) ny = 0
    return [nx, ny]
}

// --- MOVE SNAKE ONE STEP (stable tail update) ---
function moveSnake(): void {
    if (!snakeHead) return

    // previous head position
    let prevX = snakeHead.get(LedSpriteProperty.X)
    let prevY = snakeHead.get(LedSpriteProperty.Y)

    // compute next head position
    let [nx, ny] = computeNextPosition(prevX, prevY, directionDeg)

    // --- update tail positions in-place (shift positions, no new sprites)
    if (snakeTail.length > 0) {
        // shift from end to front
        for (let i = snakeTail.length - 1; i > 0; i--) {
            let from = snakeTail[i - 1]
            snakeTail[i].set(LedSpriteProperty.X, from.get(LedSpriteProperty.X))
            snakeTail[i].set(LedSpriteProperty.Y, from.get(LedSpriteProperty.Y))
        }
        // first tail segment follows previous head
        snakeTail[0].set(LedSpriteProperty.X, prevX)
        snakeTail[0].set(LedSpriteProperty.Y, prevY)
    }

    // move head to next position
    snakeHead.set(LedSpriteProperty.X, nx)
    snakeHead.set(LedSpriteProperty.Y, ny)

    // --- check collision with tail (after moving head)
    for (let segment of snakeTail) {
        if (snakeHead.get(LedSpriteProperty.X) == segment.get(LedSpriteProperty.X) &&
            snakeHead.get(LedSpriteProperty.Y) == segment.get(LedSpriteProperty.Y)) {
            snakeCrash = true
            break
        }
    }

    // check mushroom collision (eat)
    if (mushroom && snakeHead.get(LedSpriteProperty.X) == mushroom.get(LedSpriteProperty.X) &&
        snakeHead.get(LedSpriteProperty.Y) == mushroom.get(LedSpriteProperty.Y)) {
        // delete mushroom first to avoid double-detection
        if (mushroom) { mushroom.delete(); mushroom = null }
        eatMushroomAndGrowSnake()
    }

    // handle crash/game over
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

// --- INPUT: turn left/right and restart ---
input.onButtonPressed(Button.A, function () {
    if (!gameRunning) return
    directionDeg = (directionDeg + 270) % 360  // left
    // keep visual sprite rotation for clarity
    snakeHead.turn(Direction.Left, 90)
})
input.onButtonPressed(Button.B, function () {
    if (!gameRunning) return
    directionDeg = (directionDeg + 90) % 360   // right
    snakeHead.turn(Direction.Right, 90)
})
input.onButtonPressed(Button.AB, function () {
    if (!gameRunning) startGame()
})

// --- START / RESTART GAME ---
function startGame(): void {
    // remove old sprites
    clearAllSprites()

    // reset state
    snakeSpeed = INITIAL_SPEED
    gameScore = 0
    snakeCrash = false
    gameRunning = true
    directionDeg = 90  // start facing right

    // create head
    snakeHead = game.createSprite(2, 2)
    // ensure sprite visually faces right once
    snakeHead.turn(Direction.Right, 90)

    // small countdown intro with tones
    for (let i = 3; i >= 1; i--) {
        basic.showNumber(i)
        music.playTone(523, music.beat(BeatFraction.Quarter))
        basic.pause(200)
    }
    music.playTone(784, music.beat(BeatFraction.Quarter))
    basic.showString("GO!")

    // spawn first mushroom
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

// auto-start on boot
startGame()
