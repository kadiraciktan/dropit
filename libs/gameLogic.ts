
import Matter, {
    Bodies,
    Common,
    Composite,
    Composites,
    Engine,
    Render,
    Runner,
    Svg,
    Vertices,
    Constraint,
    Body,
    Query,
    Events,
    Sleeping,
    World
} from 'matter-js';

Common.setDecomp(require('poly-decomp'));

const engine = Engine.create();
const gameArea = document.getElementById('gameArea');

const render = Render.create({
    element: gameArea,
    engine: engine,
    options: {
        width: 340,
        height: 600,
        wireframes: false,
    }
});

//Game Init
const gameObjects = [];
const droppedBoxes: any = [];
let scorePoint = 3000;
let boxCategory = 0x0001;
let sceneCategory = 0x0002;
let groundCategory = 0x0003;

let scoreElement = document.getElementById('score');
let mainMenuElement = document.getElementById('mainMenu');
let winElement = document.getElementById('win');
let loseElement = document.getElementById('lose');
let endGameElement = document.getElementById('endGame');
let boxSize = 50;
let gameState = 'mainMenu';
let boxState = 'idle';

var ground = Bodies.rectangle(400, 610, 810, 60, {
    label: 'ground',
    isStatic: true,
    collisionFilter: {
        category: groundCategory
    }
});

var leftBorder = Bodies.rectangle(0, 300, 30, 600, { isStatic: true, collisionFilter: { category: boxCategory } });
var rightBorder = Bodies.rectangle(340, 300, 30, 600, { isStatic: true, collisionFilter: { category: boxCategory } });

var finishLine = Bodies.rectangle(170, 200, 309, 10, {
    label: 'finishLine',
    isStatic: true,
    collisionFilter: {
        category: sceneCategory,
        mask: sceneCategory
    },
    render: {
        fillStyle: '#65C18C',
    }
});

var boxA = Bodies.rectangle(170, 10, boxSize, boxSize, {
    inertia: Infinity,
    collisionFilter: {
        category: boxCategory,
    },
    render: {
        fillStyle: 'transparent',
        strokeStyle: '#FFFFFF ',
        lineWidth: 1
    }
});

var constraint = Constraint.create({
    pointA: { x: 170, y: -2 },
    bodyB: boxA,
    pointB: { x: 0, y: 0 },
    stiffness: 0.0005,
    render: {
        type: 'line'
    }
});

gameObjects.push(ground);
gameObjects.push(leftBorder);
gameObjects.push(rightBorder);
gameObjects.push(boxA);
gameObjects.push(constraint);
gameObjects.push(finishLine);

let lineForceLeft = false;
let lineForceValue = 0.02;

setInterval(() => {
    Body.applyForce(constraint.bodyB, constraint.pointA, { x: lineForceLeft ? -lineForceValue : lineForceValue, y: 0 });
    lineForceLeft = !lineForceLeft;
}, 500);




//Update State
setInterval(() => {
    scoreElement.innerHTML = scorePoint.toString();
    if (scorePoint <= 0 && gameState === 'game') {
        scorePoint = 0;
        gameEnd();
    }

}, 100);

Events.on(engine, 'collisionStart', function (event) {
    // console.log("Evento: ", event)
    var pairs = event.pairs;
    for (let pair of pairs) {
        // if box collide to ground
        if (pair.bodyA.label === 'box' || pair.bodyB.label === 'box') {
            if (pair.bodyB.label === 'ground' || pair.bodyA.label === 'ground') {
                pair.bodyA.label = 'ground';
                pair.bodyB.label = 'ground';
                pair.bodyA.collisionFilter.category = sceneCategory;
                pair.bodyB.collisionFilter.category = sceneCategory;
                scorePoint -= 100;
                boxState = 'idle';
            }
        }

        if (pair.bodyA.label === 'ground' || pair.bodyB.label === 'ground') {
            if (pair.bodyA.label === 'finishLine' || pair.bodyB.label === 'finishLine') {
                gameEnd();
            }
        }
    }
});


function gameEnd() {
    mainMenuElement.style.display = 'flex';
    endGameElement.style.display = 'flex';
    if (scorePoint > 0) {
        winElement.style.display = 'flex';
        loseElement.style.display = 'none'
    } else {
        winElement.style.display = 'none';
        loseElement.style.display = 'flex';
    }
    gameState = 'mainMenu';
}

let currentKeyCode = "";
document.addEventListener('keydown', (key) => {
    // console.log(key);
    if (key.code === 'Space' && currentKeyCode !== key.code) {
        if (gameState === 'mainMenu') {
            scorePoint = 3000;
            clearBoxes();
            mainMenuElement.style.display = 'none';
            gameState = 'game';
        } else if (gameState === 'game' && boxState === 'idle') {
            currentKeyCode = key.code;
            boxA.render.visible = false;
            const linePosX = constraint.bodyB.position.x;
            const linePosY = constraint.bodyB.position.y + boxSize;
            constraint.bodyB.inertia = Infinity;
            const createdPrefab = createBoxPrefab(linePosX, linePosY, boxSize, boxSize);
            boxA.render.visible = true;
            boxState = 'moving';
        }

    }
});

document.addEventListener('keyup', (key) => {
    currentKeyCode = "";
});


function createBoxPrefab(x: number, y: number, width: number, height: number) {
    const prefab = Bodies.rectangle(x, y, width, height, {
        label: 'box',
        collisionFilter: {
            category: boxCategory,
            mask: groundCategory
        },
        render: {
            fillStyle: 'transparent',
            strokeStyle: '#FFFFFF ',
            lineWidth: 1
        }
    });
    Composite.add(engine.world, [prefab]);
    droppedBoxes.push(prefab);
    return prefab;
}

function clearBoxes() {
    for (let box of droppedBoxes) {
        World.remove(engine.world, box);
    }
}

function getRandomPosition(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}


// add all of the bodies to the world
Composite.add(engine.world, gameObjects);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);



