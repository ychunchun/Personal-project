const form = document.querySelector("#AccountBookContainer form");

// 監聽
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // 獲取form的值
  const accountBookName = document.querySelector("#accountbookname").value;
  const initialBalance = parseInt(
    document.querySelector("#initialbalance").value
  ); //解析為整數

  const data = {
    AccountBookName: accountBookName,
    InitialBalance: initialBalance,
  };

  try {
    const response = await fetch("/api/AccountBook/CreateAccountBook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("access_token"), //如果後端有要求token權限，一定要記得加這兩行
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "成功!",
        text: "帳本新增成功.",
        confirmButtonText: "OK",
      }).then(() => {
        window.location.href = "/admin/AccountBook Management.html";
      });
    } else {
      console.error("Failed to add account book.");
      Swal.fire({
        icon: "error",
        title: "失敗",
        text: "帳本刪除失敗",
        confirmButtonText: "OK",
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
});
