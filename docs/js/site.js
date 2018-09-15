const teamSelect = document.getElementById('team-select');
const wallpaper = document.getElementById('wallpaper');
const backgroundImg = 'images/background-2018.png';
const spinner = document.getElementById('spinner');

let teams = [];
let games = [];
let backgroundCanvas;

loadInitialData();

async function loadInitialData() {

    const teamPromise = fetch('data/teams.json')
        .then(d => d.json())
        .then(t => {
            teams = t;

            for (const team of t) {
                const o = document.createElement('option');
                o.innerText = team.name;
                o.value = team.name;
                teamSelect.options.add(o);
            }

            teamSelect.addEventListener('change', e => teamChanged(e.target.value));
        });

    const gamePromise = fetch('data/games.json')
        .then(d => d.json())
        .then(g => games = g);

    await Promise.all([teamPromise, gamePromise]);

    await loadBackground(backgroundImg).then(() => {
        const search = new URLSearchParams(document.location.search);
        let team = search.get('team');
        if (!getTeam(team))
            team = 'TCU';
        document.querySelector('#team-select [value="' + team + '"]').selected = true;
        teamChanged(team);
    });
}

function loadBackground(backgroundSrc) {
    return new Promise((res) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            res();
        };
        img.src = backgroundSrc;
        backgroundCanvas = canvas;
    });
}

const fileInput = document.getElementById('file-input');
fileInput.addEventListener('click', uploadLogo);
function uploadLogo() {
    const fileEl = document.getElementById('file-input');
    const f = fileEl.files && fileEl.files[0];
    if (f) {
        if (!f.name.toLowerCase().endsWith('.png')) {
            alert('Only .png files work at the moment. Apologies.');
            return;
        }

        var reader = new FileReader();
        reader.onload = function () {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                c.width = img.width;
                c.height = img.height;
                ctx.drawImage(img, 0, 0);
                getLogo.cache[f.name] = c;
                teamChanged(teamSelect.value, f.name);
            };
            img.src = reader.result;
        };
        toggleSpinner(true);
        reader.readAsDataURL(f);
    }
}

async function teamChanged(name, logoOverride) {
    const team = getTeam(name);
    if (!team) return;

    toggleSpinner(true);
    const canvas = await setLogo(logoOverride || name);
    await addSchedule(canvas, team);
    canvasToImage(canvas, wallpaper);
    toggleSpinner(false);
}

function toggleSpinner(isOn) {
    spinner.style.display = isOn ? 'block' : 'none';
    wallpaper.style.display = isOn ? 'none' : 'inline';

}

async function setLogo(name) {
    const cW = backgroundCanvas.width;
    const cH = backgroundCanvas.height;

    const canvas = document.createElement('canvas');
    canvas.width = cW;
    canvas.height = cH;
    const ctx = canvas.getContext('2d');

    const img = await getLogo(name);
    const imgW = img.width;
    const imgH = img.height;
    const box = fitIntoBox(imgH, imgW, 500, 825);

    const offsetX = (cW - box.x) / 2;
    const offsetY = ((cH - box.y) / 2);

    ctx.drawImage(backgroundCanvas, 0, 0);
    ctx.globalAlpha = .85;
    ctx.drawImage(img, offsetX, offsetY, box.x, box.y);
    ctx.globalAlpha = 1;

    return canvas;
}

function canvasToImage(canvas, img) {
    const url = canvas.toDataURL('image/png');
    img.src = url;
}

