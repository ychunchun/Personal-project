document.addEventListener("DOMContentLoaded", async function () {
  try {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const transactionId = url.searchParams.get("transactionId");
    const response = await fetch(
      `/api/transactions/TransactionDetails?transactionId=${transactionId}`,
      {
        method: "GET",
        // headers: {
        //   Authorization: "Bearer " + localStorage.getItem("access_token"), // 這裡添加 JWT Token
        // },
      }
    );

    // 找到 "修改" 按鈕元素，直接傳送包含transactionId的網址給button
    const modifyButton = document.querySelector(".modify-button");

    // 動態生成修改連結並設置 href 屬性
    if (modifyButton) {
      modifyButton.href = `/admin/modify_transaction.html?transactionId=${transactionId}`;
    }

    ////////////////////delete api//////////////////
    const deleteButton = document.querySelector(".delete-button");
    deleteButton.addEventListener("click", async (event) => {
      event.preventDefault();

      // 彈出確認框
      const result = await Swal.fire({
        title: "確認刪除",
        text: "你確認刪除這個帳目嗎?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });

      // 如果user點擊
      if (result.isConfirmed) {
        console.log("Transaction ID:", transactionId);
        const deleteResponse = await fetch(
          `/api/transactions/TransactionStatus?transactionId=${transactionId}`,
          {
            method: "POST",
            headers: {
              Authorization: "Bearer " + localStorage.getItem("access_token"),
            },
          }
        );

        if (deleteResponse.ok) {
          Swal.fire({
            icon: "success",
            title: "成功!",
            text: "帳目已被成功刪除",
            confirmButtonText: "OK",
          }).then(() => {
            // 跳轉到顯示類別畫面
            window.location.href = "/admin/home.html";
            //如果按鈕被點擊，則傳遞訊息到AddTransaction Hub
            console.log("Transaction deleted successfully");
          });
        } else {
          console.error("Failed to delete transaction.");
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "Failed to delete transaction.",
            confirmButtonText: "OK",
          });
        }
      }
    });

    if (response.ok) {
      const trasactionDetails = await response.json();

      //日期格式
      const dateTimeString = trasactionDetails.day;
      const dateOnlyString = dateTimeString.split("T")[0]; //只取得日期

      // 填充元素
      const accountElement = document.getElementById("account");
      const categoryElement = document.getElementById("category");
      const amountElement = document.getElementById("amount");
      const dayElement = document.getElementById("day");
      const detailsElement = document.getElementById("details");
      const recordedByElement = document.getElementById("recordedBy");

      if (
        accountElement &&
        categoryElement &&
        amountElement &&
        dayElement &&
        recordedByElement
      ) {
        accountElement.textContent = trasactionDetails.accountBookName;
        categoryElement.textContent = trasactionDetails.categoryName;
        amountElement.textContent = trasactionDetails.amount;
        dayElement.textContent = dateOnlyString;
        detailsElement.textContent = trasactionDetails.details;
        recordedByElement.textContent = trasactionDetails.userName;
      }
    } else {
      console.error("Failed to fetch transaction details.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
