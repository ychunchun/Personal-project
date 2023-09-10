document.addEventListener("DOMContentLoaded", async function () {
  /////////////////監聽/////////////////
  const categoryTypeSelect = document.getElementById("categoryType");
  const categoryNameSelect = document.getElementById("categoryName");
  const form = document.getElementById("transaction-form");
  const accountNameSelect = document.getElementById("accountName");

  //////////////////////////以下為預設值設定//////////////////////
  // 預設值
  const defaultCategoryType = "支出";

  // 是設值觸發事件
  categoryTypeSelect.value = defaultCategoryType;

  // 訂定日期的預設值
  form.transaction_date.value = new Date().toISOString().slice(0, 10);

  ///////////////下拉選單給user選accountbook///////////////////////

  // 發送 API 請求以獲取帳簿數據
  async function fetchAccountBooks() {
    try {
      const response = await fetch("/api/AccountBook/GetAccountBook", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access_token"),
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

      if (accountBooks.length > 0) {
        accountNameSelect.value = accountBooks[0].accountBookId;
      }
      // 處理categoryType變化的函數
      handleCategoryTypeChange();
    } catch (error) {
      console.error("Error fetching account books:", error);
    }
  }

  // 對accountNameSelect加上監聽
  accountNameSelect.addEventListener("change", (event) => {
    const selectedAccountId = event.target.value;
    console.log("Selected Account Book ID:", selectedAccountId);
    handleCategoryTypeChange();
  });

  fetchAccountBooks();

  //////////////針對category_type的選擇，給出相對應的category_name的下拉選單/////////////
  async function handleCategoryTypeChange() {
    const selectedCategoryType = categoryTypeSelect.value;
    const selectedAccountBookId = accountNameSelect.value;

    try {
      const response = await fetch(
        `/api/Category/GetCategory?displayType=${selectedCategoryType}&accountBookId=${selectedAccountBookId}`
      );
      const categories = await response.json();

      // 清空之前的選項
      categoryNameSelect.innerHTML = "";

      // Populate the categoryNameSelect with fetched categories
      categories.forEach((category) => {
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
  }

  // 頁面第一次載入的時候使用預設值
  handleCategoryTypeChange();

  // 之後使用監聽追蹤user的選擇
  categoryTypeSelect.addEventListener("change", handleCategoryTypeChange);

  /////////////////針對所有要新增的transaction欄位做處理，打addtransaction api/////////////
  //連線到AddTransaction Hub
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("/AddTransactionHub")
    .build();

  connection
    .start()
    .then(() => {
      console.log("Connected to SignalR Hub.");
    })
    .catch((error) => {
      console.error("Error connecting to SignalR Hub:", error);
    });

  //////////////從profile api取得user_id，並儲存在底下的post api////////////
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

  //////////////將add transaction資料送出//////////////
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    //使用選取的帳本 ID 從選項元素中獲取帳本名稱
    const selectedAccountBookId = accountNameSelect.value;
    const selectedAccountBookOption = accountNameSelect.querySelector(
      `[value="${selectedAccountBookId}"]`
    );

    // 獲取選取的帳本名稱
    const accountName = selectedAccountBookOption.textContent;
    const categoryType = categoryTypeSelect.value;
    const categoryName = categoryNameSelect.value;
    const amount = parseFloat(form.amount.value);
    const transactionDate = new Date(form.transaction_date.value);
    const formattedTransactionDate = `${transactionDate.getFullYear()}-${(
      transactionDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${transactionDate
      .getDate()
      .toString()
      .padStart(2, "0")}`;
    const details = form.details.value;

    const data = {
      user_id: user_id, // 使用外部宣告的 user_id
      account_book_name: accountName,
      category_type: categoryType,
      category_name: categoryName,
      amount: amount,
      transaction_date: formattedTransactionDate,
      details: details,
      accountbookId: selectedAccountBookId,
    };

    try {
      const response = await fetch("/api/Transactions/AddTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      //給user成功或錯誤的判斷
      if (response.ok) {
        //是傳api result到hub，不是前端的data
        const result = await response.json();
        console.log("Received result from API:", result);
        Swal.fire({
          icon: "success",
          title: "成功!",
          text: "帳目新增成功",
          confirmButtonText: "OK",
        }).then(() => {
          // 跳轉到顯示類別畫面
          window.location.href = "/admin/home.html";
          //如果按鈕被點擊，則傳遞訊息到AddTransaction Hub
          console.log("okkkk");
          connection.invoke("SendAddTransaction", JSON.stringify(result));
        });
        // 清空輸入字段
        form.amount.value = "";
        form.transaction_date.value = "";
        form.details.value = "";
      } else {
        Swal.fire({
          icon: "error",
          title: "錯誤",
          text: "帳目新增失敗",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  });
});
