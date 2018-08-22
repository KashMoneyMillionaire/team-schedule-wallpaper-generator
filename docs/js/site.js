const teamSelect = document.getElementById('team-select');
const title = document.getElementById('title')
const teamLogo = document.getElementById('team-logo');
const backgroundImg = 'images/background-2018.png';

let teams = [];
let games = [];
let backgroundCanvas;

loadBackground(backgroundImg);

const teamsPromise = fetch('data/teams.json').then(d => d.json()).then(j => {
    teams = j;

    for (const team of j) {
        const o = document.createElement('option');
        o.innerText = team.name;
        o.value = team.name;
        teamSelect.options.add(o);
    }

    teamSelect.addEventListener('change', e => {
        teamChanged(e.target.value);
    })
});

const schedulePromise = fetch('data/games.json').then(d => d.json()).then(j => games = j);

function loadBackground(backgroundSrc) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    setCanvas(canvas);

    const img = new Image();
    img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
    };
    img.src = backgroundSrc;
    backgroundCanvas = canvas;
}

async function teamChanged(name) {
    const team = getTeam(name);
    if (!team) return;
    title.innerText = team.name;

    const cW = backgroundCanvas.width;
    const cH = backgroundCanvas.height;

    const canvas = document.createElement('canvas');
    canvas.width = cW;
    canvas.height = cH;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const box = fitIntoBox(imgH, imgW, 470, 725);

        const offsetX = (cW - box.x) / 2;
        const offsetY = ((cH - box.y) / 2) + 45;

        ctx.drawImage(backgroundCanvas, 0, 0);
        ctx.drawImage(img, offsetX, offsetY, box.x, box.y);
        setCanvas(canvas);
    };
    img.src = 'images/logos/' + team.file;

    addSchedule(canvas, team);
}

function addSchedule(canvas, team) {
    const games = getGames(team.name);
    const ctx = canvas.getContext('2d');
    const laneWidth = 350;
    const laneHeight = 900;
    const logoWidth = laneWidth * (2 / 3);
    const distFromTop = (canvas.height - laneHeight) / 2 + 30;
    const distFromSide = 324;
    let count = 0;

    const left = games.slice(0, games.length / 2);
    const right = games.slice(games.length / 2);
    const leftImageHeight = laneHeight / left.length;
    const rightImageHeight = laneHeight / right.length;
    const leftPromises = left.map((g, i) => {
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const imageSize = fitIntoBox(img.height, img.width, leftImageHeight - 20, logoWidth);
                    const iDistFromTop = distFromTop + leftImageHeight * i;
                    const iDistFromSide = distFromSide + (logoWidth - imageSize.x) / 2;
                    ctx.drawImage(img, iDistFromSide, iDistFromTop, imageSize.x, imageSize.y);
                } catch (e) {
                    console.log(e);
                }
                res();
                count++;
            };
            img.onerror = e => console.log(e);
            img.src = `images/logos/${g.team}.png`;
        })
    })
    const rightPromises = right.map((g, i) => {
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const imageSize = fitIntoBox(img.height, img.width, rightImageHeight - 20, logoWidth);
                    const iDistFromTop = distFromTop + rightImageHeight * i;
                    const iDistFromSide = (canvas.width - distFromSide - imageSize.x) - (logoWidth - imageSize.x) / 2;
                    ctx.drawImage(img, iDistFromSide, iDistFromTop, imageSize.x, imageSize.y);
                } catch (e) {
                    console.log(e);
                }
                res();
                count++;
            };
            img.onerror = e => console.log(e);
            img.src = `images/logos/${g.team}.png`;
        })
    })

    // teamSelect.disabled = true;
    Promise.all(leftPromises.concat(rightPromises)).then(x => {
        // teamSelect.disabled = false;
        console.log(`${count} vs ${games.length}`);
    });
}

function fitIntoBox(originalHeight, originalWidth, maxHeight, maxWidth) {
    const ratio = originalHeight / originalWidth;
    const h1 = Math.min(originalHeight, maxHeight);
    const w1 = h1 / ratio;
    const w2 = Math.min(w1, maxWidth);
    const h2 = ratio * w2;
    return {
        x: w2,
        y: h2
    };
}

function getTeam(name) {
    return teams.find(t => t.name == name);
}

function getGames(name) {
    return games.find(g => g.name == name.replace('St.', 'St')).games;
}

function setCanvas(cvs) {
    cvs.id = 'canvas';
    document.body.replaceChild(cvs, document.getElementById('canvas'));
}