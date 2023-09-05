function generateMemberTable(
  accountBookId,
  members,
  isMainAccountBook,
  currentUserId,
  adminUser
) {
  const memberTableBody = document.createElement("tbody");
  memberTableBody.id = `memberTableBody-${accountBookId}`;

  //member表格
  members.forEach(function (member) {
    const row = document.createElement("tr");

    const userNameCell = document.createElement("td");
    userNameCell.textContent = member.userName;

    const roleCell = document.createElement("td");
    roleCell.textContent = member.role;
    roleCell.className = "text-center";

    row.appendChild(userNameCell);
    row.appendChild(roleCell);

    //刪除成員按鈕的判斷
    const deleteIconCell = document.createElement("td");
    if (
      !isMainAccountBook &&
      currentUserId === adminUser &&
      member.role !== "admin"
    ) {
      const deleteButton = document.createElement("button");
      deleteButton.className =
        "btn btn-danger btn-sm delete-member-button text-center";
      //deleteButton.type = "button";
      deleteButton.setAttribute("data-memberid", member.memberId);
      //deleteButton.setAttribute("id", "del");
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      //增加刪除成員按鈕的監聽，以便觸發刪除後的動作
      deleteButton.addEventListener("click", handleDeleteButtonClickMember);

      deleteIconCell.appendChild(deleteButton);
    }

    row.appendChild(deleteIconCell);

    memberTableBody.appendChild(row);
  });

  return memberTableBody;
}

//刪除成員按鈕的觸發行為
async function handleDeleteButtonClickMember(event) {
  console.log("Delete button clicked");
  const memberId = event.currentTarget.getAttribute("data-memberid");
  const result = await Swal.fire({
    title: "確認刪除",
    text: "你確認刪除這位成員嗎?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch("/api/Member/MemberStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
        body: JSON.stringify({ MemberId: memberId }),
      });
      console.log("Fetch response:", response);

      if (response.ok) {
        location.reload();
      } else {
        console.error("成員刪除失敗");
      }
    } catch (error) {
      console.error("發生錯誤:", error);
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const MemberContainer = document.getElementById("MemberContainer");

  fetch("/api/AccountBook/GetAccountBook", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const accountBooks = data.accountBooks;

      //將type=main的帳本排在第一個
      accountBooks.sort((a, b) => {
        if (a.accountBookType === "main") {
          return -1;
        } else if (b.accountBookType === "main") {
          return 1;
        }
        return 0;
      });

      //遍歷每個帳本，並且為每個帳本生成一張卡片
      accountBooks.forEach(function (accountBook) {
        const isMainAccountBook = accountBook.accountBookType === "main";
        const currentUserId = data.currentUserId;
        const adminUser = accountBook.adminUser;
        const accountBookCard = document.createElement("div");
        accountBookCard.className = "card";

        accountBookCard.innerHTML = `
          <div class="card-header card-outline card-info">
            <b>
              <h3 class="card-title">${accountBook.accountBookName}</h3>
              <br>
              <h3 class="card-title">NT$ ${accountBook.profit}</h3>
            </b>
            <div class="card-tools">
              ${
                currentUserId === adminUser
                  ? `
                  <a class="btn btn-info btn-sm" href="/admin/modify_accountbook.html?AccountBookId=${
                    accountBook.accountBookId
                  }" style="background-color:#505962; border-color: #505962 !important;">
                    <i class="fas fa-edit"></i>
                    修改帳本
                  </a>
                  ${
                    !isMainAccountBook
                      ? `
                  <a class="btn btn-danger btn-sm" data-accountbookid="${accountBook.accountBookId}">
                    <i class="fas fa-trash"></i>
                    刪除帳本
                  </a>
                  `
                      : ""
                  }
                  ${
                    isMainAccountBook
                      ? ""
                      : `
                  <a class="btn btn-info btn-sm" id="inviteButton" data-accountbookid="${accountBook.accountBookId}" style="background-color:#505962; border-color: #505962 !important;">
                    <i class="fas fa-user-plus"></i>
                    邀請成員
                  `
                  }
                  `
                  : ""
              }
              <span id="message-container" style="display: none;"></span>
                  </a>                  

              <a class="btn btn-info btn-sm" href="/admin/category_management.html?AccountBookId=${
                accountBook.accountBookId
              }" style="background-color:#505962; border-color: #505962 !important;">
                <i class="fas fa-eye"></i>
                帳本類別
              </a>
            </div>
          </div>
          <div class="card-body">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 20%">成員</th>
                  <th style="width: 8%" class="text-center">角色</th>
                  <th style="width: 20%" class="text-center"></th>
                </tr>
              </thead>
              <!-- 將生成的成員表放到這裡 -->
              ${
                generateMemberTable(
                  accountBook.accountBookId,
                  accountBook.members,
                  isMainAccountBook,
                  currentUserId,
                  adminUser
                ).outerHTML
              }
            </table>
          </div>
        `;

        MemberContainer.appendChild(accountBookCard);

        // 刪除帳本按鈕點監聽
        const deleteButton = accountBookCard.querySelector(".btn-danger");
        if (deleteButton) {
          deleteButton.addEventListener("click", handleDeleteButtonClick);
        }

        // 邀請成員按鈕點擊事件處理
        const inviteButton = accountBookCard.querySelector("#inviteButton");
        if (inviteButton) {
          inviteButton.addEventListener("click", (event) => {
            handleInviteButtonClick(event, accountBook.accountBookId);
          });
        }
      });

      // 處理所有帳本的總計
      const totalProfit = data.totalProfit;
      const totalProfitSpan = document.getElementById("totalProfit");
      totalProfitSpan.textContent = totalProfit;
    })
    .catch((error) => {
      console.error("錯誤：無法獲取數據。", error);
    });
});

