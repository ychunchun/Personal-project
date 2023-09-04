document.addEventListener("DOMContentLoaded", function () {
  // 獲取URL參數中的AccountBookId值
  const urlParams = new URLSearchParams(window.location.search);
  const AccountBookId = parseInt(urlParams.get("AccountBookId"));

  const accountBookNameInput = document.getElementById("accountbookname");
  const initialBalanceInput = document.getElementById("initialbalance");
  const updateButton = document.getElementById("update-button");

  console.log("Transaction ID:", AccountBookId);
  // 發起API請求
  fetch("/api/AccountBook/GetAccountBook", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("access_token"), //如果後端有要求token權限，一定要記得加這兩行
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

  updateButton.addEventListener("click", function (event) {
    event.preventDefault(); //阻止預設表單提出
    const updatedAccountBookName = accountBookNameInput.value;
    const updatedInitialBalance = parseFloat(initialBalanceInput.value);

    // 更新的數據
    const updatedData = {
      accountBookId: AccountBookId,
      accountBookName: updatedAccountBookName,
      initialBalance: updatedInitialBalance,
    };

    // 更新資料
    fetch("/api/AccountBook/UpdateAccountBook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("access_token"),
      },
      body: JSON.stringify(updatedData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("資料已成功更新：", data);
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "資料已成功更新。",
            confirmButtonText: "OK",
          }).then(() => {
            window.location.href = "/admin/AccountBook Management.html";
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "資料已成功更新。",
            confirmButtonText: "OK",
          }).then(() => {
            window.location.href = "/admin/AccountBook Management.html";
          });
        }
      })
      .catch((error) => {
        console.error("API請求出錯，具體信息：", error.message);
      });
  });
});
