$(document).ready(function () {
  $("#date-range").daterangepicker({
    opens: "left",
    ranges: {
      本日: [moment(), moment()],
      本週: [moment().startOf("week"), moment().endOf("week")],
      本月: [moment().startOf("month"), moment().endOf("month")],
      今年: [moment().startOf("year"), moment().endOf("year")],
    },
    locale: {
      format: "YYYY-MM-DD", // 日期格式
      separator: " - ", // 分隔號
      applyLabel: "選擇", // 使用按鈕
      cancelLabel: "取消", // 取消按鈕
      fromLabel: "From", // 起始日期
      toLabel: "To", // 結束日期
      customRangeLabel: "自訂範圍",
    },
  });
});

document.addEventListener("DOMContentLoaded", async function () {
  const accountNameSelect = document.getElementById("accountName");
  const memberSelect = document.getElementById("memberName");
  const dateSelect = document.getElementById("date-range");

  const categoryButtons = document.querySelectorAll(".button22");
  const apiUrl = "/api/AccountBook/GetAccountBook";
  let accountBooks = [];

  //根據選擇的帳本填充member，並根據帳本類型判斷是否要加入"所有成員"的選項
  async function populateMemberDropdown(selectedAccountBook) {
    memberSelect.innerHTML = "";

    if (selectedAccountBook.accountBookType !== "main") {
      const allMembersOption = document.createElement("option");
      allMembersOption.textContent = "所有成員";
      allMembersOption.value = "";
      memberSelect.appendChild(allMembersOption);
    }

    selectedAccountBook.members.forEach((member) => {
      const option = document.createElement("option");
      option.textContent = member.userName;
      option.value = member.userId;
      memberSelect.appendChild(option);
    });

    if (selectedAccountBook.accountBookType !== "main") {
      memberSelect.value = "";
    }
  }

  //獲取帳本數據，並填充下拉選單。同時設置預設值
  async function fetchAccountBooks() {
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      accountBooks = data.accountBooks;

      accountBooks.forEach((accountBook) => {
        const option = document.createElement("option");
        option.textContent = accountBook.accountBookName;
        accountNameSelect.appendChild(option);
      });

      const firstAccountBook = accountBooks[0];
      if (firstAccountBook) {
        populateMemberDropdown(firstAccountBook);
        // 設定預設值
        accountNameSelect.value = firstAccountBook.accountBookName;
        memberSelect.value = ""; // 所有成員

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();

        const defaultStartDate = `${year}-${month
          .toString()
          .padStart(2, "0")}-01`;
        const defaultEndDate = `${year}-${month
          .toString()
          .padStart(2, "0")}-${daysInMonth}`;

        dateSelect.value = `${defaultStartDate} - ${defaultEndDate}`;

        categoryButtons.forEach((btn) => {
          btn.classList.remove("selected");
          if (btn.value === "支出") {
            btn.classList.add("selected");
          }
        });

        fetchTransactionsIfNeeded(); // 獲取交易數據
      }

      //根據帳本選擇不同，給予不同的值
      accountNameSelect.addEventListener("change", async function () {
        const selectedAccountBookName = accountNameSelect.value;
        const selectedAccountBook = accountBooks.find(
          (accountBook) =>
            accountBook.accountBookName === selectedAccountBookName
        );

        if (selectedAccountBook) {
          populateMemberDropdown(selectedAccountBook);
        }
      });
    } catch (error) {
      console.error("Error fetching account books:", error);
    }
  }

  var doughnutChart; //要設為全域變數，才可以即時更新
  function generateChart(data) {
    var ctx = document.getElementById("doughnutChart").getContext("2d");

    if (doughnutChart) {
      doughnutChart.destroy(); // 銷毀現有圖表
    }

    if (data && data.categories) {
      var categories = data.categories;

      doughnutChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: categories.map((category) => category.categoryName),
          datasets: [
            {
              data: categories.map((category) => category.totalAmount),
              backgroundColor: categories.map((category) =>
                getBackgroundColor(category.categoryName)
              ),
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      });
    }

    //根據類別名稱的不同，給予不同的顏色，透過hash code
    function getBackgroundColor(categoryName) {
      var hash = 5381;
      for (var i = 0; i < categoryName.length; i++) {
        hash = (hash * 33) ^ categoryName.charCodeAt(i);
      }
      var color = "#" + (hash >>> 0).toString(16).slice(0, 6);
      return color;
    }
  }

  //分類按鈕監聽，當按鈕被點擊，則為選中，獲選值傳到函示中
  categoryButtons.forEach((categoryButton) => {
    categoryButton.addEventListener("click", function () {
      categoryButtons.forEach((btn) => {
        btn.classList.remove("selected");
      });
      categoryButton.classList.add("selected");
      const selectedCategoryType = categoryButton.value;
      const selectedDateRange = dateSelect.value;
      const selectedAccountBookName = accountNameSelect.value;
      const selectedMemberId = memberSelect.value;

      fetchTransactions(
        selectedCategoryType,
        selectedDateRange,
        selectedAccountBookName,
        selectedMemberId
      );
    });
  });

  //日期監聽
  dateSelect.addEventListener("change", function () {
    fetchTransactionsIfNeeded();
  });

  //根據當前選中的參數獲取數據，用於變動選擇時可以獲取最新數據
  function fetchTransactionsIfNeeded() {
    const selectedCategoryType =
      document.querySelector(".button22.selected").value;
    const selectedDateRange = dateSelect.value;
    const selectedAccountBookName = accountNameSelect.value;
    const selectedMemberId = memberSelect.value;

    fetchTransactions(
      selectedCategoryType,
      selectedDateRange,
      selectedAccountBookName,
      selectedMemberId
    );
  }

  await fetchAccountBooks();

  //傳送參數到API
  async function fetchTransactions(
    categoryType,
    dateRange,
    accountBookName,
    memberId
  ) {
    // Fetch data from API using provided parameters
    const response = await fetch(
      `/api/Home/GetFilteredTransactions?dateRange=${dateRange}&categoryType=${categoryType}&accountBookName=${accountBookName}&userId=${memberId}`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
      }
    );

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    generateChart(data);

    // 渲染數據到表格
    const tableBody = document.getElementById("transactionTableBody");
    tableBody.innerHTML = ""; // 清空表格内容

    if (data.filteredWithTotal.length === 0) {
      const noDataMessage = document.createElement("tr");
      noDataMessage.innerHTML = `
        <td colspan="5">查找範圍無對應數據</td>
      `;
      tableBody.appendChild(noDataMessage);
    } else {
      data.filteredWithTotal.forEach((transaction, index) => {
        const newRow = document.createElement("tr");
        newRow.setAttribute("data-transaction-id", transaction.transaction_id); // 將transaction_id存储在整行的data-*屬性中
        newRow.innerHTML = `
    <td>${index + 1}</td>
    <td>${new Date(transaction.day).toLocaleDateString()}</td>
    <td>${transaction.categoryName}</td>
    <td>${transaction.amount}</td>
    <td>${transaction.userName}</td>
  `;
        newRow.style.cursor = "pointer"; // 變鼠標
        tableBody.appendChild(newRow);
      });
    }

    const totalAmountSpan = document.getElementById("total-amount");

    if (totalAmountSpan) {
      const totalAmount = data.filteredWithTotal.reduce((sum, transaction) => {
        return sum + transaction.amount;
      }, 0);

      totalAmountSpan.textContent = `總金額: NT$ ${totalAmount}`;
    }
  }

  const tableBody = document.querySelector(".table-head-fixed tbody");
  // 增加監聽，導航到detail頁
  tableBody.addEventListener("click", (event) => {
    const clickedRow = event.target.closest("tr");
    if (clickedRow) {
      const transactionId = clickedRow.getAttribute("data-transaction-id");
      redirectToDetail(transactionId);
    }
  });

  function redirectToDetail(transactionId) {
    // 使用transaction_id做為參數
    console.log(transactionId);
    window.location.href = `/admin/transaction_detail.html?transactionId=${transactionId}`;
  }
});
