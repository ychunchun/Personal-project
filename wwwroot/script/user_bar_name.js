document.addEventListener("DOMContentLoaded", async function () {
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

      if (usernameElement) {
        usernameElement.textContent = userData.data.name;
      }
    } else {
      console.error("Failed to fetch user profile");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
