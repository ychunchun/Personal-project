document.addEventListener("DOMContentLoaded", function () {
  const categoryButtons = document.querySelectorAll(".btn-info");
  const dateButtons = document.querySelectorAll(".btn-outline-info");
  const container = document.getElementById("filtered-transactions-container");
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

      // 預設值
      let selectedAccountBookName = accountNameSelect.options[0].value; //下拉選單第一個選項做為預設
      console.log("cppl:", selectedAccountBookName);
      fetchTransactionsIfNeeded();
      // 獲取選定的AccountBookName

      // 下拉選單新增監聽 selectedAccountBookName
      accountNameSelect.addEventListener("change", function () {
        selectedAccountBookName = accountNameSelect.value;
        console.log("selectedAccountBookName:", selectedAccountBookName);
        fetchTransactionsIfNeeded();
      });
    } catch (error) {
      console.error("Error fetching account books:", error);
    }
  }

  fetchAccountBooks();

  ////////////////////篩選transaction//////////////////
  //第一次載入的預設值
  let selectedCategoryType = "expense";
  let selectedDateRange = "month";

  //針對類別按鈕做迴圈
  categoryButtons.forEach((categoryButton) => {
    categoryButton.addEventListener("click", function () {
      categoryButtons.forEach((btn) => {
        // 移除先前的選擇樣式
        btn.classList.remove("selected");
      });
      categoryButton.classList.add("selected");
      selectedCategoryType = categoryButton.getAttribute("data-category");
      selectedDateRange = null; // 重置日期範圍選擇，只需要重置一個就好，避免發生錯誤
      fetchTransactionsIfNeeded();
    });
  });
  //針對日期按鈕做迴圈
  dateButtons.forEach((dateButton) => {
    dateButton.addEventListener("click", function () {
      dateButtons.forEach((btn) => {
        btn.classList.remove("selected");
      });
      dateButton.classList.add("selected");
      selectedDateRange = dateButton.getAttribute("data-date-range");
      fetchTransactionsIfNeeded();
    });
  });

  //將兩個參數彙整，並傳送到api
  function fetchTransactionsIfNeeded() {
    const selectedAccountBookName = accountNameSelect.value;
    if (
      selectedCategoryType !== null &&
      selectedDateRange !== null &&
      selectedAccountBookName !== null
    ) {
      fetchTransactions(
        selectedCategoryType,
        selectedDateRange,
        selectedAccountBookName
      );
    }
  }
  //////////////////打api顯示transaction/////////////////
  function fetchTransactions(categoryType, dateRange, accountBookName) {
    //console.log("Fetching data with categoryType:", categoryType);
    //console.log("Fetching data with dateRange:", dateRange);

    fetch(
      `/api/Home/GetFilteredTransactions?dateRange=${dateRange}&categoryType=${categoryType}&accountBookName=${accountBookName}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        //console.log("Data received from API:", data); // 處理從 API 返回的 data，將交易記錄顯示
        const transactionList = document.getElementById(
          "filtered-transactions"
        );
        // 顯示總和
        const totalAmountSpan = document.getElementById("total-amount");
        const dateRangeTextElement = document.getElementById("date-range-text");
        const container = document.getElementById(
          "filtered-transactions-container"
        );
        // 判斷如果沒有交易資料
        if (data.length === 0) {
          dateRangeTextElement.textContent = "";
          container.innerHTML = `<p>No transactions found for this ${selectedDateRange}.</p>`;
          if (totalAmountSpan) {
            totalAmountSpan.textContent = "NT$ 0";
          }
        } else {
          const buttonDivs = []; // 創建一個空陣列來存儲 buttonDiv
          //回傳到前端
          data.forEach((transaction) => {
            const dateTimeString = transaction.day;
            const buttonDiv = document.createElement("div");
            const dateOnlyString = dateTimeString.split("T")[0]; //只取得日期
            buttonDiv.classList.add(
              "btn",
              "btn-outline-info",
              "btn-block",
              "btn-flat",
              "transaction-button"
            );
            buttonDiv.textContent = `${dateOnlyString}  ${transaction.categoryName}   NT$ ${transaction.amount}`;
            dateRangeTextElement.textContent = `${data[0].dateRangeText}`;
            buttonDivs.push(buttonDiv); // 將 buttonDiv 添加到陣列

            // 每筆transaction butoon 的點擊監聽
            buttonDiv.addEventListener("click", () => {
              // 函數封閉，確保正確抓取當前的transaction
              console.log(transaction.transaction_id);
              redirectToDetail(transaction.transaction_id);
            });
          });
          //導到detail頁面
          function redirectToDetail(transactionId) {
            //使用transaction_id做為參數
            console.log(transactionId);
            window.location.href = `/admin/transaction_detail.html?transactionId=${transactionId}`;
          }

          container.innerHTML = ""; // 重新選擇時，需清空列表
          buttonDivs.forEach((buttonDiv) => {
            container.appendChild(buttonDiv);
          });

          // 顯示總和
          if (totalAmountSpan) {
            totalAmountSpan.textContent = `NT$ ${data[0].totalAmount}`;
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }
});
