document.addEventListener('DOMContentLoaded', function() {
    var dropzone = document.getElementById('dropzone');
    var input = document.getElementById('audioUpload');
    var removeButton = document.getElementById('removeButton');
    var sendButton = document.getElementById('sendButton');
    var downloadButton = document.getElementById('downloadButton');
    var audioPlayer = document.getElementById('audioPlayer');
    var downloadAudioLink = document.getElementById('downloadAudioLink');
    var formatSelect = document.getElementById('format');
    var reportModal = document.getElementById('reportModal');

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        var k = 1024,
            dm = 2,
            sizes = ['B', 'KB', 'MB', 'GB', 'TB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function formatDuration(seconds) {
        var h = Math.floor(seconds / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);
        return [h, m, s]
          .map(v => v < 10 ? "0" + v : v)
          .filter((v, i) => v !== "00" || i > 0)
          .join(":");
    }

    function formatBits(bits) {
        if (bits === 0) return '0 bps';
        var k = 1000,
            dm = 2,
            sizes = ['bps', 'kbps', 'Mbps', 'Gbps', 'Tbps'],
            i = Math.floor(Math.log(bits) / Math.log(k));
        return parseFloat((bits / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function updateButtonStatus(isEnabled, isDownloadEnabled) {
        removeButton.disabled = !isEnabled;
        sendButton.disabled = !isEnabled;
        downloadButton.disabled = !isDownloadEnabled;

        if (isEnabled) {
            removeButton.classList.remove('disabled');
            sendButton.classList.remove('disabled');
            formatSelect.disabled = false;
        } else {
            removeButton.classList.add('disabled');
            sendButton.classList.add('disabled');
            formatSelect.disabled = true;
        }

        if (isDownloadEnabled) {
            downloadButton.classList.remove('disabled');
        } else {
            downloadButton.classList.add('disabled');
        }
    }

    var originalFileName = '';

    input.onchange = function () {
        var file = input.files[0];
        originalFileName = file.name;
        var audioURL = URL.createObjectURL(file);
        setAudioSource(audioURL, file);
    };

    dropzone.onclick = function () {
        input.click();
    };

    dropzone.ondragover = function (event) {
        event.preventDefault();
        dropzone.style.backgroundColor = '#f0f0f0';
    };

    dropzone.ondragleave = function (event) {
        event.preventDefault();
        dropzone.style.backgroundColor = '#fff';
    };

    dropzone.ondrop = function (event) {
        event.preventDefault();
        dropzone.style.backgroundColor = '#fff';
        var file = event.dataTransfer.files[0];
        originalFileName = file.name;
        var audioURL = URL.createObjectURL(file);
        setAudioSource(audioURL, file);
    };

    function setAudioSource(url, file) {
        audioPlayer.src = url;
        audioPlayer.style.display = "block";
        updateButtonStatus(true, false);
    }

    function removeAudio(event) {
        event.preventDefault();
        audioPlayer.src = "";
        audioPlayer.style.display = "none";
        updateButtonStatus(false, false);
        input.value = "";
    }

    document.getElementById('audioForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const file = input.files[0];
        if (file) {
            var formData = new FormData();
            formData.append('audio', file);
            formData.append('format', formatSelect.value);

            sendButton.disabled = true;
            sendButton.classList.add('disabled');
            removeButton.disabled = true;
            removeButton.classList.add('disabled');

            fetch('/audio-compress', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.downloadLink) {
                    downloadAudioLink.value = data.downloadLink;
                    updateButtonStatus(false, true);

                    fillModal(data.originalInfo, data.convertedInfo);
                    reportModal.style.display = 'block';
                } else {
                    console.error('Erro ao obter o link de download');
                    sendButton.disabled = false;
                    sendButton.classList.remove('disabled');
                    removeButton.disabled = false;
                    removeButton.classList.remove('disabled');
                }
            })
            .catch(error => {
                console.error('Erro ao converter o áudio:', error);
                sendButton.disabled = false;
                sendButton.classList.remove('disabled');
                removeButton.disabled = false;
                removeButton.classList.remove('disabled');
            });
        }
    });

    function fillModal(originalInfo, convertedInfo) {
        document.getElementById('original_tamanho').innerText = formatBytes(originalInfo.format.size);
        document.getElementById('original_duracao').innerText = formatDuration(originalInfo.format.duration);
        document.getElementById('original_codecAudio').innerText = originalInfo.audio.codec_name;
        document.getElementById('original_taxaBitsAudio').innerText = formatBits(originalInfo.audio.bit_rate);
        document.getElementById('original_taxaQuadrosAudio').innerText = originalInfo.audio.sample_rate + ' Hz';

        document.getElementById('compressed_tamanho').innerText = formatBytes(convertedInfo.format.size);
        document.getElementById('compressed_duracao').innerText = formatDuration(convertedInfo.format.duration);
        document.getElementById('compressed_codecAudio').innerText = convertedInfo.audio.codec_name;
        document.getElementById('compressed_taxaBitsAudio').innerText = formatBits(convertedInfo.audio.bit_rate);
        document.getElementById('compressed_taxaQuadrosAudio').innerText = convertedInfo.audio.sample_rate + ' Hz';
    }

    downloadButton.onclick = function (event) {
        event.preventDefault();
        const downloadLink = downloadAudioLink.value;
        if (downloadLink) {
            var a = document.createElement('a');
            a.href = downloadLink;
            a.download = originalFileName.replace(/\.[^/.]+$/, '.' + formatSelect.value);
            a.click();
            removeAudio(event);
        } else {
            console.error('Link de download não disponível');
        }
    };

    removeButton.onclick = removeAudio;

    document.getElementById('closeModal').addEventListener('click', function () {
        document.getElementById('errorModal').style.display = 'none';
    });

    document.getElementById('closeReportModal').addEventListener('click', function () {
        reportModal.style.display = 'none';
    });

    formatSelect.disabled = true;
});
