document.addEventListener("DOMContentLoaded", function () {
  // Get the token from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  console.log(token);
  // Store the token in localStorage
  if (token) {
    localStorage.setItem("accessToken", token);
  }

  const registerButton = document.querySelector(".btn-info"); // 選擇註冊按鈕
  registerButton.addEventListener("click", async function (event) {
    event.preventDefault(); // 阻止表單的預設提交行為

    const fullName = document.querySelector('[placeholder="名字"]').value;
    const email = document.querySelector('[placeholder="信箱"]').value;
    const password = document.querySelector('[placeholder="密碼"]').value;

    const userData = {
      user_name: fullName,
      email: email,
      password: password,
    };

    try {
      const response = await fetch("/api/User/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const responseData = await response.json();
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User has been registered successfully.",
          confirmButtonText: "OK",
        }).then(() => {
          // 跳轉到顯示登入畫面
          window.location.href = "/admin/login.html";
          //如果按鈕被點擊，則傳遞訊息到AddTransaction Hub
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to register user.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
});
