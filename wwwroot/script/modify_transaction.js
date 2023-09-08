// 在 DOMContentLoaded 事件中執行以下程式碼
document.addEventListener("DOMContentLoaded", async function () {
  // 解析 URL 中的 transactionId 參數
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get("transactionId");

  // 確認是否成功取得 transactionId
  console.log("Transaction ID:", transactionId);
  const categoryTypeSelect = document.getElementById("categoryType");
  const categoryNameSelect = document.getElementById("categoryName");
  const form = document.getElementById("transaction-form");
  const accountNameSelect = document.getElementById("accountName");

  // 發送 API 請求以獲取帳簿數據
  async function fetchAccountBooks() {
    try {
      const response = await fetch("/api/AccountBook/GetAccountBook", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access_token"), // 添加 JWT Token
        },
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const responseData = await response.json();
      const accountBooks = responseData.accountBooks;

      accountBooks.forEach((accountBook) => {
        const option = document.createElement("option");
        option.textContent = accountBook.accountBookName;
        option.value = accountBook.accountBookId;
        accountNameSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching account books:", error);
    }
  }

  // Add event listener to accountNameSelect
  accountNameSelect.addEventListener("change", (event) => {
    const selectedAccountId = event.target.value;
    console.log("Selected Account Book ID:", selectedAccountId);
  });

  fetchAccountBooks();

  //////////////針對category_type的選擇，給出相對應的category_name的下拉選單/////////////
  categoryTypeSelect.addEventListener("change", async function () {
    const selectedCategoryType = categoryTypeSelect.value;
    const selectedAccountBookId = accountNameSelect.value;
    const selectedAccountBookOption = accountNameSelect.querySelector(
      `[value="${selectedAccountBookId}"]`
    );

    try {
      const response = await fetch(
        `/api/Category/GetCategory?displayType=${selectedCategoryType}&accountBookId=${selectedAccountBookId}`
      );
      const categories = await response.json();

      // Clear previous options
      categoryNameSelect.innerHTML = "";
      const categoriesArray = Object.values(categories);
      // Populate the categoryNameSelect with fetched categories
      categoriesArray.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.category_name;
        option.textContent = category.category_name;
        categoryNameSelect.appendChild(option);
      });
      //選曲第一個類別名稱的值，並設為預設
      const firstCategoryOption = categoryNameSelect.options[0];
      if (firstCategoryOption) {
        const defaultCategoryName = firstCategoryOption.value;
        categoryNameSelect.value = defaultCategoryName;
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  });

  let user_id; // 宣告成全域變數，讓後面的寫入也可以使用
  try {
    const response = await fetch("/api/User/userprofile", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("access_token"), // 這裡添加 JWT Token
      },
    });

    if (response.ok) {
      const userData = await response.json();
      user_id = userData.data.user_id;
      console.log("Successfully obtained user_id:", user_id);
    } else {
      console.error("Failed to fetch user profile");
    }
  } catch (error) {
    console.error("Error:", error);
  }

  // 發送 API 請求以獲取交易詳細資訊
  async function fetchTransactionDetails() {
    try {
      const response = await fetch(
        `/api/Transactions/TransactionDetails?transactionId=${transactionId}`
      );
      if (!response.ok) {
        throw new Error("API request failed");
      }

      const transactionDetails = await response.json();
      // 將獲取的交易詳細資訊填充到表單元素中
      fillFormWithTransactionDetails(transactionDetails);
    } catch (error) {
      console.error("Error fetching transaction details:", error);
    }
  }

  const amountInput = document.getElementById("amount");
  const transactionDateInput = document.getElementById("transaction-date");
  const detailsInput = document.getElementById("details");
  // 將交易詳細資訊填充到表單元素中
  function fillFormWithTransactionDetails(details) {
    const accountNameSelect = document.getElementById("accountName");
    const categoryTypeSelect = document.getElementById("categoryType");
    const categoryNameSelect = document.getElementById("categoryName");

    accountNameSelect.value = details.accountBookName;
    categoryTypeSelect.value = details.categoryType;
    // 觸發類別類型選擇事件，以填充對應的類別名稱選項
    categoryTypeSelect.dispatchEvent(new Event("change"));
    categoryNameSelect.value = details.categoryName;
    amountInput.value = details.amount;
    transactionDateInput.value = details.day.slice(0, 10); // 格式化日期
    detailsInput.value = details.details;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    //這一段會引起回傳值變500
    const selectedAccountBookId = accountNameSelect.value;
    const selectedAccountBookOption = accountNameSelect.querySelector(
      `[value="${selectedAccountBookId}"]`
    );

    const updatedTransactionData = {
      // 從表單中獲取所需的修改後的交易詳細資訊
      user_id: user_id,
      transactionId: transactionId,
      account_book_name: selectedAccountBookOption.textContent, // 使用帳本名稱
      category_type: categoryTypeSelect.value,
      category_name: categoryNameSelect.value,
      amount: parseFloat(amountInput.value),
      transaction_date: transactionDateInput.value,
      details: detailsInput.value,
    };

    try {
      const response = await fetch(`/api/Transactions/UpdateTransaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTransactionData),
      });

      if (response.ok) {
        // 更新成功，執行相應的處理
        Swal.fire({
          icon: "success",
          title: "成功！",
          text: "帳目更新成功(:",
          confirmButtonText: "OK",
        }).then(() => {
          // 跳轉到顯示類別畫面
          window.location.href = "/admin/home.html";
        });
      } else {
        // 更新失敗，執行相應的處理
        Swal.fire({
          icon: "error",
          title: "錯誤:(",
          text: "帳目更新失敗",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  });

  // 執行取得交易詳細資訊的 API 請求
  fetchTransactionDetails();
});
