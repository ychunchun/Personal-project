async function fetchAndDisplayNotifications() {
  try {
    const accessToken = localStorage.getItem("access_token");
    const response = await fetch("/api/Notification/GetNotification", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }
    const notifications = await response.json();

    // Sort notifications by currentTime in descending order
    notifications.sort(
      (a, b) => new Date(b.currentTime) - new Date(a.currentTime)
    );
    // Limit notifications to the latest 20
    const latestNotifications = notifications.slice(0, 20);

    const container = document.getElementById("notificationContainer");

    latestNotifications.forEach((notification) => {
      const listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";
      const notificationText = `${notification.currentTime} ${notification.userName} ${notification.operationType} a ${notification.categoryType} : ${notification.categoryName} $${notification.amount} in ${notification.accountBookName}`;

      const notificationSpan = document.createElement("span");
      notificationSpan.textContent = notificationText;

      const icon = document.createElement("i");
      icon.className = "fa fa-trash";

      // <div> 元素，儲存notificationId
      const notificationIdDiv = document.createElement("div");
      notificationIdDiv.style.display = "none"; // 初始時隱藏
      notificationIdDiv.textContent = notification.notificationId;

      icon.appendChild(notificationIdDiv);
      listItem.appendChild(notificationSpan);
      listItem.appendChild(icon);

      // 將list加到通知container
      container.appendChild(listItem);

      listItem.addEventListener("click", async (event) => {
        // 獲取 <i> 元素的 v
        const notificationIdString =
          event.currentTarget.querySelector("i > div").textContent;
        const notificationId = parseInt(notificationIdString, 10); // 字串轉整數

        //視窗提醒是否刪除
        const result = await Swal.fire({
          title: "Confirm Deletion",
          text: "Do you want to delete this message?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
        });

        //發送notificationId為參數到API
        if (result.isConfirmed) {
          const response = await fetch("/api/Notification/NotificationStatus", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + accessToken,
            },
            body: JSON.stringify({
              notificationId: notificationId,
            }),
          });

          if (response.ok) {
            location.reload(); //刷新當前頁
          }
        }
      });
    });
  } catch (error) {
    console.error("Error fetching data", error);
  }
}

fetchAndDisplayNotifications();
