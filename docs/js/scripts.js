const teamSelect = document.getElementById('team-select');
const title = document.getElementById('title')
const teamLogo = document.getElementById('team-logo');
let teams = [];
const backgroundImg = 'images/background-2018.png';
let backgroundCanvas;

loadBackground(backgroundImg);

fetch('data/teams.json').then(d => d.json()).then(j => {
    teams = j;

    for (const team of j) {
        const o = document.createElement('option');
        o.innerText = team.name;
        o.value = team.id;
        teamSelect.options.add(o);
    }

    teamSelect.addEventListener('change', e => {
        teamChanged(e.target.value);
    })
})

function loadBackground(backgroundSrc) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    setCanvas(canvas);

    const img = new Image();
    img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.globalAlpha = 1;
        ctx.drawImage(img, 0, 0);
    };
    img.src = backgroundSrc;
    backgroundCanvas = canvas;
}

async function teamChanged(id) {
    const team = getTeam(id);
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
        const ratio = imgH / imgW;
        const h = Math.min(imgH, 450);
        const w = h / ratio;

        const offsetX = (cW - w) / 2;
        const offsetY = (cH - h) / 2;

        ctx.drawImage(backgroundCanvas, 0, 0);
        ctx.globalAlpha = .9;
        ctx.drawImage(img, offsetX, offsetY, w, h);
        setCanvas(canvas);
    };
    img.src = 'images/logos/' + team.file;
}

function getTeam(id) {
    return teams.find(t => t.id == id);
}

function setCanvas(cvs) {
    cvs.id = 'canvas';
    document.body.replaceChild(cvs, document.getElementById('canvas'));
}