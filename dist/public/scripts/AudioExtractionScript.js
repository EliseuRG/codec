document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('audioForm');
    const videoUpload = document.getElementById('videoUpload');
    const dropzone = document.getElementById('dropzone');
    const sendButton = document.getElementById('sendButton');
    const removeButton = document.getElementById('removeButton');
    const downloadButton = document.getElementById('downloadButton');
    const videoPlayer = document.getElementById('videoPlayer');
    const errorModal = document.getElementById('errorModal');
    const closeModal = document.getElementById('closeModal');
    const errorMessage = document.getElementById('errorMessage');
  
    function showErrorModal(message) {
      errorMessage.textContent = message;
      errorModal.style.display = 'block';
    }
  
    closeModal.addEventListener('click', () => {
      errorModal.style.display = 'none';
    });
  
    window.addEventListener('click', (event) => {
      if (event.target === errorModal) {
        errorModal.style.display = 'none';
      }
    });
  
    dropzone.addEventListener('click', () => {
      videoUpload.click();
    });
  
    videoUpload.addEventListener('change', () => {
      if (videoUpload.files.length > 0) {
        const file = videoUpload.files[0];
        const url = URL.createObjectURL(file);
        videoPlayer.src = url;
        videoPlayer.style.display = 'block';
        sendButton.disabled = false;
        removeButton.disabled = false;
        downloadButton.disabled = true;
      }
    });
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const formData = new FormData();
      formData.append('videoFile', videoUpload.files[0]);
  
      try {
        const response = await fetch('/extract-audio', {
          method: 'POST',
          body: formData,
        });
  
        const result = await response.json();
        if (response.ok) {
          downloadButton.disabled = false;
          downloadButton.onclick = () => {
            window.location.href = result.downloadLink;
          };
        } else {
          showErrorModal(result.error || 'Erro desconhecido ao extrair o áudio');
        }
      } catch (error) {
        showErrorModal(error.message || 'Erro ao enviar o arquivo');
      }
    });
  
    removeButton.addEventListener('click', () => {
      videoUpload.value = '';
      videoPlayer.src = '';
      videoPlayer.style.display = 'none';
      sendButton.disabled = true;
      removeButton.disabled = true;
      downloadButton.disabled = true;
    });
  });
  