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
        // teamChanged2(e.target.value);
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

    const img = await getLogo(team.name);
    const imgW = img.width;
    const imgH = img.height;
    const box = fitIntoBox(imgH, imgW, 470, 725);

    const offsetX = (cW - box.x) / 2;
    const offsetY = ((cH - box.y) / 2) + 45;

    ctx.drawImage(backgroundCanvas, 0, 0);
    ctx.drawImage(img, offsetX, offsetY, box.x, box.y);
    setCanvas(canvas);

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

    const left = games.slice(0, games.length / 2);
    const leftImageHeight = laneHeight / left.length;
    const leftPromises = left.map((g, i) => getLogo(g.team).then(l => {
        return {
            logo: l,
            index: i
        }
    }));

    const right = games.slice(games.length / 2);
    const rightImageHeight = laneHeight / right.length;
    // const rightPromises = right.map((g, i) => {
    //     getLogo(g.team)
    //     return new Promise((res, rej) => {
    //         const img = new Image();
    //         img.onload = () => {
    //             try {
    //                 const imageSize = fitIntoBox(img.height, img.width, rightImageHeight - 20, logoWidth);
    //                 const iDistFromTop = distFromTop + rightImageHeight * i;
    //                 const iDistFromSide = (canvas.width - distFromSide - imageSize.x) - (logoWidth - imageSize.x) / 2;
    //                 ctx.drawImage(img, iDistFromSide, iDistFromTop, imageSize.x, imageSize.y);
    //             } catch (e) {
    //                 console.log(e);
    //             }
    //             res();
    //             count++;
    //         };
    //         img.onerror = e => console.log(e);
    //         img.src = `images/logos/${g.team}.png`;
    //     })
    // })

    Promise.all(leftPromises).then(arr => arr.forEach(x => {
        const img = x.logo;
        const i = x.index;
        const imageSize = fitIntoBox(img.height, img.width, leftImageHeight - 20, logoWidth);
        const iDistFromTop = distFromTop + leftImageHeight * i;
        const iDistFromSide = distFromSide + (logoWidth - imageSize.x) / 2;
        ctx.drawImage(img, iDistFromSide, iDistFromTop, imageSize.x, imageSize.y);
    }));
}

function getLogo(teamName) {
    const logoCache = getLogo.cache = getLogo.cache || {};

    return new Promise(res => {
        if (logoCache[teamName]) {
            res(logoCache[teamName]);
        } else {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                c.width = img.width;
                c.height = img.height;
                ctx.drawImage(img, 0, 0);
                logoCache[teamName] = c;
                res(c);
            };
            img.src = `images/logos/${cleanName(teamName)}.png`;
        }
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
    const cleaned = cleanName(name);
    return games.find(g => g.name == cleaned).games;
}

cleanName = (name) => name.replace('St.', 'St');

function setCanvas(cvs) {
    cvs.id = 'canvas';
    document.body.replaceChild(cvs, document.getElementById('canvas'));
}