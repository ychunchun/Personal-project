document.addEventListener("DOMContentLoaded", async function () {
  /////////////////監聽/////////////////
  const categoryTypeSelect = document.getElementById("categoryType");
  const categoryNameSelect = document.getElementById("categoryName");
  const form = document.getElementById("transaction-form");
  const accountNameSelect = document.getElementById("accountName");

  ///////////////下拉選單給user選accountbook///////////////////////

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

      const accountBooks = await response.json();

      accountBooks.forEach((accountBook) => {
        const option = document.createElement("option");
        option.textContent = accountBook.accountBookName;
        accountNameSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching account books:", error);
    }
  }

  fetchAccountBooks();

  //////////////針對category_type的選擇，給出相對應的category_name的下拉選單/////////////
  categoryTypeSelect.addEventListener("change", async function () {
    const selectedCategoryType = categoryTypeSelect.value;

    try {
      const response = await fetch(
        `/api/Category/GetCategory?displayType=${selectedCategoryType}`
      );
      const categories = await response.json();

      // Clear previous options
      categoryNameSelect.innerHTML = "";

      // Populate the categoryNameSelect with fetched categories
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.category_name;
        option.textContent = category.category_name;
        categoryNameSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  });

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
    } else {
      console.error("Failed to fetch user profile");
    }
  } catch (error) {
    console.error("Error:", error);
  }

  //////////////將add transaction資料送出//////////////
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const accountName = accountNameSelect.value;
    const categoryType = categoryTypeSelect.value;
    const categoryName = categoryNameSelect.value;
    const amount = parseFloat(form.amount.value);
    const transactionDate = new Date(form.transaction_date.value);
    const details = form.details.value;

    const data = {
      user_id: user_id, // 使用外部宣告的 user_id
      account_book_name: accountName,
      category_type: categoryType,
      category_name: categoryName,
      amount: amount,
      transaction_date: transactionDate.toISOString(),
      details: details,
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
          title: "Success!",
          text: "Transaction has been added successfully.",
          confirmButtonText: "OK",
        }).then(() => {
          // 跳轉到顯示類別畫面
          //window.location.href = "/admin/show_category.html";
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
          title: "Error!",
          text: "Failed to add transaction.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error sending request:", error);
    }
  });
});
