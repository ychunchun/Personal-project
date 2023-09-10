document.addEventListener("DOMContentLoaded", function () {
  // 獲取URL參數中的AccountBookId值
  const urlParams = new URLSearchParams(window.location.search);
  const AccountBookId = parseInt(urlParams.get("AccountBookId"));

  const accountBookNameInput = document.getElementById("accountbookname");
  const initialBalanceInput = document.getElementById("initialbalance");
  const updateButton = document.getElementById("update-button");

  console.log("帳本 ID:", AccountBookId);
  // 發起API請求
  fetch("/api/AccountBook/GetAccountBook", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("access_token"), // 如果後端有要求 token 權限，一定要記得加這兩行
    },
  })
    .then((response) => response.json())
    .then((data) => {
      var accountBooks = data.accountBooks;
      var selectedAccountBook = accountBooks.find(function (book) {
        return book.accountBookId === AccountBookId;
      });

      if (selectedAccountBook) {
        // 填充帳本名稱和帳本初始金額到表單
        accountBookNameInput.value = selectedAccountBook.accountBookName;
        initialBalanceInput.value = selectedAccountBook.initialBalance;
      }
    })
    .catch((error) => {
      console.error("API請求出錯：", error);
    });

  updateButton.addEventListener("click", async function (event) {
    event.preventDefault(); // 阻止預設表單提交
    const updatedAccountBookName = accountBookNameInput.value;
    const updatedInitialBalance = parseFloat(initialBalanceInput.value);

    // 更新的數據
    const updatedData = {
      accountBookId: AccountBookId,
      accountBookName: updatedAccountBookName,
      initialBalance: updatedInitialBalance,
    };

    // 更新資料
    try {
      const response = await fetch("/api/AccountBook/UpdateAccountBook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        console.log("資料已成功更新");
        Swal.fire({
          icon: "success",
          title: "成功!",
          text: "帳本修改成功",
          confirmButtonText: "OK",
        }).then(() => {
          window.location.href = "/admin/AccountBook Management.html";
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "錯誤!",
          text: "帳本修改失敗 (請檢查欄位格式且不得為空值)",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("API請求出錯，具體信息：", error.message);
    }
  });
});
