// const accountNameSelect = document.getElementById("accountName");
// const userNameSelect = document.getElementById("memberName"); // 新增用戶名選擇下拉選單
// let accountBookMap = {}; //map accountbookname, accountbookid
// ///////////////下拉選單給user選accountbook///////////////////////
// // 發送 API 請求以獲取帳簿數據
// async function fetchAccountBooks() {
//   try {
//     const response = await fetch("/api/AccountBook/GetAccountBook", {
//       method: "GET",
//       headers: {
//         Authorization: "Bearer " + localStorage.getItem("access_token"), // 添加 JWT Token
//       },
//     });

//     if (!response.ok) {
//       throw new Error("API request failed");
//     }

//     const data = await response.json();
//     const accountBooks = data.accountBooks;

//     //Main帳本排序第一
//     // accountBooks.sort((a, b) => {
//     //   if (a.accountBookName === "Main" && b.accountBookName !== "Main") {
//     //     return -1;
//     //   }
//     //   if (a.accountBookName !== "Main" && b.accountBookName === "Main") {
//     //     return 1;
//     //   }
//     //   return 0;
//     // });

//     accountBooks.forEach((accountBook) => {
//       const option = document.createElement("option");
//       option.textContent = accountBook.accountBookName;
//       option.value = accountBook.accountBookName;
//       accountNameSelect.appendChild(option);

//       //因為下拉選單是Name，所以需要一個陣列來Map
//       accountBookMap[accountBook.accountBookName] = accountBook.accountBookId;
//     });

//     // 下拉選單新增監聽 selectedAccountBookName
//     accountNameSelect.addEventListener("change", function () {
//       selectedAccountBookName = accountNameSelect.value;
//       const accountBookId = accountBookMap[selectedAccountBookName];

//       // 清空通知容器
//       const container = document.getElementById("notificationContainer");
//       container.innerHTML = "";

//       fetchAndDisplayNotifications(accountBookId);
//     });
//     // 取得下拉選單的第一個選項的值（帳簿名稱）
//     const defaultAccountBookName = accountNameSelect.options[0].value;
//     const defaultAccountBookId = accountBookMap[defaultAccountBookName];

//     // 將第一個選項設定為預設選擇
//     accountNameSelect.value = defaultAccountBookName;
//     accountNameSelect.dispatchEvent(new Event("change")); // 觸發 change 事件
//   } catch (error) {
//     console.error("Error fetching account books:", error);
//   }
// }

const accountNameSelect = document.getElementById("accountName");
const userNameSelect = document.getElementById("memberName"); // 新增用戶名選擇下拉選單
let accountBookMap = {}; //map accountbookname, accountbookid

async function populateMemberDropdown(selectedAccountBook) {
  userNameSelect.innerHTML = ""; // 使用 userNameSelect 代替 memberSelect

  if (selectedAccountBook.accountBookType !== "main") {
    const allMembersOption = document.createElement("option");
    allMembersOption.textContent = "所有成員";
    allMembersOption.value = ""; // 不設定值，代表選擇所有成員
    userNameSelect.appendChild(allMembersOption);
  }

  selectedAccountBook.members.forEach((member) => {
    const option = document.createElement("option");
    option.textContent = member.userName;
    option.value = member.userName; // 設定選項的值為用戶名
    userNameSelect.appendChild(option);
  });

  if (selectedAccountBook.accountBookType !== "main") {
    userNameSelect.value = ""; // 選擇所有成員
  }
}

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

    const data = await response.json();
    const accountBooks = data.accountBooks;

    accountBooks.forEach((accountBook) => {
      const option = document.createElement("option");
      option.textContent = accountBook.accountBookName;
      option.value = accountBook.accountBookId; // 將 accountBookId 設為 option 的 value
      accountNameSelect.appendChild(option);

      //因為下拉選單是 accountBookName，所以需要一個陣列來 Map
      accountBookMap[accountBook.accountBookName] = accountBook.accountBookId;
    });

    // 下拉選單新增監聽 selectedAccountBookId
    accountNameSelect.addEventListener("change", function () {
      const selectedAccountBookId = accountNameSelect.value; // 獲取選擇的 accountBookId
      const selectedUserName = userNameSelect.value; // 獲取選擇的用戶名

      // 清空通知容器
      // const container = document.getElementById("notificationContainer");
      // container.innerHTML = "";

      fetchAndDisplayNotifications(selectedAccountBookId, selectedUserName);
    });

    // 取得下拉選單的第一個選項的值（帳簿名稱）
    const defaultAccountBookName = accountNameSelect.options[0].textContent;
    const defaultAccountBookId = accountBookMap[defaultAccountBookName];

    // 將第一個選項設定為預設選擇
    accountNameSelect.value = defaultAccountBookId;
    accountNameSelect.dispatchEvent(new Event("change")); // 觸發 change 事件
  } catch (error) {
    console.error("Error fetching account books:", error);
  }
}

fetchAccountBooks();

async function fetchAndDisplayNotifications(accountBookId, userName) {
  try {
    const accessToken = localStorage.getItem("access_token");
    const response = await fetch(
      `/api/history/Gethistory?AccountBookId=${accountBookId}&UserName=${userName}`, // 將 userName 加入 URL 參數
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
      const noDataMessage = document.createElement("tr");
      noDataMessage.innerHTML = `
        <td colspan="5">查找範圍無對應數據</td>
      `;
      tableBody.appendChild(noDataMessage);
    } else {
      notifications.forEach((notification, index) => {
        const newRow = document.createElement("tr");
        newRow.setAttribute("data-transaction-id", notification.transaction_id); // 將transaction_id存储在整行的data-*屬性中

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
    console.error("Error fetching and displaying notifications:", error);
    const container = document.getElementById("notificationContainer");
    container.innerHTML = "No history available for selected account book!";
  }
}

fetchAndDisplayNotifications();
