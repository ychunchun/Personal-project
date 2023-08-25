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

    ////////////////////delete api//////////////////
    const deleteButton = document.querySelector(".delete-button");
    deleteButton.addEventListener("click", async (event) => {
      event.preventDefault(); //
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
          title: "Success!",
          text: "Transaction has been deleted successfully.",
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

      if (accountElement && categoryElement && amountElement && dayElement) {
        accountElement.textContent = trasactionDetails.accountBookName;
        categoryElement.textContent = trasactionDetails.categoryName;
        amountElement.textContent = trasactionDetails.amount;
        dayElement.textContent = dateOnlyString;
        detailsElement.textContent = trasactionDetails.details;
      }
    } else {
      console.error("Failed to fetch transaction details.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
