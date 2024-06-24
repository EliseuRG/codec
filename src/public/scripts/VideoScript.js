var dropzone = document.getElementById('dropzone');
var input = document.getElementById('videoUpload');
var video = document.getElementById('videoPlayer');
var removeButton = document.getElementById('removeButton');
var sendButton = document.getElementById('sendButton');
var downloadButton = document.getElementById('downloadButton');

console.log("[VH] Script: ");
function updateButtonStatus(isEnabled) {
  removeButton.disabled = !isEnabled;
  sendButton.disabled = !isEnabled;
  downloadButton.disabled = true;

  if (isEnabled) {
    removeButton.classList.remove('disabled');
    sendButton.classList.remove('disabled');
  } else {
    removeButton.classList.add('disabled');
    sendButton.classList.add('disabled');
  }
}

var originalFileName = '';

input.onchange = function () {
  console.log("[VH] Script: onchange");
  var file = input.files[0];
  originalFileName = file.name;
  var videoURL = URL.createObjectURL(file);
  setVideoSource(videoURL, file);
};

dropzone.onclick = function () {
  console.log("[VH] Script: onclick");
  input.click();
};

dropzone.ondragover = function (event) {
  console.log("[VH] Script: ondragover");
  event.preventDefault();
  dropzone.style.backgroundColor = '#f0f0f0';
};

dropzone.ondragleave = function (event) {
  console.log("[VH] Script: ondragleave");
  event.preventDefault();
  dropzone.style.backgroundColor = '#fff';
};

dropzone.ondrop = function (event) {
  console.log("[VH] Script: ondrop");
  event.preventDefault();
  dropzone.style.backgroundColor = '#fff';
  var file = event.dataTransfer.files[0];
  originalFileName = file.name;
  var videoURL = URL.createObjectURL(file);
  setVideoSource(videoURL, file);
};

function setVideoSource(url, file) {
  console.log("[VH] Script: setVideoSource");
  video.src = url;
  video.srcBlob = file;
  video.load();
  video.oncanplaythrough = function () {
    video.style.display = "block";
    updateButtonStatus(true);
  };
}

function removeVideo(event) {
  if (event) event.preventDefault();
  video.src = "";
  video.style.display = "none";
  updateButtonStatus(false);
  input.value = "";
}

removeButton.addEventListener('click', removeVideo);

document.getElementById('videoForm').addEventListener('submit', function (event) {
  event.preventDefault();
  console.log("[VH] Script: addEventListener");
  
  // Desabilitar botão de enviar e remover vídeo
  sendButton.disabled = true;
  sendButton.classList.add('disabled');
  removeVideo(null);

  var formData = new FormData();
  formData.append('video', video.srcBlob, originalFileName);
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      if (request.status == 400) {
        document.getElementById('errorMessage').textContent = request.responseText;
        document.getElementById('errorModal').style.display = 'block';
        setTimeout(function () {
          document.getElementById('errorModal').style.display = 'none';
        }, 3000);
      } else if (request.status == 200) {
        var response = JSON.parse(request.responseText);
        console.log("RESPONSE: ", response);
        var downloadLink = response.downloadLink;
        var originalName = response.originalName;
        if (downloadLink && originalName) {
          localStorage.setItem('compressedVideoInfo', JSON.stringify({ downloadLink: downloadLink, originalName: originalName }));
          console.log("LOCALSTORAGE: ", localStorage);
          downloadButton.disabled = false;
        }
        // Atualiza as informações dos vídeos no modal
        updateVideoInfo('original', response.originalVideoInfo);
        updateVideoInfo('compressed', response.compressedVideoInfo);
        document.getElementById('reportModal').style.display = 'block';
      }
    }
  };
  request.open('POST', '/compress');
  request.send(formData);
});

function downloadVideo(event) {
  event.preventDefault();

  var link = document.createElement('a');
  var compressedVideoInfo = JSON.parse(localStorage.getItem('compressedVideoInfo'));

  if (!compressedVideoInfo || !compressedVideoInfo.downloadLink) {
    console.error('Informações do vídeo comprimido não encontradas.');
    return;
  }

  var originalName = compressedVideoInfo.originalName || 'video_compressed';
  var downloadName = originalName.replace(/(\.\w+)?$/, '_compressed$1');

  link.href = compressedVideoInfo.downloadLink;
  link.download = downloadName;
  link.click();

  resetAfterDownload(); // Chama a função para limpar e desativar os botões
}

function resetAfterDownload() {
  video.src = "";
  video.style.display = "none";
  input.value = "";
  updateButtonStatus(false);
  localStorage.removeItem('compressedVideoInfo');
}

downloadButton.addEventListener('click', downloadVideo);

document.getElementById('closeModal').addEventListener('click', function () {
  document.getElementById('errorModal').style.display = 'none';
});

document.getElementById('closeReportModal').addEventListener('click', function () {
  document.getElementById('reportModal').style.display = 'none';
});
