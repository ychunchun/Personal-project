let deleteButton2;
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
      const deleteButton2 = document.createElement("button");
      deleteButton2.className =
        "btn btn-danger btn-sm delete-member-button text-center";
      deleteButton2.setAttribute("data-memberid", member.memberId);
      deleteButton2.innerHTML = '<i class="fas fa-trash" id="trash-icon"></i>';
      deleteIconCell.appendChild(deleteButton2);
    }
    row.appendChild(deleteIconCell);

    memberTableBody.appendChild(row);
  });

  return memberTableBody;
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

      //刪除成員按鈕的監聽
      // document.addEventListener("click", handleDeleteButtonClickMember);
      // document
      //   .getElementById("trash-icon")
      //   .addEventListener("click", handleDeleteButtonClickMember);
      // deleteButton2.addEventListener("click", handleDeleteButtonClickMember);
      document
        .querySelector(".delete-member-button")
        .addEventListener("click", handleDeleteButtonClickMember);
    })
    .catch((error) => {
      console.error("錯誤：無法獲取數據。", error);
    });
});

//刪除成員按鈕的觸發行為
async function handleDeleteButtonClickMember() {
  console.log("Delete button clicked");
  // const memberId1 = event.target.getAttribute("data-memberid");
  // console.log("1", memberId1);
  // const memberId3 = event.target.this("data-memberid");
  // console.log("3", memberId3);
  //const memberId = event.currentTarget.getAttribute("data-memberid");
  const memberId = this.getAttribute("data-memberid");
  const result = await Swal.fire({
    title: "確認刪除",
    text: "確認要刪除這位成員嗎?",
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

// 刪除帳本觸發動作
async function handleDeleteButtonClick(event) {
  const accountBookId = event.target.getAttribute("data-accountbookid");
  // const memberId2 = event.target.getAttribute("data-accountbookid");
  // console.log("2", memberId2);
  const result = await Swal.fire({
    title: "確認刪除",
    text: "確認要刪除這個帳本嗎?",
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
      //const completeLink = `https://yuchunchun.online/admin/login.html?token=${accessToken}`;

      // 複製網址到剪貼板
      await navigator.clipboard.writeText(completeLink);

      // 複製成功訊息
      const successMessage = "已成功複製網址！您可以開始分享";
      Swal.fire({
        icon: "success",
        title: "成功",
        text: successMessage,
        showConfirmButton: false,
        timer: 3000,
      });
    } else {
      console.error("連結生成失敗");
    }
  } catch (error) {
    console.error("發生錯誤:", error);
  }
}
