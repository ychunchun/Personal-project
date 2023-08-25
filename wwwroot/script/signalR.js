/////////////以下SignalR
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/AddTransactionHub")
  .build();
connection.on("ReceiveTransactionNotification", (transactionInfo) => {
  // const bell = document.getElementById("bell");
  // bell.textContent = transactionInfo;
  // console.log("Test:", transactionInfo);

  // 在通知區域顯示收到的通知
  // const notificationArea = document.getElementById("notificationArea");
  // const notificationElement = document.createElement("div");
  // notificationElement.innerText = `Received transaction notification: ${transactionInfo}`;
  // notificationArea.appendChild(notificationElement);

  var li = document.createElement("li");
  li.classList.add("dropdown-item"); // 添加選單項目的樣式

  // 創建標題元素
  var heading = document.createElement("h3");
  heading.textContent = transactionInfo;
  li.appendChild(heading);

  // 創建內容元素
  var p = document.createElement("h2");
  var a = document.createElement("a");
  a.innerText = "點選";
  a.setAttribute("href", transactionInfo);
  a.setAttribute("target", "_blank");
  p.appendChild(a);
  li.appendChild(p);

  var dropdownMenu = document.getElementById("dropdownMenu");
  dropdownMenu.appendChild(li);
});

connection
  .start()
  .then(() => {
    console.log("Connected to SignalR Hub.");
  })
  .catch((error) => {
    console.error("Error connecting to SignalR Hub:", error);
  });
