const accountNameSelect = document.getElementById("accountName");
let accountBookMap = {}; //map accountbookname, accountbookid
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

    const data = await response.json();
    const accountBooks = data.accountBooks;

    //Main帳本排序第一
    accountBooks.sort((a, b) => {
      if (a.accountBookName === "Main" && b.accountBookName !== "Main") {
        return -1;
      }
      if (a.accountBookName !== "Main" && b.accountBookName === "Main") {
        return 1;
      }
      return 0;
    });

    accountBooks.forEach((accountBook) => {
      const option = document.createElement("option");
      option.textContent = accountBook.accountBookName;
      option.value = accountBook.accountBookName;
      accountNameSelect.appendChild(option);

      //因為下拉選單是Name，所以需要一個陣列來Map
      accountBookMap[accountBook.accountBookName] = accountBook.accountBookId;
    });

    // 下拉選單新增監聽 selectedAccountBookName
    accountNameSelect.addEventListener("change", function () {
      selectedAccountBookName = accountNameSelect.value;
      const accountBookId = accountBookMap[selectedAccountBookName];

      // 清空通知容器
      const container = document.getElementById("notificationContainer");
      container.innerHTML = "";

      fetchAndDisplayNotifications(accountBookId);
    });
    // 取得下拉選單的第一個選項的值（帳簿名稱）
    const defaultAccountBookName = accountNameSelect.options[0].value;
    const defaultAccountBookId = accountBookMap[defaultAccountBookName];

    // 將第一個選項設定為預設選擇
    accountNameSelect.value = defaultAccountBookName;
    accountNameSelect.dispatchEvent(new Event("change")); // 觸發 change 事件
  } catch (error) {
    console.error("Error fetching account books:", error);
  }
}

fetchAccountBooks();

async function fetchAndDisplayNotifications(accountBookId) {
  try {
    const accessToken = localStorage.getItem("access_token");
    const response = await fetch(
      `/api/history/Gethistory?AccountBookId=${accountBookId}`,
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
    notifications.sort(
      (a, b) => new Date(b.currentTime) - new Date(a.currentTime)
    );
    // 只顯示20筆
    const latestNotifications = notifications.slice(0, 20);

    const container = document.getElementById("notificationContainer");

    latestNotifications.forEach((notification) => {
      const listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";
      const notificationText = `${notification.date} ${notification.userName} ${notification.operationType} a ${notification.categoryType} : ${notification.categoryName} $${notification.amount} `;

      const notificationSpan = document.createElement("span");
      notificationSpan.textContent = notificationText;

      listItem.appendChild(notificationSpan);

      // 將list加到通知container
      container.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error fetching and displaying notifications:", error);
    const container = document.getElementById("notificationContainer");
    container.innerHTML = "No history available for selected account book!";
  }
}

fetchAndDisplayNotifications();
