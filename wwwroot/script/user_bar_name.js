document.addEventListener("DOMContentLoaded", async function () {
  const logout = document.getElementById("logout");

  //登出
  logout.addEventListener("click", function () {
    logout.style.cursor = "pointer";
    localStorage.clear();
    window.location.href = "/admin/index.html";
  });

  try {
    const response = await fetch("/api/User/userprofile", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("access_token"), // 這裡添加 JWT Token
      },
    });

    if (response.ok) {
      const userData = await response.json();

      // 填充使用者名稱和電子郵件到對應的 HTML 元素
      const usernameElement = document.getElementById("username");
      const imageElement = document.getElementById("User Image");

      if (usernameElement) {
        usernameElement.textContent = userData.data.name;
        imageElement.src = userData.data.picture;
      }
    } else {
      console.error("Failed to fetch user profile");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
