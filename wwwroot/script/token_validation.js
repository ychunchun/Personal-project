function checkTokenAndRedirect() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    Swal.fire({
      icon: "warning",
      title: "警告",
      text: "請先登入或註冊",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.href = "/admin/index.html";
    });
    return;
  }

  fetch("/api/User/userprofile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        console.log("已註冊");
      } else {
        console.error("token無效");
        Swal.fire({
          icon: "warning",
          title: "警告",
          text: "請先登入或註冊",
          confirmButtonText: "OK",
        }).then(() => {
          window.location.href = "/admin/index.html";
        });
      }
    })
    .catch((error) => {
      console.error("錯誤：", error);
    });
}

checkTokenAndRedirect();
