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

    // 表单验证逻辑
    const namePattern = /^[A-Za-z\u4e00-\u9fa5]+$/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const passwordPattern = /^[A-Za-z0-9]+$/;

    if (!namePattern.test(fullName)) {
      Swal.fire({
        icon: "error",
        title: "錯誤",
        html: `<b>名字格式不符合要求</b><br><b>(只能是長度15碼以內的中英文字)</b>`,
        confirmButtonText: "OK",
      });
      return;
    }

    if (!emailPattern.test(email)) {
      Swal.fire({
        icon: "error",
        title: "錯誤",
        html: `<b>信箱格式不符合要求</b><br><b>（例如：user@example.com）</b>`,
        confirmButtonText: "OK",
      });
      return;
    }

    if (!passwordPattern.test(password)) {
      Swal.fire({
        icon: "error",
        title: "錯誤",
        html: `<b>密碼格式不符合要求 </b><br><b>（必須是介於6~12碼的，大小寫英文字或數字）</b>`,
        confirmButtonText: "OK",
      });
      return;
    }

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
          title: "成功!",
          text: "註冊成功",
          confirmButtonText: "OK",
        }).then(() => {
          // 跳轉到顯示登入畫面
          window.location.href = "/admin/login.html";
          //如果按鈕被點擊，則傳遞訊息到AddTransaction Hub
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "錯誤",
          html: `<b>註冊失敗</b><br><b>（信箱無法重複註冊）</b>`,
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
});
