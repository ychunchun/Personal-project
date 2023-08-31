// render 卡片
function renderAccountBooks(accountBooks) {
  // 將 accountBooks 按照 accountBookType 進行排序
  accountBooks.sort((a, b) => {
    if (a.accountBookType === "main") {
      return -1; // 將 "main" 的元素排在前面
    } else if (b.accountBookType === "main") {
      return 1;
    }
    return 0; // 其他情況保持原有順序
  });

  var accountBookList = document.getElementById("accountBookList");

  accountBooks.forEach(function (accountBook) {
    var accountBookCard = document.createElement("div");
    accountBookCard.className = "card";

    accountBookCard.innerHTML = `
        <div class="card-header card-outline card-info">
          <b><h3 class="card-title">${accountBook.accountBookName}</h3></b>
          <div class="card-tools">
            <button type="button" class="btn btn-tool" data-card-widget="collapse" title="Collapse">
              <i class="fas fa-minus"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <ul class="list-group">
            <!-- Member items will be added here -->
          </ul>
          ${
            accountBook.accountBookType !== "main"
              ? `
          <button class="btn btn-info btn-block delete-button mt-3" id="inviteButton">Invite other ones</button>
        <div style="display: none;" id="accountBookId">${accountBook.accountBookId}</div>
        <div id="accessTokenLink" style="display: none;"></div>

        `
              : ""
          }
        </div>
      `;

    var memberList = accountBookCard.querySelector(".list-group");

    accountBook.members.forEach(function (member) {
      var listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center"; //可以將內容分開

      const userNameElement = document.createElement("b");
      userNameElement.textContent = `${member.userName}`;
      userNameElement.className = "mr-auto";

      const roleElement = document.createElement("a");
      roleElement.textContent = `${member.role}`;
      roleElement.className = "ml-auto mr-2";

      listItem.appendChild(userNameElement);
      listItem.appendChild(roleElement);

      memberList.appendChild(listItem);

      // 判斷是否加入刪除圖示。如果不為main帳本，且為sub帳本的admin，才會在“editor”的後面加上icon(admin不會有)
      //拿main帳本的username最為比較基準
      if (accountBook.accountBookType !== "main") {
        const mainAdmin = accountBook.members.find(
          (member) =>
            member.userName === accountBook.members[0].userName &&
            member.role === "admin"
        );

        if (mainAdmin && member.userName !== mainAdmin.userName) {
          const deleteIcon = document.createElement("i");
          deleteIcon.className = "fa fa-trash";

          const deleteIconDiv = document.createElement("div");
          deleteIconDiv.style.display = "none";
          deleteIconDiv.textContent = `${member.memberId}`;

          deleteIcon.appendChild(deleteIconDiv);

          listItem.appendChild(userNameElement);
          listItem.appendChild(roleElement);
          listItem.appendChild(deleteIcon);

          memberList.appendChild(listItem);
        }
      }

      //點擊icon進行狀態刪除
      listItem.addEventListener("click", async (event) => {
        if (accountBook.accountBookType === "main") {
          // Do not perform any action for main account books
          return;
        }
        const memberIdString =
          event.currentTarget.querySelector("i > div").textContent;
        const memberId = parseInt(memberIdString, 10);

        const result = await Swal.fire({
          title: "Confirm Deletion",
          text: "Do you want to delete this account book?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
        });

        if (result.isConfirmed) {
          // Send POST request to AccountBookStatus API
          try {
            const response = await fetch("/api/Member/MemberStatus", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("access_token"),
              },
              body: JSON.stringify({ MemberId: memberId }),
            });

            if (response.ok) {
              location.reload();
            } else {
              console.error("Failed to delete member");
            }
          } catch (error) {
            console.error("An error occurred:", error);
          }
        }
      });
    });

    accountBookList.appendChild(accountBookCard);

    if (accountBook.accountBookType !== "main") {
      const inviteButton = accountBookCard.querySelector("#inviteButton");
      const accessTokenLink = accountBookCard.querySelector("#accessTokenLink");
      const accountBookId = accountBook.accountBookId;

      inviteButton.addEventListener("click", async () => {
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
            console.log("accessToken", accessToken);
            const completeLink = `http://localhost:5158/admin/register.html?token=${accessToken}`;

            //嘗試寫一個read only 的textbox讓user直接點擊按鈕複製link
            // const accessTokenInput = document.createElement("input");
            // accessTokenInput.type = "text";
            // accessTokenInput.value = completeLink;
            // document.body.appendChild(accessTokenInput);

            // const copyButton = document.createElement("button");
            // copyButton.textContent = "Copy Link";
            // document.body.appendChild(copyButton);

            // copyButton.addEventListener("click", async () => {
            //   try {
            //     await navigator.clipboard.writeText(accessTokenInput.value);
            //     console.log("Text copied to clipboard");
            //   } catch (error) {
            //     console.error("Failed to copy text: ", error);
            //   }
            // });
            const linkText = `Shared Link: ${completeLink}`;
            accessTokenLink.textContent = linkText;
            accessTokenLink.style.display = "block";
            // const accessTokenLink = document.getElementById("accessTokenLink");
            // accessTokenLink.innerHTML = `<a href="${completeLink}" target="_blank">Access Token Link</a>`;
            // accessTokenLink.style.display = "block";
          } else {
            console.error("Failed to generate access token");
          }
        } catch (error) {
          console.error("An error occurred:", error);
        }
      });
    }
  });
}

// 一點頁面就打API
window.onload = function () {
  fetch("/api/AccountBook/GetAccountBook", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("access_token"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      renderAccountBooks(data.accountBooks);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
};
