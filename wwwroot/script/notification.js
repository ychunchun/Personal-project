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

      // 存储 notificationId 在元素的 dataset 中
      icon.dataset.notificationId = notification.notification_id;

      listItem.appendChild(notificationSpan);
      listItem.appendChild(icon);

      // 將list加到通知容器中
      container.appendChild(listItem);

      // 添加事件监听器到 listItem
      listItem.addEventListener("click", async (event) => {
        const notificationId =
          event.currentTarget.querySelector("i").dataset.notificationId;
        console.log(
          "Clicked on trash icon for notification with ID:",
          notificationId
        );

        // 将 notificationId 作为请求参数发送到状态 API
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
          // 成功处理状态更新
        } else {
          // 处理错误情况
        }
      });
    });
  } catch (error) {
    console.error("Error fetching data", error);
  }
}

fetchAndDisplayNotifications();