// 刪除帳本觸發動作
async function handleDeleteButtonClick(event) {
  const accountBookId = event.currentTarget.getAttribute("data-accountbookid");

  const result = await Swal.fire({
    title: "確認刪除",
    text: "你確認刪除這個帳本嗎?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch("/api/AccountBook/AccountBookStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
        body: JSON.stringify({ AccountBookId: accountBookId }),
      });

      if (response.ok) {
        location.reload();
      } else if (response.status === 403) {
      } else {
        console.error("Failed to delete account book");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }
}

// 邀請成員按鈕的事件處理函式
async function handleInviteButtonClick(event, accountBookId) {
  try {
    const response = await fetch(
      `/api/Member/MemberShareLink?AccountBookId=${accountBookId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("access_token"),
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const accessToken = data.accountBookToken;
      const completeLink = `http://localhost:5158/admin/login.html?token=${accessToken}`;

      // 複製網址到剪貼板
      await navigator.clipboard.writeText(completeLink);

      //<span id="message-container-${accountBook.accountBookId}"
      const messageContainer = document.getElementById("message-container");

      // 顯示提示訊息
      const successMessage = "已成功複製網址";
      messageContainer.textContent = successMessage;
      messageContainer.style.display = "block";

      // 設定提示訊息消失的定時器
      setTimeout(() => {
        messageContainer.textContent = "";
        messageContainer.style.display = "none";
      }, 3000);
    } else {
      console.error("Failed to generate access token");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// if (messageContainer) {
//   // Set the success message
//   const successMessage =
//   messageContainer.textContent = successMessage;
//   messageContainer.style.display = "block";

//   // Set the timeout to clear the message
//   setTimeout(() => {
//     messageContainer.textContent = "";
//     messageContainer.style.display = "none";
//   }, 3000);

// } else {
//   console.error("Message container not found:", accountBook.accountBookId);
// }

// //測試刪除人員的code
// document.addEventListener("click", function (event) {
//   if (event.target.id === "del") {
//   }
// });

// var delbtn = document.getElementById("del");
// document.addEventListener("click", function () {
//   console.log("223444");
//   var memberId = null;
//   var h4Tags = document.getElementById("del");
//   h4Tags.forEach(function (h4Tag) {
//     h4Tag.addEventListener("click", function () {
//       memberId = h4Tag.getAttribute("name");
//       console.log("Member ID:", memberId);
//     });
//   });
// });
