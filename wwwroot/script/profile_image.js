function openImageUploader() {
  Swal.fire({
    title: "確認更換圖片",
    text: "您確定要更換您的圖片嗎？",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "確定",
    cancelButtonText: "取消",
  }).then((result) => {
    if (result.isConfirmed) {
      const fileInput = document.getElementById("file-input");
      fileInput.click(); // 觸發文件上傳輸入框的點選事件
    }
  });
}

//上傳圖片事件
async function handleImageUpload(event) {
  const selectedFile = event.target.files[0];

  const formData = new FormData();
  formData.append("profile_image", selectedFile);

  try {
    const response = await fetch("/api/User/UploadImage", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("access_token"), // 這裡添加 JWT Token
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      // 更新前端照片，並顯示
      const ImageElement = document.getElementById("User profile picture");
      ImageElement.src = data.filePath;
      Swal.fire("上傳成功", "您的圖片已成功更換！", "success");
    } else {
      Swal.fire("上傳失敗", "請再試一次。", "error");
    }
  } catch (error) {
    Swal.fire("錯誤", "發生了一個錯誤。", "error");
  }
}