async function addSchedule(canvas, team) {
    const games = getGames(team.name);
    const ctx = canvas.getContext('2d');
    const laneWidth = 380;
    const laneHeight = 900;
    const imgTopPadding = 30;
    const imgSidePadding = 0;
    const logoWidth = laneWidth * (3 / 5);
    const timeWidth = laneWidth * (2 / 5);
    const distFromTop = (canvas.height - laneHeight) / 2 + 30;
    const distFromSide = 420;
    const monthHeightWeight = 40 / 100;
    const dayHeightWeight = 1 - monthHeightWeight;
    const dayAdjustLeft = 10;
    const fontFamily = 'Esphimere Bold';
    const fontWeight = 'italic';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';

    const left = games.slice(0, games.length / 2);
    const leftPromises = left.map((g, i) => getLogo(g.team).then(l => {
        return {
            logo: l,
            index: i,
            game: g
        };
    }));

    const right = games.slice(games.length / 2);
    const rightPromises = right.map((g, i) => getLogo(g.team).then(l => {
        return {
            logo: l,
            index: i,
            game: g
        };
    }));

    const leftBoxSize = laneHeight / left.length;
    const leftSchedProm = Promise.all(leftPromises).then(arr => arr.forEach(x => {
        const img = x.logo;
        const i = x.index;
        const game = x.game;
        const maxImageHeight = leftBoxSize - imgTopPadding;
        const maxImageWidth = logoWidth - imgSidePadding;
        const imageFit = fitIntoBox(img.height, img.width, maxImageHeight, maxImageWidth);
        const imgHeightDiff = leftBoxSize - imageFit.y;
        const actualTopPadding = imgHeightDiff / 2;
        const boxTop = distFromTop + leftBoxSize * i;
        const iDistFromTop = boxTop + actualTopPadding;
        const iDistFromSide = distFromSide + (logoWidth - imageFit.x) / 2;
        ctx.drawImage(img, iDistFromSide, iDistFromTop, imageFit.x, imageFit.y);

        const topFont = maxImageHeight * monthHeightWeight;
        const bottomFont = maxImageHeight * dayHeightWeight;
        const tDistanceFromSide = distFromSide + logoWidth + timeWidth / 2;
        const tDistanceFromTop = boxTop;
        ctx.font = buildFont(fontWeight, topFont, fontFamily);
        ctx.fillText(game.month, tDistanceFromSide, tDistanceFromTop);
        const topHeight = getTextHeight(fontFamily, topFont);
        ctx.font = buildFont(fontWeight, bottomFont, fontFamily);
        ctx.fillText(game.day, tDistanceFromSide - dayAdjustLeft, tDistanceFromTop + topHeight - 10, timeWidth);
    }));

    const rightImageHeight = laneHeight / right.length;
    const rightSchedProm = Promise.all(rightPromises).then(arr => arr.forEach(x => {
        const img = x.logo;
        const i = x.index;
        const game = x.game;
        const maxImageHeight = rightImageHeight - imgTopPadding;
        const maxImageWidth = logoWidth - imgSidePadding;
        const imageFit = fitIntoBox(img.height, img.width, maxImageHeight, maxImageWidth);
        const imgHeightDiff = rightImageHeight - imageFit.y;
        const actualTopPadding = imgHeightDiff / 2;
        const boxTop = distFromTop + rightImageHeight * i;
        const iDistFromTop = boxTop + actualTopPadding;
        const iDistFromSide = (canvas.width - distFromSide - imageFit.x) - (logoWidth - imageFit.x) / 2;
        ctx.drawImage(img, iDistFromSide, iDistFromTop, imageFit.x, imageFit.y);

        const topFont = maxImageHeight * monthHeightWeight;
        const bottomFont = maxImageHeight * dayHeightWeight;
        const tDistanceFromSide = canvas.width - distFromSide - laneWidth + timeWidth / 2;
        const tDistanceFromTop = boxTop;
        ctx.font = buildFont(fontWeight, topFont, fontFamily);
        ctx.fillText(game.month, tDistanceFromSide, tDistanceFromTop);
        const topHeight = getTextHeight(fontFamily, topFont);
        ctx.font = buildFont(fontWeight, bottomFont, fontFamily);
        ctx.fillText(game.day, tDistanceFromSide - dayAdjustLeft, tDistanceFromTop + topHeight - 15, timeWidth);
    }));

    await Promise.all([leftSchedProm, rightSchedProm]);
}

function buildFont(weight, size, family) {
    return `${weight} ${size}px ${family}`;
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
    const h1 = Math.min(originalHeight * 100, maxHeight);
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

const cleanName = (name) => name.replace('St.', 'St');


function getTextHeight(fontFamily, fontSize) {
    const text = document.createElement('span');
    text.style.fontFamily = fontFamily;
    text.style.fontSize = fontSize + 'px';
    text.style.lineHeight = fontSize + 'px';
    text.innerHTML = 'Hg';

    const block = document.createElement('div');
    block.style.display = 'inline-block';
    block.style.width = '1px';
    block.style.height = '0px';

    var div = document.createElement('div');
    div.appendChild(text);
    div.appendChild(block);
    document.body.appendChild(div);

    try {
        block.style.verticalAlign = 'top';
        return (text.offsetTop + text.offsetHeight) - block.offsetTop;
    } finally {
        document.body.removeChild(div);
    }
}

const saver = document.getElementById('saver');
saver && saver.addEventListener('click', download);
function download() {
    const filename = teamSelect.value + '-2018.png';
    var c = document.createElement('canvas');
    c.width = wallpaper.naturalWidth;
    c.height = wallpaper.naturalHeight;
    var ctx = c.getContext('2d');

    ctx.drawImage(wallpaper, 0, 0);
    c.toBlob(function (file) {
        if (window.navigator.msSaveOrOpenBlob)
            window.navigator.msSaveOrOpenBlob(file, filename);
        else {
            const url = URL.createObjectURL(file);
            saver.href = url;
            saver.download = filename;

            // window.open(url, '_blank');

            setTimeout(function () {
                window.URL.revokeObjectURL(url);
            }, 1000);
        }
    }, 'image/png');
}