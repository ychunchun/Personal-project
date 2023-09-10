document.addEventListener("DOMContentLoaded", async function () {
  const accountNameSelect = document.getElementById("accountName");
  const memberSelect = document.getElementById("memberName");

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
      option.value = member.userName;
      memberSelect.appendChild(option);
    });
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
      // if (firstAccountBook) {
      //   populateMemberDropdown(firstAccountBook);
      //   // 設定預設值
      //   accountNameSelect.value = firstAccountBook.accountBookName;
      //   memberSelect.value = ""; // 所有成員

      //   fetchTransactionsIfNeeded(); // 獲取交易數據
      // }

      if (firstAccountBook.accountBookType === "main") {
        //populateMemberDropdown(firstAccountBook);
        // 設定預設值
        memberSelect.value = firstAccountBook.members[0].userId;
      } else {
        // 如果第一個帳本的類型不是 "main"，設置第二個下拉選單（成員選擇框）的預設值為第一個成員的 userId
        memberSelect.value = ""; // 所有成員
      }

      populateMemberDropdown(firstAccountBook);

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
      fetchTransactionsIfNeeded();
    } catch (error) {
      console.error("Error fetching account books:", error);
    }
  }

  //根據當前選中的參數獲取數據，用於變動選擇時可以獲取最新數據
  function fetchTransactionsIfNeeded() {
    const selectedAccountBookName = accountNameSelect.value;
    const selectedMemberOption =
      memberSelect.options[memberSelect.selectedIndex];
    const selectedMemberValue = selectedMemberOption.value;

    // 找到選擇的帳簿對應的 accountBookId 和 userName
    // 在此處找到選擇的帳簿對應的 accountBookId 和 userName
    const selectedAccountBook = accountBooks.find(
      (accountBook) => accountBook.accountBookName === selectedAccountBookName
    );

    if (selectedAccountBook) {
      const selectedAccountBookId = selectedAccountBook.accountBookId;

      // 檢查選項的值是否為空（所有成員），如果是則回傳空值
      if (selectedMemberValue === "") {
        fetchTransactions(selectedAccountBookId, "");
      } else {
        // 檢查選項的文本是否包含 "(你)"，然後拆分以獲取用戶名
        const selectedMemberText = selectedMemberOption.textContent;
        const hasCurrentUserTag = selectedMemberText.includes("(你)");
        const selectedUserName = hasCurrentUserTag
          ? selectedMemberText.split(" ")[0]
          : selectedMemberText;

        fetchTransactions(selectedAccountBookId, selectedUserName);
      }
    }
  }
  await fetchAccountBooks();

  ///////////////////////////////將篩選參數傳送到API/////////////////////////
  async function fetchTransactions(accountBookId, userName) {
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await fetch(
        `/api/history/Gethistory?AccountBookId=${accountBookId}&UserName=${userName}`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error("API request failed");
      }
      const notifications = await response.json();

      // 時間近到遠排序
      notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
      // // 只顯示20筆
      // const latestNotifications = notifications.slice(0, 20);

      const tableBody = document.getElementById("transactionTableBody");
      tableBody.innerHTML = ""; // 清空表格内容

      if (notifications.length === 0) {
        //回傳值為空的，會跳出錯誤
        const noDataMessage = document.createElement("tr");
        noDataMessage.innerHTML = `
      <td colspan="5">查找範圍無對應數據</td>
    `;
        tableBody.appendChild(noDataMessage);
      } else {
        notifications.forEach((notification, index) => {
          const newRow = document.createElement("tr");
          newRow.setAttribute(
            "data-transaction-id",
            notification.transaction_id
          );

          // 將日期格式轉換為正確格式（MM/dd）
          const rawDateParts = notification.date.split("/");
          const formattedDate = `${rawDateParts[0].padStart(
            2,
            "0"
          )}/${rawDateParts[1].padStart(2, "0")}`;

          newRow.innerHTML = `
        <td>${index + 1}</td>
        <td>${formattedDate}</td>
        <td>${notification.categoryName}</td>
        <td>${notification.operationType}</td>
        <td>${notification.amount}</td>
        <td>${notification.userName}</td>
      `;
          //newRow.style.cursor = "pointer"; // 變鼠標
          tableBody.appendChild(newRow);
        });
      }
    } catch (error) {
      //查詢值不正確或是DB連線時，會出現的錯誤
      console.error("Error fetching:", error);

      const tableBody = document.getElementById("transactionTableBody");
      tableBody.innerHTML = ""; // 清空表格內容

      const noDataMessage = document.createElement("tr");
      noDataMessage.innerHTML = `
      <td colspan="5">查找範圍無對應數據</td>
    `;
      tableBody.appendChild(noDataMessage);
    }
  }

  // 在帳本名稱和成員選擇變更時觸發更新交易記錄
  accountNameSelect.addEventListener("change", function () {
    fetchTransactionsIfNeeded();
  });

  memberSelect.addEventListener("change", function () {
    fetchTransactionsIfNeeded();
  });
});
