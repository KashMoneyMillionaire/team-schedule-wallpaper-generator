(function () {

    window.createBackground = function(canvas, backgroundImgSrc, teamLogoSrc, schedule) {
        return new Promise(async resolve => {
            const background = await getImage(backgroundImgSrc);
            const teamLogo = await getImage(teamLogoSrc);

            const ctx = canvas.getContext('2d');
            ctx.drawImage(background, background.width, background.height)
            ctx.drawImage(teamLogo, teamLogo.width, teamLogo.height)
        })
    }

    function getImage(src) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.onerror = () => rej(new Error('Couldn\'t load image'));
            img.onload = () => res(img);
            img.src = src;
        })
    }
})();

const mergeImages = (sources = [], options = {}) => new Promise(resolve => {
    const defaultOptions = {
        format: 'image/png',
        quality: 1,
        width: undefined,
        height: undefined
    };

    options = Object.assign({}, defaultOptions, options);

    // Setup browser/Node.js specific variables
    const canvas = window.document.createElement('canvas');
    const Image = window.Image;

    // Load sources
    const images = sources.map(source => new Promise((resolve, reject) => {
        // Convert sources to objects
        if (source.constructor.name !== 'Object') {
            source = { src: source };
        }

        // Resolve source and img when loaded
        const img = new Image();
        img.onerror = () => reject(new Error('Couldn\'t load image'));
        img.onload = () => resolve(Object.assign({}, source, { img }));
        img.src = source.src;
    }));

    // Get canvas context
    const ctx = canvas.getContext('2d');

    // When sources have loaded
    resolve(Promise.all(images)
        .then(images => {
            // Set canvas dimensions
            const getSize = dim => options[dim] || Math.max(...images.map(image => image.img[dim]));
            canvas.width = getSize('width');
            canvas.height = getSize('height');

            // Draw images to canvas
            images.forEach(image => {
                ctx.globalAlpha = image.opacity ? image.opacity : 1;
                return ctx.drawImage(image.img, image.x || 0, image.y || 0);
            });

            // Resolve all other data URIs sync
            return canvas
        }));
});
