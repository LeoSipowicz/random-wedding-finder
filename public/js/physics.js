import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat';

export default async function run_simulation() {
    let textArea, groundBody, leftWallBody, rightWallBody;
    await RAPIER.init();
    const scaleFactor = 50;
    let gravity = new RAPIER.Vector2(0.0, -9.81 * scaleFactor);
    let world = new RAPIER.World(gravity);

    const sprites = [];

    const app = new PIXI.Application();
    await app.init({ background: '#f8f8f5', resizeTo: window });
    document.body.appendChild(app.canvas);

    PIXI.Assets.load('/img/drawn-color-heart.png')
    PIXI.Assets.load('/img/drawn-color-broken-heart.png')

    const createWallsAndGround = () => {
        if (groundBody) world.removeRigidBody(groundBody);
        if (leftWallBody) world.removeRigidBody(leftWallBody);
        if (rightWallBody) world.removeRigidBody(rightWallBody);

        const border = 10;
        const width = window.innerWidth;
        const height = window.innerHeight;

        //Text area
        textArea = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(width/2, -height + border)
        );
        world.createCollider(RAPIER.ColliderDesc.cuboid(width/4, 50), textArea);

        // Ground
        groundBody = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(0, -height + border)
        );
        world.createCollider(RAPIER.ColliderDesc.cuboid(width, border), groundBody);

        // Left Wall
        leftWallBody = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0)
        );
        world.createCollider(RAPIER.ColliderDesc.cuboid(border, height), leftWallBody);

        // Right Wall
        rightWallBody = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(width - border, 0)
        );
        world.createCollider(RAPIER.ColliderDesc.cuboid(border, height), rightWallBody);
    };

    createWallsAndGround();
    window.addEventListener('resize', createWallsAndGround);

    const heartRad = 16.0;

    const addHeart = (heartType) => {
        let x = window.innerWidth * Math.random();
        let y = 63;
        let bodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y)
            .setAngularDamping(1);
        let body = world.createRigidBody(bodyDesc);
        let colliderDesc = RAPIER.ColliderDesc.ball(heartRad);
        let collider = world.createCollider(colliderDesc, body);
        
        addCollider(RAPIER, world, collider);
    
        // Choose the png based on the heart type.
        const spriteSrc = heartType === 'full' ? '/img/drawn-color-heart.png' : '/img/drawn-color-broken-heart.png';
        const heartSprite = PIXI.Sprite.from(spriteSrc);
        heartSprite.anchor.set(0.5);

        heartSprite.width = 35;
        heartSprite.height = 35;

        sprites.push(heartSprite);
        app.stage.addChild(heartSprite);
    };
    

    const statusElement = document.getElementById('status');
    const statusElementObserver = new MutationObserver((mutationsList) => {
        const text = statusElement.textContent;
        if (text.indexOf("are getting married") !== -1) {
            for (let i = 0; i < Math.floor(window.innerWidth/200); i++) {
                addHeart('full');
            }
        }
    });
    statusElementObserver.observe(statusElement, { childList: true, characterData: true, subtree: true });


    const noMatchElementObserver = new MutationObserver((mutationsList) => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('alert')) {
                    const text = node.textContent;
                    if (text.indexOf("not getting married") !== -1) {
                        for (let i = 0; i < Math.floor(window.innerWidth/200); i++) {
                            addHeart('broken');
                        }
                    }
                }
            });
        });
    });
    noMatchElementObserver.observe(document.body, { childList: true, subtree: true });

    // Create the cursor object
    let goal = null;
    const direction = { x: 0, y: 0 };
    const cursorBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.newDynamic().setTranslation(0, 0)
    );
    let cursorColliderDesc = new RAPIER.ColliderDesc(
        new RAPIER.Cuboid(20, 20)
    ).setTranslation(0, 0);
    const cursorCollider = world.createCollider(cursorColliderDesc, cursorBody);

    document.addEventListener("mousemove", (e) => {
        const { offsetX, offsetY } = e;
        goal = {
            x: offsetX,
            y: -offsetY,
        };
    });

    document.addEventListener("touchmove", (e) => {
        // e.preventDefault();
        const touch = e.touches[0];
        goal = {
            x: touch.clientX,
            y: -touch.clientY,
        };
    });

    let graphic = new PIXI.Graphics();
    app.stage.addChild(graphic);

    sprites.forEach((el) => {
        app.stage.addChild(el);
    });

    const ColliderMap = new Map();

    // Loop through rapier colliders and create key/value pairs in ColliderMap.
    function addCollider(RAPIER, world, collider) {
        let type = "UNKNOWN";
        let rad = 0;
        let sizeX = 0;
        let sizeY = 0;

        switch (collider.shapeType()) {
            case RAPIER.ShapeType.Cuboid:
                type = "CUBE";
                let hext = collider.halfExtents();
                sizeX = hext.x;
                sizeY = hext.y;
                break;
            case RAPIER.ShapeType.Ball:
                type = "BALL";
                rad = collider.radius();
                break;
            default:
                console.log("Unknown shape to render.");
                break;
        }
        let t = collider.translation();
        let r = collider.rotation();
        const shape = {};
        shape.type = type;
        shape.xLoc = t.x;
        shape.yLoc = t.y;
        shape.rotation = -r.angle;
        shape.rSize = rad;
        shape.xSize = sizeX;
        shape.ySize = sizeY;
        ColliderMap.set(collider.handle, shape);
    }

    // Render each object in ColliderMap using PixiJS.
    function render(world, ColliderMap) {
        let cntr = 0;
        ColliderMap.forEach((el) => {
            if (el.type === "BALL") {
                graphic.fill(0x0000ff);
                let curr = sprites[cntr];
                cntr = cntr + 1;
                curr.position.x = el.xLoc;
                curr.position.y = -el.yLoc;
                curr.rotation = el.rotation;
                curr.pivot.set(0, 0);
            }
        });
    }

    //Use for debugging
    function renderTest(world, ColliderMap) {
        graphic.clear();
    
        ColliderMap.forEach((el) => {
            if (el.type === "BALL") {
                graphic.beginFill(0x0000ff, 0.5); // blue
                graphic.drawCircle(el.xLoc, -el.yLoc, el.rSize);
                graphic.endFill();
            }
    
            if (el.type === "CUBE") {
                const x = el.xLoc;
                const y = -el.yLoc;
                const w = el.xSize * 2;
                const h = el.ySize * 2;
                const angle = el.rotation;
    
                // Calculate corners of the rotated rectangle
                const cx = x;
                const cy = y;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
    
                const corners = [
                    [-w / 2, -h / 2],
                    [w / 2, -h / 2],
                    [w / 2, h / 2],
                    [-w / 2, h / 2],
                ].map(([dx, dy]) => ({
                    x: cx + dx * cos - dy * sin,
                    y: cy + dx * sin + dy * cos,
                }));
    
                graphic.beginFill(0xff0000, 0.3); // red
                graphic.moveTo(corners[0].x, corners[0].y);
                for (let i = 1; i < corners.length; i++) {
                    graphic.lineTo(corners[i].x, corners[i].y);
                }
                graphic.closePath();
                graphic.endFill();
            }
        });
    }

    // Update ColliderMap positions each step.
    function updatePositions(world) {
        if (goal) {
            const cursorPosition = cursorBody.translation();
            const cursorDistFromGoal = Math.sqrt(
                (cursorPosition.x - goal.x) ** 2 + (cursorPosition.y - goal.y) ** 2
            );
            if (cursorDistFromGoal < 10) {
                cursorBody.setTranslation(goal, true);
                direction.x = 0;
                direction.y = 0;
                goal = undefined;
            } else {
                const x = goal.x - cursorBody.translation().x;
                const y = goal.y - cursorBody.translation().y;
                const div = Math.max(Math.abs(x), Math.abs(y));
                direction.x = x / div;
                direction.y = y / div;
            }
        }

        cursorBody.setLinvel(
            { x: direction.x * 1000, y: direction.y * 1000 },
            true
        );
        cursorCollider.setActiveHooks(RAPIER.ActiveHooks.FILTER_CONTACT_PAIRS);

        world.forEachCollider((elt) => {
            let CMapHandle = ColliderMap.get(elt.handle);
            let translation = elt.translation();
            let rotation = elt.rotation();
            if (CMapHandle) {
                CMapHandle.xLoc = translation.x;
                CMapHandle.yLoc = translation.y;
                CMapHandle.rotation = -rotation;
            }
        });
    }

    // Game loop
    function update() {
        graphic.clear();
        renderTest(world, ColliderMap);
        updatePositions(world);
        world.step();
        requestAnimationFrame(update);
    }

    world.forEachCollider(coll => {
        addCollider(RAPIER, world, coll);
    });
    requestAnimationFrame(update);
}

RAPIER.init().then(run_simulation);
