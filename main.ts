// Snake Game for Calliope mini V2 (final, fixed)
// ---------------------------------------------------------
// Controls:
//  - Button A → Turn Left
//  - Button B → Turn Right
//
// Goal: Eat mushrooms to grow and increase your score.
// Each mushroom speeds up the snake slightly.
// ---------------------------------------------------------

// --- Variables ---
let snakeHead: game.LedSprite = null
let snakeTail: game.LedSprite[] = []
let mushroom: game.LedSprite = null
let snakeSpeed = 500
let gameScore = 0
let snakeCrash = false

// --- Function: place a new mushroom (not on snake) ---
function setMushroom(): void {
    let x = 0
    let y = 0
    let validPosition = false
    while (!validPosition) {
        x = randint(0, 4)
        y = randint(0, 4)
        validPosition = true
        // ensure it doesn't spawn on the head
        if (snakeHead.get(LedSpriteProperty.X) == x && snakeHead.get(LedSpriteProperty.Y) == y) {
            validPosition = false
        }
        // ensure it doesn't spawn on any tail segment
        for (let part of snakeTail) {
            if (part.get(LedSpriteProperty.X) == x && part.get(LedSpriteProperty.Y) == y) {
                validPosition = false
            }
        }
    }
    // remove old mushroom if exists
    if (mushroom) {
        mushroom.delete()
    }
    // create new mushroom sprite
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
    // create new tail segment at the end position
    snakeTail.push(game.createSprite(x, y))
    // delete and clear mushroom
    if (mushroom) {
        mushroom.delete()
        mushroom = null
    }
    // increment score and speed up (minimum delay enforced)
    gameScore += 1
    if (snakeSpeed > 100) {
        snakeSpeed -= 25
    }
    // spawn a new mushroom (safe: won't spawn on the snake)
    setMushroom()
}

// --- Function: move snake forward ---
function moveSnake(): void {
    let prevX = snakeHead.get(LedSpriteProperty.X)
    let prevY = snakeHead.get(LedSpriteProperty.Y)

    // move forward one step
    snakeHead.move(1)

    // handle wrapping at edges (teleport around screen)
    if (snakeHead.get(LedSpriteProperty.X) < 0) snakeHead.set(LedSpriteProperty.X, 4)
    if (snakeHead.get(LedSpriteProperty.X) > 4) snakeHead.set(LedSpriteProperty.X, 0)
    if (snakeHead.get(LedSpriteProperty.Y) < 0) snakeHead.set(LedSpriteProperty.Y, 4)
    if (snakeHead.get(LedSpriteProperty.Y) > 4) snakeHead.set(LedSpriteProperty.Y, 0)

    // If the head actually moved (position changed)
    if (snakeHead.get(LedSpriteProperty.X) != prevX || snakeHead.get(LedSpriteProperty.Y) != prevY) {
        // only update tail if there are tail parts
        if (snakeTail.length > 0) {
            // add new segment where the head used to be
            snakeTail.unshift(game.createSprite(prevX, prevY))
            // remove the last tail sprite and delete it
            let tailEnd = snakeTail.pop()
            if (tailEnd) tailEnd.delete()
        }

        // check collision with tail segments
        for (let segment of snakeTail) {
            if (snakeHead.isTouching(segment)) {
                snakeCrash = true
                break
            }
        }
    } else {
        // head didn't move (blocked) -> crash
        snakeCrash = true
    }

    // check mushroom collision (eating)
    if (mushroom && snakeHead.isTouching(mushroom)) {
        eatMushroomAndGrowSnake()
    }

    // if crash detected → end game
    if (snakeCrash) {
        game.setScore(gameScore)
        game.gameOver()
    }
}

// --- Button Controls ---
input.onButtonPressed(Button.A, function () {
    snakeHead.turn(Direction.Left, 90)
})
input.onButtonPressed(Button.B, function () {
    snakeHead.turn(Direction.Right, 90)
})

// --- Game Setup ---
snakeHead = game.createSprite(2, 2)
// set initial heading to the right so first move goes right
snakeHead.turn(Direction.Right, 90)
snakeTail = []
snakeCrash = false
snakeSpeed = 500
gameScore = 0
setMushroom()

// --- Main Game Loop ---
basic.forever(function () {
    moveSnake()
    basic.pause(snakeSpeed)
})
