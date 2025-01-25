// zipWorker.js
importScripts('https://cdn.jsdelivr.net/npm/jszip/dist/jszip.min.js');

self.onmessage = async function(event) {
    const { excelBuffer, fileName } = event.data;
    const zip = new JSZip();

    zip.file(fileName, excelBuffer);
    const zipStream = zip.generateInternalStream({ type: 'blob' });

    let lastProgress = 0;

    const blob = await zipStream.accumulate(progress => {
        const currentProgress = progress.percent.toFixed(2);
        if (currentProgress - lastProgress >= 1) {
            // Отправляем прогресс обратно в основной поток
            self.postMessage({ type: 'progress', percent: currentProgress });
            lastProgress = currentProgress;
        }
    });

    // Отправляем готовый Blob обратно в основной поток
    self.postMessage({ type: 'done', blob });
};
