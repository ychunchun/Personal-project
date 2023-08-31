document.addEventListener("DOMContentLoaded", function () {
  // Get the token from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  // Store the token in localStorage
  if (token) {
    localStorage.setItem("accessToken", token);
  }

  const loginButton = document.querySelector(".btn-info"); // 選擇登入按鈕
  loginButton.addEventListener("click", async function (event) {
    event.preventDefault(); // 阻止表單的預設提交行為

    const email = document.querySelector('[placeholder="Email"]').value;
    const password = document.querySelector('[placeholder="Password"]').value;

    const loginData = {
      provider: "native",
      email: email,
      password: password,
    };

    // 檢查 localStorage 中是否存在token
    const accessToken = localStorage.getItem("accessToken");

    // 定義 API 請求的 headers
    const headers = {
      "Content-Type": "application/json",
    };

    // 如果token存在，則加到 headers 中
    if (accessToken) {
      headers["Authorization"] = "Bearer " + accessToken;
      console.log("accessToken", accessToken);
    }

    try {
      const response = await fetch("/api/User/login", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const responseData = await response.json(); // 解析 JSON 數據
        // 存儲 access_token 到 localStorage
        localStorage.setItem("access_token", responseData.data.access_token);

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Logged in successfully.",
          confirmButtonText: "OK",
        }).then(() => {
          window.location.href = "/admin/home.html";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to log in.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
});
